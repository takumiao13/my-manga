const Service = require('./_base');
const pathFn = require('path');
const crypto = require('../helpers/crypto');
const fs = require('../helpers/fs');

class RepoService extends Service {

  constructor(opts) {
    super(opts);
    this.multiple = false;
    this.repoMap = {};
    this.cryptoedRepos = [];
  }

  set(dirId, { name, baseDir }) {
    this.repoMap[dirId] = { name, baseDir, dirId };
    this.cryptoedRepos.push({ name, dirId, accessed: fs.accessSync(baseDir) });
  }

  get(dirId) {
    // get dirId if is single repo
    if (!dirId && !this.multiple) {
      dirId = this.cryptoedRepos[0].dirId; 
    }
    
    return this.repoMap[dirId];
  }
  
  add(baseDir) {
    let repos;
    if (!Array.isArray(baseDir)) {
      repos = [ baseDir ]
    } else {
      repos = baseDir;
    }

    repos.forEach(baseDir => {
      const name = pathFn.basename(baseDir) || 
        pathFn.dirname(baseDir).replace(pathFn.sep, '');

      const dirId = this.hashBaseDir(baseDir);

      this.set(dirId, { name, baseDir });
    });
  }

  remove(index) {
    const { dirId } = this.cryptoedRepos[index];
    this.cryptoedRepos.splice(index, 1);
    delete this.repoMap[dirId];
  }

  list() {
    return this.cryptoedRepos;
  }

  hashBaseDir(baseDir) {
    return crypto.md5(baseDir);
  }
}

module.exports = RepoService;