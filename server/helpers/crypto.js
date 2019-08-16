const crypto = require('crypto');

exports.md5 = (data) => {
  const key = crypto.createHash('md5').update(data).digest('hex');
  return key.toString().substr(8, 8);
}