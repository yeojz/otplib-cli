const path = require('path');
const expect = require('chai').expect;
const execa = require('execa');

describe('otplib', function () {

  const bin = path.join(__dirname, '..', 'bin', 'otplib.js');

  it('[main] should execute', function (done) {
      execa('node', [bin, '--version'])
        .then((result) => {
          expect(result.stdout.length).to.be.gt(0);
          done()
        })
        .catch((err) => done(err));
  });

  [
    'init',
    'generate',
    'qrcode',
    'verify'
  ].forEach((cmd) => {
    it('[' + cmd + '] should execute', function (done) {
        execa('node', [bin, cmd, '-h'])
          .then((result) => {
            expect(result.stdout.length).to.be.gt(0);
            done()
          })
          .catch((err) => done(err));
    });
  });
});
