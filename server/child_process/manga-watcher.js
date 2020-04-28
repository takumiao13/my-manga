const watcher = require('./watcher');
const { debounce } = require('../../shared/utils');
const { slash } = require('../helpers/path');

const NOT_MATCH_BASE_DIR = () => {};
const WAIT_TIME = 1000;
const Actions = {
  CREATE: 'create',
  DELETE: 'delete',
  UPDATE: 'update',
  RENAME: 'rename'
};

const fileRE = /\.(mp4|pdf|zip)$/i;
const metadataRE = /metadata\.json/;

class MangaWatcher {
  constructor({ paths, onCreate, onDelete, onRename, onUpdate }) {
    this.paths = paths;
    this._processQueue = [];
    this._mayBeMoveStack = [];

    this.onCreate = onCreate;
    this.onDelete = onDelete;
    this.onUpdate = onUpdate;
    this.onRename = onRename

    // debounce WAIT_TIME to handle manga change
    this._debouncedProcess = debounce(this._process, WAIT_TIME);
  }

  _enqueue(item) {
    this._processQueue.push(item);
    this._debouncedProcess();
  }

  _process() {
    const len = this._processQueue.length;

    for (let i = 0; i < len; i++) {
      const item = this._processQueue.shift();
      const { type } = item;

      if (type === Actions.CREATE) {
        this.onCreate(item);
      } else if (type === Actions.DELETE) {
        this.onDelete(item);
      } else if (type === Actions.RENAME) {
        this.onRename(item);
      } else if (type === Actions.UPDATE) {
        this.onUpdate(item);
      }
    }
  }

  _matchBaseDir(path) {
    path = slash(path);
    const len = this.paths.length;
    
    for (let i = 0; i < len; i++) {
      if (path.indexOf(this.paths[i]) === 0) {
        const baseDir = this.paths[i];
        return {
          baseDir,
          path: path.replace(baseDir, '').replace(/^\//, '')
        }
      }
    }
    return NOT_MATCH_BASE_DIR;
  }

  _emitMetadataUpdate({ path, baseDir }) {
    path = path.replace('metadata.json', '');
    this._enqueue({ type: 'update', path, baseDir, props: 'metadata' });
  }

  run() {
    watcher(this.paths, {
      ignored: [
        /(^|[\/\\])\../
      ],
      usePolling: true, // win10 has bug when move foler that non-empty
      interval: 1000, 
      persistent: true,
    }, {
      add: (filepath, stats) => {
        const matched = this._matchBaseDir(filepath);
        if (matched == NOT_MATCH_BASE_DIR) return

        const { path, baseDir } = matched;

        if (stats.isDirectory() || fileRE.test(path)) {
          this._enqueue({ type: 'create', path, baseDir });
        } else if (metadataRE.test(path)) {
          this._emitMetadataUpdate({ path, baseDir });
        }
      },

      unlink: (filepath, stats) => {
        const matched = this._matchBaseDir(filepath);
        if (matched == NOT_MATCH_BASE_DIR) return

        const { path, baseDir } = matched;

        if (stats.ino && (stats.isDirectory() || fileRE.test(path))) {
          this._enqueue({ type: 'delete', path, baseDir });
        } else if (metadataRE.test(path)) {
          this._emitMetadataUpdate({ path, baseDir });
        }
      },

      rename: (newPath, oldPath, stats) => {
        // skip if path is eithor dir or file;
        if (!stats.ino) return;
        if (!stats.isDirectory() && !fileRE.test(newPath)) return;
        
        const matched = this._matchBaseDir(newPath);
        if (matched == NOT_MATCH_BASE_DIR) return;

        const { path, baseDir } = matched;

        this._enqueue({ 
          type: 'rename', 
          oldPath: slash(oldPath).replace(baseDir, '').replace(/^\//, ''),
          newPath: path,
          baseDir
        });
      },

      // check metadata.json change
      // TODO: birthtime ??
      change: (filepath) => {
        if (!metadataRE.test(filepath)) return;

        const matched = this._matchBaseDir(filepath);
        if (matched == NOT_MATCH_BASE_DIR) return;

        const { path, baseDir } = matched;
        this._emitMetadataUpdate({ path, baseDir });
      }
    });
  }
}

module.exports = MangaWatcher;