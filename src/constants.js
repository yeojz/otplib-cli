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

module.exports = {
  DEFAULT_FILENAME,
  DEFAULT_QRCODE_FILENAME,
  CLI_OPTIONS,
  SUPPORT_ALGORITHM
}
