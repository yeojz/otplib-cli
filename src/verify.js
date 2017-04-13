/* eslint-disable no-console */

const ora = require('ora');
const otplib = require('otplib').default;
const getConfig = require('./getConfig');

function showResult(isValid) {
  if (isValid) {
    ora().succeed('valid');
    return;
  }
  ora().fail('invalid');
}

function verify(cwd, program, token, opts) {
  const config = getConfig(cwd, program, opts);

  if (config == null) {
    return;
  }

  const otp = otplib[config.cli.mode];
  console.log('');

  if (config.cli.mode === 'hotp') {
    const counter = Number(config.options.counter);
    return showResult(otp.check(
      token,
      config.cli.secret,
      counter
    ));
  }

  return showResult(otp.check(
    token,
    config.cli.secret
  ));
}

module.exports = verify;
