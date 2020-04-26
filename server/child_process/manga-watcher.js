const chokidar = require('chokidar');
const { debounce } = require('../../shared/utils');
const { slash } = require('../helpers/path');

const NOT_MATCH_BASE_DIR = () => {};
const WAIT_TIME = 1000;

class MangaWatcher {
  constructor({ paths, onCreate, onDelete }) {
    this.paths = paths;
    this._processQueue = [];
    this.onCreate = onCreate;
    this.onDelete = onDelete;

    // debounce WAIT_TIME to handle manga change
    this._debouncedProcess = debounce(this._process, WAIT_TIME);
  }

  _enqueue(item) {
    this._processQueue.push(item);
    this._debouncedProcess();
  }

  _process() {
    let _buffer = new Map();
    const len = this._processQueue.length;

    for (let i = 0; i < len; i++) {
      const item = this._processQueue.shift();
      const { path } = item;
      _buffer.set(path, item);
    }

    for (const entry of _buffer) {
      const [ key, value ] = entry;
      const { type } = value;
      
      if (type === 'create') {  
        this.onCreate(value);
      } else if (type === 'delete') {
        this.onDelete(value);
      }
    }

    _buffer = null;
  }

  _matchBaseDir(path) {
    const len = this.paths.length;
    for (let i = 0; i < len; i++) {
      if (path.indexOf(this.paths[i]) === 0) {
        return this.paths[i];
      }
    }
    return NOT_MATCH_BASE_DIR;
  }

  run() {
    chokidar.watch(this.paths, {
      ignored: [
        /(^|[\/\\])\../
      ],
      usePolling: true,
      interval: 1000,
      persistent: true,
      ignoreInitial: true, // watch file after ready
    })
      .on('addDir', path => {
        path = slash(path);
        const baseDir = this._matchBaseDir(path);
        if (baseDir !== NOT_MATCH_BASE_DIR) {
          this._enqueue({ type: 'create', path, baseDir });
        }       
      })
      .on('unlinkDir', path => {
        path = slash(path);
        const baseDir = this._matchBaseDir(path);
        if (baseDir !== NOT_MATCH_BASE_DIR) {
          this._enqueue({ type: 'delete', path, baseDir });
        }
      })
      .on('error', error => console.log(`Watcher error: ${error}`))
  }
}

module.exports = MangaWatcher;