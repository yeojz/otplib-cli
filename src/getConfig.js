/* eslint-disable no-console */

const path = require('path');
const omit = require('lodash.omit');
const pick = require('lodash.pick');
const constants = require('./constants');

function getConfig(cwd, program, options = {}) {
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
    cli: pick(config, constants.CLI_OPTIONS),
    options: omit(config, constants.CLI_OPTIONS)
  };
}

module.exports = getConfig;
