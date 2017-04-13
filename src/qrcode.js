/* eslint-disable no-console */

const otplib = require('otplib').default;
const ora = require('ora');
const QR = require('qrcode');
const getConfig = require('./getConfig');

function qrcode(cwd, program, opts) {
  const config = getConfig(cwd, program, opts);

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

module.exports = qrcode;
