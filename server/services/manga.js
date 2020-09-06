const Service = require('./_base');
const fs = require('../helpers/fs');
const { take, get, pickN, escapeRegExp } = require('../helpers/utils'); 
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
  CHAPTER_SP: 'CHAPTER_SP',
  VERSION: 'VERSION'
};

const LATEST_COUNT = 100;
const RANDOM_COUNT = 50;

const MAX_INDEX_COUNT = 50000;
const LAST_LOOP_COUNT = 8;

const METADATA_FILENAMES = ['metadata.json', '.metadata.json'];
const imgRE = /\.(jpe?g|png|webp|gif|bmp)$/i;
const fileRE = /\.(mp4|pdf|zip)$/i;
const coverRE = /^cover\./;
const bannerRE = /^banner\./;


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
              'name', 'path', 'type', 'birthtime', 'mtime', 'cover', 'fileType',
              'cover', 'width', 'height', 'verNames', 'chapterSize', 'metadata'
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

  async rand(dirId) {
    const { db } = await this._indexedDB.get(dirId);
    const mangaColl = db.getCollection('mangas');
    const { data } = mangaColl;
    const N = Math.min(data.length, RANDOM_COUNT);
    const results = pickN(data, N);
    return results
  }

  async search(dirId, path = '', queryparams) {
    const { db } = await this._indexedDB.get(dirId);
    const mangaColl = db.getCollection('mangas');
    let { keyword, ver, uptime } =  queryparams;
    const queryObject = {};

    if (!keyword && !ver && !uptime) {
      return [];
    }

    if (keyword) {
      queryObject.name = { $regex: new RegExp(keyword, 'i') };

      // search manga in path
      if (path) {
        queryObject.path = { $regex: new RegExp(path, 'i') };
      }
    }
    
    if (ver) {
      ver = ver.replace(/\s/g, '+');
      if (!isArray(ver)) ver = [ver];
      queryObject.verNames = { $contains : ver };
    }

    let results = mangaColl
      .chain()
      .find(queryObject);

    // filter by update time
    if (uptime) {
      const now = new Date;
      const yyyy = now.getFullYear();
      const mm = now.getMonth();
      const dd = now.getDate();

      const today = +new Date(yyyy, mm, dd-1);
      const thisMonth = +new Date(yyyy, mm-1, 1);
      const thisHalfYear = +new Date(yyyy, mm-6, 1);
      const thisYear = +new Date(yyyy-1, mm, dd);

      results = results.where((manga) => {
        const { birthtime } = manga;
        switch (uptime) {
          case '1': // today
            return birthtime > today;
          case '3': // this month
            return birthtime <= today && birthtime > thisMonth;
          // case '4': // this half year
          //   return birthtime <= thisMonth && birthtime > thisHalfYear;
          case '5': // this year
            return birthtime <= thisMonth && birthtime > thisYear;
        }
      });
    }
  
    results = results.limit(200).data();

    return results;
  }

  /**
   * get all versions in the given repo
   * 
   * @param {string} dirId 
   */
  async versions(dirId) {
    const { db } = await this._indexedDB.get(dirId);
    const mangaColl = db.getCollection('mangas');
    const results = mangaColl
      .chain()
      .find({ verNames: { $exists: true }})
      .data();


    const versions = new Set();

    results.forEach(manga => {
      manga.verNames.forEach(v => versions.add(v));
    });

    return Array.from(versions).sort();
  }

  /**
   * get latest manga in the given repo (limit 100)
   * 
   * @param {string} dirId 
   */
  async latest(dirId, count = LATEST_COUNT) {
    const { db } = await this._indexedDB.get(dirId);
    const mangaColl = db.getCollection('mangas');
    const results = mangaColl
      .chain()
      .simplesort('birthtime', { desc: true })
      .limit(count)
      .data();

    return results;
  }

  _loadIndex(repo) {
    const { dirId } = repo;
    const { baseDir } = this.service.repo.get(dirId);
    const dataDir = this.config('dataDir');

    // database path
    const filepath = pathFn.resolve(dataDir, 'repos', `repo.${dirId}.db`);
    const dbOptions = { dirId, baseDir, filepath, indexing: false };

    this._indexedDB.set(dirId, dbOptions);
    
    // TODO: put code in middleware ??
    return new Promise((resolve, reject) => {
      // each repo dir add db.json to store indexing info.
      const db = new loki(filepath, {
        autoload: true,
        autoloadCallback: () => {
          var mangasColl = db.getCollection('mangas');
          if (mangasColl === null) {
            db.addCollection('mangas', {
              unique: ['path'],
              indices: ['birthtime', 'version']
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
    const repo = this.service.repo.get(dirId);

    if (!repo.accessed) {
      callback({ message: 'repo unaccessed' });
      return;
    }

    const options = this._indexedDB.get(dirId);
    const { db, filepath } = options;
    const mangasColl = db.getCollection('mangas');
    const startTime = +new Date;
    const collection = [];

    if (!fs.accessSync(filepath)) {
      options.indexing = true;
      const settings = await this.service.settings.get(dirId);
      await this.service.manga.walk(baseDir, '', settings, (child) => {
        // only pick need key
        collection.push(child);
      });

      // create index success.   
      options.indexing = false;
      mangasColl.insert(collection);
      
      // TODO: saveDatabase later
      if (process.env.NODE_ENV === 'dev') {
        db.saveDatabase();
      }
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
// - fileType: 'video|image|pdf' 
// - verNames: String[] names of version on for display
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
  let fileType = getFileType(extname);
  const _isImage = fileType === 'image';
  const _isFile = fileType && !isDir && !_isImage;

  // Ignore if file is not one of image, file, directory type.
  if (!isDir && !fileType) return null;
  
  // Define Data info.
  let metadata, type, birthtime, mtime,
      hasSubfolder, version, chapterSize,
      cover, banner, width, height,
      children = _isFile ? 
        [ { name, path, type: FileTypes.FILE, fileType } ] : // single file put self in children 
        undefined;

  let _isManga = false,
      _hasFolder = false,
      _childExtnames = false;

  const ignorePathFilter = createIgnorePathFilter(settings.ignorePath);
  const fixChildOptions = { parentName: escapeRegExp(name) };

  // Traverse sub directory
  if (isDir) {
    // try to get metadata
    let metadataPath, _showChapterCover = false;

    METADATA_FILENAMES.forEach(filename => {
      const path = pathFn.join(absPath, filename);
      if (fs.accessSync(path)) metadataPath = path;
    });
    
    if (metadataPath) {
      metadata = await readMeta(metadataPath);

      if (typeof metadata.chapters === 'object' && metadata.chapters.cover) {
        _showChapterCover = true;
      }

      fixChildOptions.metadata = metadata;
    }

    // Readdir to get files.
    [ err, files ] = await to(fs.readdir(absPath))

    // simple check id path operation not permitted
    if (err) return null; 

    let _filterdFiles = [];
    const _versionFiles = [];
    let _chapterFiles = [];
    let _chapterWithCoverFiles = [];
    let _chapterSpFiles = [];
    let _chapterSpWithCoverFiles = [];
    
    files
      .filter(ignorePathFilter)
      .forEach(file => {
        const { base: name, ext } = pathFn.parse(file);
        const childpath = pathFn.posix.join(path, file);
        const subfileType = getFileType(ext);

        let chapterName, ver;
        fixChildOptions.filepath = pathFn.resolve(absPath, file);

        // extname as one of versions (only display)
        if (!_childExtnames && subfileType == 'video' || subfileType == 'pdf') {
          _childExtnames = ext.slice(1);
        }

        if (ver = isVersion(file, fixChildOptions)) {
          // simple versions as children
          _versionFiles.push({
            name, ver,
            path: childpath,
            type: FileTypes.VERSION,
            fileType: subfileType
          });

          version || (version = []);
          if (version.indexOf(ver) === -1) {
            version.push(ver);
          }         
        } else if (isChapterSp(file)) {
          try {
            let files = fs.readdirSync(pathFn.resolve(absPath, file));
            files = files.map(file => {
              return {
                name: pathFn.basename(file),
                chapterName: isChapter(file, fixChildOptions),
                path: pathFn.posix.join(childpath, file),
                type: FileTypes.CHAPTER_SP,
              }
            });

            if (_showChapterCover) {
              _chapterSpWithCoverFiles = files;
            } else {
              _chapterSpFiles = files;
            }
          } catch (err) {
          }
        } else if (chapterName = isChapter(file, fixChildOptions)) {
          const chapterNode = {
            name, chapterName,
            path: childpath,
            type: FileTypes.CHAPTER,
          };

          if (_showChapterCover) {
            _chapterWithCoverFiles.push(chapterNode);
          } else { 
            _chapterFiles.push(chapterNode);
          }
          
          chapterSize = (chapterSize || 0)+1;

        } else {
          _filterdFiles.push({ path: childpath });
        }
      });

    // check current directory type is `MANGA` or `FILE`
    // - if directory has version or chapter then consider it as `MANGA` (_isManga)
    // - else if directory has more than `LAST_LOOP_COUNT` image then consider it as `MANGA` (!_hasFolder)
    // - else directory consider it as `FILE`
    _isManga = _versionFiles.length || _chapterFiles.length;

    // sort files
    const fixedTopNames = ['banner', 'cover'];
    const lastChars = ['最終', '最终'];
    _chapterFiles.sort((a, b) => fs.filenameComparator(a.name, b.name, fixedTopNames, lastChars));
    _chapterWithCoverFiles.sort((a, b) => fs.filenameComparator(a.name, b.name, fixedTopNames, lastChars));
    _chapterSpFiles.sort((a, b) => fs.filenameComparator(a.name, b.name, fixedTopNames, lastChars));
    _chapterSpWithCoverFiles.sort((a, b) => fs.filenameComparator(a.name, b.name, fixedTopNames, lastChars));
    _filterdFiles.sort((a, b) => fs.filenameComparator(
      pathFn.basename(a.path), // protect such as No.1000 (.1000 is not extname)
      pathFn.basename(b.path),
      fixedTopNames,
      lastChars
    ));

    // special sort for chapters
    const spConfig = get(metadata, 'chapters.sort');
    if (spConfig) {
      _chapterFiles = adjustChapters(_chapterFiles, spConfig);
      _chapterWithCoverFiles = adjustChapters(_chapterWithCoverFiles, spConfig);
      _chapterSpFiles = adjustChapters(_chapterSpFiles, spConfig);
      _chapterSpWithCoverFiles = adjustChapters(_chapterWithCoverFiles, spConfig)
    }

    if (maxDepth === 0) _filterdFiles = take(_filterdFiles, LAST_LOOP_COUNT);
    
    // build async traverse task
    const createTask = (node) => async () => {
      const { path } = node;
      const child = maxDepth > 0 ?
        await traverse({ baseDir, path, maxDepth: maxDepth-1, onlyFile, settings }) : 
        await traverseLast({ baseDir, path });

      return child ? Object.assign(child, node) : child;
    }

    const tasks = _filterdFiles.map(createTask);
    const childNodes = await parallel$(tasks, 10);

    const chapterTasks = _chapterWithCoverFiles.map(createTask);
    const chapterNodes = await parallel$(chapterTasks, 10);

    const chapterSpTasks = _chapterSpWithCoverFiles.map(createTask);
    const chapterSpNodes = await parallel$(chapterSpTasks, 10);

    const filteredChildNodes = childNodes.filter((child, index) => {
      if (!child) return false;
    
      if (!banner && bannerRE.test(child.name)) {
        banner = child.path;
        return false; // exclude `banner.xxx` from children
      }

      if (!cover && coverRE.test(child.name)) {
        cover = child.path;
        return false; // exluce `cover.xxx` from children
      }

      if (!cover && imgRE.test(child.name)) {
        // if directory has not specify cover
        // use first image child as cover
        cover = child.path;
      }

      if (child.isDir && !_hasFolder) {
        _hasFolder = true;
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
        .concat(_chapterSpFiles)
        .concat(chapterNodes)
        .concat(chapterSpNodes)
        .concat(filteredChildNodes)
        .filter(Boolean)
    }
  }

  // Last loop will not run after.
  // ---
  // Determine the file type
  if (isDir) {

    // - metadata -> MANGA
    // - no subfolder -> MANGA
    // - has subfolder -> FILE

    hasSubfolder = _hasFolder && !_isManga;
    type = metadata ? 
      FileTypes.MANGA :
      FileTypes[hasSubfolder ? 'FILE' : 'MANGA'];


    // fix manga contains sub mangas
    if (type === FileTypes.MANGA && children) {
      children.forEach(child => {
        if (child.type === FileTypes.MANGA) {
          child.type = FileTypes.FILE
        }
      })
    }

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
    mtime = stat.mtimeMs;
    birthtime = stat.birthtimeMs;

    if (_childExtnames && !version) {
      version = [_childExtnames];
    }

    // check self has contains version
    // use it's version
    const ver = isVersion(name);
    if (ver) {
      version = [ver];
    }

    // try to fix fileType by first child extnames
    if (_childExtnames && !fileType) {
      fileType = (version && version.length > 1) ?
        'mix':  
        getFileType('.' + _childExtnames);
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

  // use big cover as banner
  if (cover && !banner && width && height && ((height / width) * 100 <= 72)) {
    banner = cover;
  }

  // Merge base info and extra info
  return { 
    isDir, path, name, birthtime, mtime, type, 
    cover, banner, metadata, width, height, fileType,
    children, hasSubfolder,
    verNames: version,
    chapterSize
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

const adjustChapters = (chs, config) => {
  const _chs = [];
  const shouldAdjustChs = {};

  Object.keys(config).forEach(key => {
    config[key].forEach(ch => {
      shouldAdjustChs[ch] = 1;
    })
  });

  for (let i = 0; i < chs.length; i++) {
    const ch = chs[i];
    const { chapterName } = ch;

    // if not match just put to results
    if (!config[chapterName] && !shouldAdjustChs[chapterName]) {
      _chs.push(ch);
    } else if (config[chapterName]) {
      // find after chapters
      const afterChs = findAfterChs(chs, config[chapterName]);
      _chs.push(ch, ...afterChs);
    }
  }

  // handle first and last chapters
  if (config.$1) {
    _chs.unshift(...findAfterChs(chs, config.$1));
  }

  if (config.$$) {
    _chs.push(...findAfterChs(chs, config.$$));
  }

  return _chs;

  function findAfterChs(chs, names) {
    return chs.filter(ch => names.includes(ch.chapterName));
  }
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

const isChapterSp = (name) => {
  if (name === '@sp') return true;
  return false;
}

const isVersion = (name, { parentName } = {}) => {
  if (name === parentName) {
    return 'default'
  }

  const basename = parentName ? `^${parentName}` : '';
  // filename like `foo [ver1] [ver2]`
  const baskets = '((?:\\s\\[[^\\]]*?\\]){0,})';
  // filetname list `foo.mp4` `foo.zip`
  const suffix = '(?:\\.(mp4|pdf|zip))?';
  
  // make RegExp
	const reStr = `${basename}${baskets}${suffix}$`;
  const versionRE = new RegExp(reStr);
  const matched = name.match(versionRE);

  // when filename is contains versions
  if (matched) {
    // a -> verNames
    // b -> suffix
    let [ _, a, b ] = matched;
    // handle combined versions
    // [ver1] [ver2] -> [ver1+ver2];
    a = a.trim().replace(/\]\s\[/g, '+').replace(/\[|\]/g, '');

    if (a && b) {
      // like `mp4.voice` both has ver and suffix
      return b + '.' + a;
    } else {
      return a || b;
    }
  }

  return false;
}

module.exports = MangaService;