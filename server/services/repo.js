const Service = require('./_base');
const pathFn = require('../helpers/path');
const crypto = require('../helpers/crypto');
const fs = require('../helpers/fs');
const { ERR_CODE } = require('../helpers/error-code');

class RepoService extends Service {

  constructor(opts) {
    super(opts);
    this.multiple = false;
    this.repoMap = {};
    this.cryptoedRepos = [];
  }

  set(dirId, { name, baseDir }) {
    const accessed = fs.accessSync(baseDir)
    this.repoMap[dirId] = { name, baseDir, dirId, accessed };
    this.cryptoedRepos.push({ name, dirId, accessed });
  }

  get(dirId) {
    // get dirId if is single repo
    if (!dirId && !this.multiple) {
      dirId = this.cryptoedRepos[0].dirId; 
    }
    
    const repo = this.repoMap[dirId];

    if (!repo) {
      this.app.throwError(ERR_CODE.REPO_UNACCESSED);
    }

    return repo;
  }
  
  add(repos) {
    // normalize repos to array
    if (!Array.isArray(repos)) {
      repos = [ repos ]
    }

    for (let i = 0; i < repos.length; i++) {
      let baseDir = repos[i];

      // get repo name
      const name = pathFn.basename(baseDir) || 
        pathFn.dirname(baseDir).replace(pathFn.sep, '');

      // normalize dir to slash style
      baseDir = pathFn.slash(baseDir);
      // get dirId
      const dirId = this.dirId(baseDir);
      
      this.set(dirId, { name, baseDir });
    }
  }

  remove(index) {
    const { dirId } = this.cryptoedRepos[index];
    this.cryptoedRepos.splice(index, 1);
    delete this.repoMap[dirId];
  }

  list() {
    return this.cryptoedRepos;
  }

  dirId(baseDir) {
    return crypto.md5(baseDir);
  }
}

module.exports = RepoService;