const Service = require('./_base');
const jwt = require('jsonwebtoken');

class AuthService extends Service {
  login(username, password) {
    const { accounts } = this.config();
       
    if (accounts[username] && accounts[username] === password) {
      const payload = {
        name: username
      };
      
      const token = jwt.sign(payload, 'hello-mymanga');
      return { ...payload, token };
    } else {
      return null;
    }
  }
}

module.exports = AuthService;