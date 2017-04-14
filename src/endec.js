const crypto = require('crypto');
const algorithm = 'aes-256-ctr';

function encrypt(password, text){
  const cipher = crypto.createCipher(algorithm, password)
  const value = cipher.update(text, 'utf8', 'hex')
  return value + cipher.final('hex');
}

function decrypt(password, text){
  const decipher = crypto.createDecipher(algorithm, password)
  const value = decipher.update(text, 'hex', 'utf8')
  return value + decipher.final('utf8');
}

module.exports = {
  decrypt,
  encrypt
}
