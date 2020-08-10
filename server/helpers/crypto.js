const crypto = require('crypto');

const md5 = (data) => {
  const key = crypto.createHash('md5').update(data).digest('hex');
  return key.toString().substr(8, 8);
}

module.exports = {
  ...crypto,
  md5
}