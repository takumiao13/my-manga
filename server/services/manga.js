const Service = require('./_base');
const fs = require('../helpers/fs');
const { take, escapeRegExp } = require('../helpers/utils'); 
const to = require('await-to-js').default;
const sizeOf = require('image-size');
const pathFn = require('path');
const parallel$ = require('promise-async-flow/parallel');
const { isArray, pick, random } = require('../helpers/utils');
const loki = require('lokijs');

// Constants
// ==

// File Types Enum
const FileTypes = {
  FILE: 'FILE', 
  MANGA: 'MANGA', 
  IMAGE: 'IMAGE',
  CHAPTER: 'CHAPTER',
  VERSION: 'VERSION'
};

const MAX_INDEX_COUNT = 100000;
const LAST_LOOP_COUNT = 8;
const COVER_FILENAME = 'cover.jpg';
const METADATA_FILENAME = 'metadata.json';
const imgRE = /\.(jpe?g|png|webp|gif|bmp)$/i;
const fileRE = /\.(mp4|pdf|zip)$/i;


// Helpers
// ==
const createIgnorePathFilter = (ignorePath) => (filename) => {
  if (Array.isArray(ignorePath) && ignorePath.indexOf(filename) > -1) {
    return false;
  } else {
    return true;
  }
}

const getFileType = (extname) => {
  if (imgRE.test(extname)) return 'image';
  if (fileRE.test(extname)) {
    if (extname === '.mp4') return 'video';
    return extname.slice(1);
  }
  
  return undefined;
}

class MangaService extends Service {

  constructor(opts) {
    super(opts);
    this._indexedDB = new Map();
  }

  async initialize() {
    const repos = this.service.repo.list();
    for (let i = 0; i < repos.length; i++) {
      await this._loadIndex(repos[i]);
    }
  }

  async list(baseDir, path = '', settings) {
    return await traverse({ baseDir, path, onlyFile: false, settings });
  }

  async folder(baseDir, path = '', settings) {
    return await traverse({ baseDir, path, settings });
  }

  // use parallel bfs for performance
  async walk(baseDir, path = '', settings, callback) {
    const queue = [{ baseDir, path, settings }];
    let count = 0;

    // TODO: config `MAX_INDEX_COUNT` later.
    while (queue.length && count < MAX_INDEX_COUNT) {
      const createTask = (params) => async () => await traverse(params);
      const tasks = queue.map(createTask);
      queue.length = 0;
      const nodes = await parallel$(tasks, 10);
      
      for (let node of nodes) {
        for (let child of node.children) {
          if (child.type === FileTypes.MANGA) {
            count++;
            callback(pick(child, [
              'name', 'path', 'type', 'ctime', 'mtime', 
              'cover', 'width', 'height', 'version'
            ]));
          } else if (child.isDir && child.type === FileTypes.FILE) {
            queue.push({ baseDir, path: child.path, settings });
          }
        }
      }  
    }
  }

  async pick(dirId, path = '') {
    const { db } = await this._indexedDB.get(dirId);
    const mangaColl = db.getCollection('mangas');
    const total = mangaColl.chain().find({ type: FileTypes.MANGA }).data().length;
    const skip = random(0, total-1);
    const result = mangaColl.chain().offset(skip).limit(1).data()[0];
    return result;
  }

  async search(dirId, path = '', queryparams) {
    const { db } = await this._indexedDB.get(dirId);
    const mangaColl = db.getCollection('mangas');
    let { keyword, version } =  queryparams;
    const queryObject = {};

    if (keyword) {
      if (path) keyword = `${path}/${keyword}`;
      queryObject.name = { $regex : new RegExp(keyword, 'i') };
    }
    
    if (version) {
      if (!isArray(version)) version = [version];
      queryObject.version = { $contains : version };
    }

    const results = mangaColl
      .chain()
      .find(queryObject)
      .limit(200)
      .data();
    
      return results;
  }

  /**
   * get all versions in the given repo
   * 
   * @param {string} dirId 
   */
  async version(dirId) {
    const { db } = await this._indexedDB.get(dirId);
    const mangaColl = db.getCollection('mangas');
    const results = mangaColl
      .chain()
      .find({ version: { $exists: true }})
      .extract('version') // ?? has problem ??
      .data();

    return results;
  }

  /**
   * get latest manga in the given repo (limit 100)
   * 
   * @param {string} dirId 
   */
  async latest(dirId) {
    const { db } = await this._indexedDB.get(dirId);
    const mangaColl = db.getCollection('mangas');
    const results = mangaColl
      .chain()
      .simplesort('ctime')
      .limit(100)
      .data();

    return results;
  }

  _loadIndex(repo) {
    const { dirId } = repo;
    const { baseDir } = this.service.repo.get(dirId);
    const filepath = pathFn.resolve(baseDir, 'db.json');
    const dbOptions = { dirId, baseDir, filepath, indexing: false };
    this._indexedDB.set(dirId, dbOptions);
    
    return new Promise((resolve, reject) => {
      // each repo dir add db.json to store indexing info.
      const db = new loki(filepath, {
        autoload: true,
        autoloadCallback: () => {
          var mangasColl = db.getCollection('mangas');
          if (mangasColl === null) {
            db.addCollection('mangas', {
              unique: ['path'],
              indices: ['ctime', 'version']
            });
          }

          resolve();
        }
      });
      
      dbOptions.db = db;
    });
  }

  dropIndex(baseDir, callback) {
    const filepath = pathFn.resolve(baseDir, 'db.json');
    if (fs.accessSync(filepath)) {
      fs.unlink(filepath)
        .then(value => callback(null))
        .catch(err => callback(err));
    } else {
      callback(null);
    }
  }

  async createIndex(baseDir, callback) {
    const dirId = this.service.repo.dirId(baseDir);
    const options = this._indexedDB.get(dirId);
    const { db, filepath } = options;
    const mangasColl = db.getCollection('mangas');
    const startTime = +new Date;
    const collection = [];

    if (!fs.accessSync(filepath)) {
      options.indexing = true;
      const settings = this.service.settings.get(dirId);
      await this.service.manga.walk(baseDir, '', settings, (child) => {
        // only pick need key
        collection.push(child);
      });

      // create index success.   
      options.indexing = false;
      mangasColl.insert(collection);
      
      // TODO: saveDatabase later
      //db.saveDatabase();
    }
    
    // invoke callback by some info.
    const elapsed = +new Date - startTime;
    callback(null, {
      elapsed,
      dirId,
      count: mangasColl.count()
    });
  }
}

// Private Methods
async function traverse({ 
  path = '',
  baseDir,
  maxDepth = 1,
  onlyFile = true,
  settings = {}
}) {
  let err, stat, files;
  const absPath = pathFn.resolve(baseDir, path);
  let name = pathFn.basename(path);
  const extname = pathFn.extname(path).toLowerCase();
  
  // Get current path stat.
  [ err, stat ] = await to(fs.stat(absPath));
  
  if (err) return null;

  const isDir = stat.isDirectory();
  const fileType = getFileType(extname);
  const _isImage = fileType === 'image';
  const _isFile = fileType && !isDir && !_isImage;

  // Ignore if file is not one of image, file, directory type.
  if (!isDir && !fileType) return null;
  
  // Define Data info.
  let metadata, type, cover, width, height, ctime, mtime, hasSubfolder, version,
      children = _isFile ? [ { name, path, type: FileTypes.FILE, fileType } ] : undefined;

  let _isManga = false,
      _hasFolder = false;

  const ignorePathFilter = createIgnorePathFilter(settings.ignorePath);
  const fixChildOptions = { parentName: escapeRegExp(name) };

  // Traverse sub directory
  if (isDir) {
    // try to get metadata
    const metadataPath = pathFn.join(absPath, METADATA_FILENAME);
    const hasMetadata = await fs.accessAsync(metadataPath);

    if (hasMetadata) {
      metadata = await readMeta(metadataPath);

      // get cover if metadata has `cover` key
      if (metadata && metadata.cover) {
        cover = pathFn.posix.join(path, metadata.cover);
      }

      fixChildOptions.metadata = metadata;
    }

    // Readdir to get files.
    [ err, files ] = await to(fs.readdir(absPath))

    // simple check id path operation not permitted
    if (err) return null; 

    let _filterdFiles = [];
    const _versionFiles = [];
    const _chapterFiles = [];

    files
      .filter(ignorePathFilter)
      .forEach(file => {
        const { base: name, ext } = pathFn.parse(file);
        const childpath = pathFn.posix.join(path, file);
        let chapterName, versionName;

        fixChildOptions.filepath = pathFn.resolve(absPath, file);

        if (versionName = isVersion(file, fixChildOptions)) {
          _versionFiles.push({
            name, versionName,
            path: childpath,
            type: FileTypes.VERSION,
            fileType: getFileType(ext)
          });

          version || (version = []);
          version.push(versionName);
          
        } else if (chapterName = isChapter(file, fixChildOptions)) {
          _chapterFiles.push({
            name, chapterName,
            path: childpath,
            type: FileTypes.CHAPTER,
          });

        } else {
          _filterdFiles.push(childpath);
        }
      });

    // check current directory type is `MANGA` or `FILE`
    // - if directory has version or chapter then consider it as `MANGA` (_isManga)
    // - else if directory has more than `LAST_LOOP_COUNT` image then consider it as `MANGA` (!_hasFolder)
    // - else directory consider it as `FILE`
    _isManga = _versionFiles.length || _chapterFiles.length;

    _chapterFiles.sort((a, b) => fs.filenameComparator(a.name, b.name));
    _filterdFiles.sort((a, b) => fs.filenameComparator(
      pathFn.basename(a), 
      pathFn.basename(b)
    ));

    const filesLength = _filterdFiles.length;
    if (maxDepth === 0) _filterdFiles = take(_filterdFiles, LAST_LOOP_COUNT);
    
    // build async traverse task
    const createTask = (path) => async () => {
      const child = maxDepth > 0 ?
        await traverse({ baseDir, path, maxDepth: maxDepth-1, onlyFile, settings}) : 
        await traverseLast({ baseDir, path });
      return child;
    }

    const tasks = _filterdFiles.map(createTask);
    const childNodes = await parallel$(tasks, 10);
    const filteredChildNodes = childNodes.filter(child => {
      if (!child) return false;

      if (child.isDir && !_hasFolder) {
        _hasFolder = true;
      } else if (!cover && imgRE.test(child.path)) {
        // if directory has not specify cover
        // use first image child as cover
        cover = child.path;
      }
      
      return !onlyFile || (onlyFile && child.type !== FileTypes.IMAGE);
    });

    // ignore children at last loop (due to db.json size)
    if (maxDepth > 0) {

      // replace `VERSION` type with `FILE` type
      // when version only has one
      if (_versionFiles.length === 1) {
        _versionFiles[0].type = FileTypes.FILE;
      }

      children = _versionFiles
        .concat(_chapterFiles)
        .concat(filteredChildNodes);
    }

    // if not find cover try to find `cover.jpg` as cover
    if (maxDepth === 0 && !cover && filesLength > LAST_LOOP_COUNT) {
      const hasCover = await fs.accessAsync(pathFn.join(absPath, COVER_FILENAME));
      
      if (hasCover) {
        cover = pathFn.posix.join(path, COVER_FILENAME);
      }
    }
  }

  // Last loop will not run after.
  // ---
  // Determine the file type
  if (isDir) {
    hasSubfolder = _hasFolder && !_isManga;
    type = metadata ? 
      FileTypes.MANGA :
      FileTypes[hasSubfolder ? 'FILE' : 'MANGA'];
  } else if (_isImage) {
    type = FileTypes.IMAGE;
  } else {
    type = FileTypes.MANGA;
  }

  // Determine the image path.
  let imgPath;
  
  if (type === FileTypes.IMAGE) {
    imgPath = path;
  } else if (type === FileTypes.MANGA) {
    imgPath = cover;
    mtime = stat.mtime;
    ctime = stat.ctime;

    // check self has contains version
    const versionName = isVersion(name);
    if (versionName) {
      version || (version = []);
      version.unshift(versionName);
    }
  }

  // Calculate image size (W & H)
  // if `onlyFile` is true we should not calculate it
  if (imgPath && (!onlyFile || type === FileTypes.MANGA)) {
    try {
      const size = sizeOf(pathFn.resolve(baseDir, imgPath));
      width = size.width;
      height = size.height;
    } catch (e) {}
  }

  // Merge base info and extra info
  return { 
    isDir, path, name, ctime, mtime, type, version,
    cover, metadata, width, height, fileType,
    children, hasSubfolder
  };
}

async function traverseLast({ baseDir, path }) {
  const name = pathFn.basename(path);
  const extname = pathFn.extname(path);
  const fileType = getFileType(extname);
  const child = { name, path };
  
  if (fileType) {
    return Object.assign(child, { isDir: false });
  }

  const absPath = pathFn.resolve(baseDir, path);

  // Get current path stat.
  const [ err, stat ] = await to(fs.stat(absPath));
  
  if (err) return null;

  const isDir = stat.isDirectory();
  
  // Ignore if file is not one of image, file, directory type.
  return isDir ? Object.assign(child, { isDir }) : null;
}

async function readMeta(path) {
  const data = await fs.readFile(path, 'utf8');
  let metadata = null;

  try {
    // handle empty file
    metadata = data ? JSON.parse(data) : {};
  } catch (err) {
    // add error info to metadata
    metadata = { $error: err }
  }
  
  return metadata;
}

const isChapter = (name, { parentName, metadata, filepath }) => {
  const regstr = `${parentName}\\s-\\s(.+)`;
  const chapterRE = new RegExp(regstr);
  const matched = name.match(chapterRE);

  if (fs.statSync(filepath).isFile()) {
    return false;
  }

  if (matched) return matched[1];
  
  if (metadata && metadata.chapters) {
    const chapters = metadata.chapters;
    if (typeof chapters === 'string') {
      return new RegExp(chapters).test(name) ? name : false;
    } else {
      return !!chapters ? name : false;
    }
  }

  return false;
}

const isVersion = (name, { parentName } = {}) => {
  if (name === parentName) {
    return 'default'
  }

  const basename = parentName ? `^${parentName}` : '';
  const baskets = '((?:\\s\\[[^\\]]*?\\]){0,})';
	const suffix = '(?:\\.(mp4|pdf|zip))?';
	const reStr = `${basename}${baskets}${suffix}$`;
  const versionRE = new RegExp(reStr);
  const matched = name.match(versionRE);
  if (matched) {
    let [ _, a, b ] = matched;
    a = a.trim().replace(/\]\s\[/g, '+').replace(/\[|\]/g, '');

    if (a && b) {
      return b + '.' + a;
    } else {
      return a || b;
    }
  }

  return false;
}

module.exports = MangaService;