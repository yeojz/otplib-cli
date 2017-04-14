/* eslint-disable no-console */

const otplib = require('otplib').default;
const ora = require('ora');
const path = require('path');
const fs = require('fs');

const constants = require('./constants');
const endec = require('./endec');
const getConfig = require('./getConfig');

function initialise(cwd, program, opts){
  let spinner = ora('Generating config').start();
  const outputPath = path.join(cwd, opts.output);

  let config = {}
  try {
    require(outputPath);
    spinner.fail('A configuration file of the same name already exists');

  } catch (e) {
    config.secret = otplib.authenticator
      .generateSecret(Number(opts.keylength));

    if (program.password) {
      config.secret = endec.encrypt(program.password, config.secret);
    }

    config.mode = program.mode
      ? program.mode.toLowerCase()
      : 'hotp';

    config.digits = program.digits;

    if (config.mode === 'totp') {
      config.algorithm = program.algorithm;

      if (constants.SUPPORT_ALGORITHM.indexOf(config.algorithm) < 0) {
        spinner.fail('Unsupported algorithm. Accepted values: ' + constants.SUPPORT_ALGORITHM.join(' | '));
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

module.exports = initialise;
