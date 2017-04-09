/* eslint-disable no-console */
const fs = require('fs');
const omit = require('lodash.omit');
const ora = require('ora');
const otplib = require('otplib').default;
const path = require('path');
const pick = require('lodash.pick');
const program = require('commander');
const pkg = require('../package.json');

const DEFAULT_FILENAME = 'otplib.json';
const CLI_OPTIONS = [
  'config',
  'epoch',
  'keylength',
  'mode',
  'output',
  'secret'
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
  .option('-l, --keylength [len]', 'length of secret key', 32)
  .option('-o, --output [filename]', 'output file. default: .otplib.json', DEFAULT_FILENAME)
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
    config.secret = otplib.authenticator.generateSecret(Number(opts.keylength));
    config.mode = program.mode ? program.mode.toLowerCase() : 'hotp';
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

function generate(opts) {
  const config = getConfig(opts);

  if (config == null) {
    return;
  }

  const options = config.options;
  const cli = config.cli;

  const otp = otplib[cli.mode];
  otp.options = options;
  console.log('\nMode: ' + cli.mode);

  let spinner = ora('generating').start();

  setTimeout(() => {
    if (cli.mode === 'hotp') {
      const counter = Number(options.counter);
      const token = otp.generate(cli.secret, counter);
      spinner.succeed(token);
      return;
    }

    // Start TOTP / Authenticator
    spinner.text = otp.generate(cli.secret);

    setInterval(() => {
      let time = new Date().getTime();
      let epoch = Math.floor(time / 1000.0);

      if (epoch % 30 === 0){
        spinner.color = 'green';
        spinner.text = otp.generate(cli.secret);
      }
    }, 1000);
  }, 2000);

}

function verify(token, opts) {
  const config = getConfig(opts);

  if (config == null) {
    return;
  }
}
