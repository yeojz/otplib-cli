/* eslint-disable no-console */

const otplib = require('otplib').default;
const ora = require('ora');
const getConfig = require('./getConfig');

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
    display.text = '[' + timeLeft + 's] ' + token;
  }
}

function generate(cwd, program, opts) {
  const config = getConfig(cwd, program, opts);

  if (config == null) {
    return;
  }

  const otp = otplib[config.cli.mode];
  otp.options = config.options;

  console.log('');
  ora().succeed('[mode] ' + config.cli.mode);

  let display = ora('[code] generating').start();

  setTimeout(() => {
    if (config.cli.mode === 'hotp') {
      const counter = Number(config.options.counter);
      const token = otp.generate(config.cli.secret, counter);
      display.succeed('[code] ' + token);
      return;
    }

    // Start TOTP / Authenticator
    setInterval(createGenerator(otp, config, display), 1000);

  }, 2000);
}

module.exports = generate;
