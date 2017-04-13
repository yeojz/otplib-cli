/* eslint-disable no-console */

const getConfig = require('./getConfig');

function verify(cwd, program, token, opts) {
  const config = getConfig(cwd, program, opts);

  if (config == null) {
    return;
  }
}

module.exports = verify;
