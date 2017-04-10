/* eslint-disable no-console */
const fs = require('fs');
const omit = require('lodash.omit');
const ora = require('ora');
const otplib = require('otplib').default;
const path = require('path');
const pick = require('lodash.pick');
const program = require('commander');
const QR = require('qrcode');

const pkg = require('../package.json');

const DEFAULT_FILENAME = 'otplib.json';
const DEFAULT_QRCODE_FILENAME = 'otplib-qrcode.png';
const CLI_OPTIONS = [
  'config',
  'epoch',
  'keylength',
  'mode',
  'output',
  'secret',
  'service',
  'user'
];
const SUPPORT_ALGORITHM = [
  'sha1',
  'sha256',
  'sha512'
];
const cwd = process.cwd();

program
  .version(pkg.version)
  .option('-k, --secret [key]', 'provide a secret key')
  .option('-c, --config [path]', 'path to configuration file', DEFAULT_FILENAME)
  .option('-m, --mode [mode]', 'operation mode. (hotp | totp | authenticator)')
  .option('-d, --digits [number]', 'number of digits in token', 6)
  .option('-a, --algorithm [type]', 'algorithm to generate for totp (' + SUPPORT_ALGORITHM.join(' | ') + ')', 'sha1')
  .option('-s, --step [number]', 'time step (totp / authenticator)', 30);

program
  .command('init')
  .description('initialise a new configuration')
  .option('-l, --keylength [len]', 'length of secret key', 20)
  .option('-o, --output [filename]', 'output file. default: otplib.json', DEFAULT_FILENAME)
  .action(initialise);

program
  .command('generate')
  .description('generate new tokens')
  .option('-e, --epoch [number]', 'time since UNIX epoch (totp / authenticator)')
  .option('--counter [number]', 'current counter for HOTP', 0)
  .action(generate);

program
  .command('verify [token]')
  .description('validate a token against the setting or configuration')
  .action(verify);

program
  .command('qrcode')
  .option('--user [name]', 'user to associate with this', 'my token')
  .option('--issuer [name]', 'your service name', 'otplib')
  .option('--keyuri', 'show the key uri instead of QR Code')
  .option('-o, --output [filename]', 'output file. default: otplib-qrcode.png', DEFAULT_QRCODE_FILENAME)
  .description('generate a QR Code from configuration')
  .action(qrcode);

program.parse(process.argv);

if (!program.args.length) {
  program.help()
};

function getConfig(options = {}) {
  var config = {}

  if (program.config) {
    try {
      config = require(path.join(cwd, program.config));
    } catch (e) {
      console.error('No config file provided');
      return null;
    }
  }

  config = Object.assign({}, config, {
    algorithm: program.algorithm || config.algorithm,
    digits: program.digits || config.digits,
    mode: program.mode || config.mode,
    secret: program.secret || config.secret,
    step: options.step || config.step
  });

  if (!config.secret) {
    console.error('No secret provided');
    return null;
  }

  return {
    cli: pick(config, CLI_OPTIONS),
    options: omit(config, CLI_OPTIONS)
  };
}

function initialise(opts){
  let spinner = ora('Generating config').start();
  const outputPath = path.join(cwd, opts.output);

  let config = {}
  try {
    require(outputPath);
    spinner.fail('A configuration file of the same name already exists');

  } catch (e) {
    config.secret = otplib.authenticator
      .generateSecret(Number(opts.keylength));

    config.mode = program.mode
      ? program.mode.toLowerCase()
      : 'hotp';

    config.digits = program.digits;

    if (config.mode === 'totp') {
      config.algorithm = program.algorithm;

      if (SUPPORT_ALGORITHM.indexOf(config.algorithm) < 0) {
        spinner.fail('Unsupported algorithm. Accepted values: ' + SUPPORT_ALGORITHM.join(' | '));
        return;
      }
    }

    if (config.mode === 'totp' || config.mode === 'authenticator') {
      config.step = Number(program.step);
    }

    spinner.succeed('Done');

    // Sort keys
    let ordered = {};
    Object.keys(config)
      .sort()
      .forEach((key) => {
        ordered[key] = config[key];
      })

    spinner = ora('Writing to file').start();

    fs.writeFile(outputPath, JSON.stringify(ordered, null, 2), function(err) {
      if (err) {
        spinner.fail('Error writing to file');
        console.error(err);
        return;
      }

      spinner.succeed('Finished');
      ordered.secret = '**************';
      console.log(JSON.stringify(ordered, null, 2));
      return;
    });
  }
}

function line(token, text = 'code') {
  return '[' + text + '] ' + token;
}

function createGenerator(otp, config, display) {
  display.color = 'green';

  let token = otp.generate(config.cli.secret);
  const yellow = Math.ceil(config.options.step / 2);

  return function generator() {
    const epoch = Math.floor(new Date().getTime() / 1000.0);
    const count = epoch % config.options.step;
    const timeLeft = config.options.step - count;

    if (timeLeft < 5) {
      display.color = 'red';
    } else if (timeLeft < yellow) {
      display.color = 'yellow';
    }

    if (count === 0){
      token = otp.generate(config.cli.secret);
      display.color = 'green';
    }
    display.text = line(token, timeLeft + 's');
  }
}

function generate(opts) {
  const config = getConfig(opts);

  if (config == null) {
    return;
  }

  const otp = otplib[config.cli.mode];
  otp.options = config.options;

  console.log('');
  ora().succeed(line(config.cli.mode, 'mode'));

  let display = ora(line('generating')).start();

  setTimeout(() => {
    if (config.cli.mode === 'hotp') {
      const counter = Number(config.options.counter);
      const token = otp.generate(config.cli.secret, counter);
      display.succeed(line(token));
      return;
    }

    // Start TOTP / Authenticator
    setInterval(createGenerator(otp, config, display), 1000);

  }, 2000);
}

function verify(token, opts) {
  const config = getConfig(opts);

  if (config == null) {
    return;
  }
}

function qrcode(opts) {
  const config = getConfig(opts);

  let text = otplib.authenticator
    .keyuri(opts.user, opts.issuer, config.cli.secret);

  text = decodeURIComponent(text);

  if (opts.keyuri) {
    ora().succeed('[keyuri] ' + text);
    return;
  }

  QR.toFile(opts.output, text, {
    errorCorrectionLevel: 'M'
  }, function(err) {
    if (err) {
      ora().fail('[qrcode] Failed');
      return;
    }

    ora().succeed('[qrcode] Saved to file: ' + opts.output);
  });
}
