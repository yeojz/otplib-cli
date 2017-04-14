/* eslint-disable no-console */
const program = require('commander');
const ora = require('ora');

const constants = require('./constants');
const getConfig = require('./getConfig');
const endec = require('./endec');
const generate = require('./generate');
const initialise = require('./initialise');
const qrcode = require('./qrcode');
const verify = require('./verify');
const pkg = require('../package.json');

const cwd = process.cwd();

program
  .version(pkg.version)
  .option('-p, --password [password]', 'password to encrypt/decrypt the secret')
  .option('-k, --secret [key]', 'provide a secret key')
  .option('-c, --config [path]', 'path to configuration file', constants.DEFAULT_FILENAME)
  .option('-m, --mode [mode]', 'operation mode. (hotp | totp | authenticator)')
  .option('-d, --digits [number]', 'number of digits in token', 6)
  .option('-a, --algorithm [type]', 'algorithm to generate for totp (' + constants.SUPPORT_ALGORITHM.join(' | ') + ')', 'sha1')
  .option('-s, --step [number]', 'time step (totp / authenticator)', 30);

program
  .command('init')
  .description('initialise a new configuration')
  .option('-l, --keylength [len]', 'length of secret key', 20)
  .option('-o, --output [filename]', 'output file. default: otplib.json', constants.DEFAULT_FILENAME)
  .action((opts) => (
    initialise(cwd, program, opts)
  ));

program
  .command('generate')
  .description('generate new tokens')
  .option('-e, --epoch [number]', 'time since UNIX epoch (totp / authenticator)')
  .option('--counter [number]', 'current counter for HOTP', 0)
  .action((opts) => (
    generate(cwd, program, opts)
  ));

program
  .command('verify [token]')
  .description('validate a token against the setting or configuration')
  .option('-e, --epoch [number]', 'time since UNIX epoch (totp / authenticator)')
  .option('--counter [number]', 'current counter for HOTP', 0)
  .action((token, opts) => (
    verify(cwd, program, token, opts)
  ));

program
  .command('qrcode')
  .option('--user [name]', 'user to associate with this', 'my token')
  .option('--issuer [name]', 'your service name', 'otplib')
  .option('--keyuri', 'show the key uri instead of QR Code')
  .option('-o, --output [filename]', 'output file. default: otplib-qrcode.png', constants.DEFAULT_QRCODE_FILENAME)
  .description('generate a QR Code from configuration')
  .action((opts) => (
    qrcode(cwd, program, opts)
  ));

program
  .command('encrypt [secret]')
  .description('encrypt secret to store in config')
  .action((secret, opts) => {
    if (!program.password) {
      ora().fail('No password provided');
      return;
    }
    ora().succeed(endec.encrypt(program.password, secret));
  });

program
  .command('decrypt [secret]')
  .description('decrypt secret from config')
  .action((secret, opts) => {
    if (!program.password) {
      ora().fail('No password provided');
      return;
    }
    ora().succeed(endec.decrypt(program.password, secret));
  });

program.parse(process.argv);

if (!program.args.length) {
  program.help()
};
