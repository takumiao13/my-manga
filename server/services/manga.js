const Service = require('./_base');
const fs = require('fs-extra');
const to = require('await-to-js').default;
const sizeOf = require('image-size');
const pathFn = require('path');
const { pathExists, sortFiles, extname } = require('../helpers');

const FILE_TYPE = { 
  FOLDER: 'FOLDER', 
  MANGA: 'MANGA', 
  CHAPTER: 'CHAPTER', 
  IMAGE: 'IMAGE' 
};

const METADATA_FILENAME = 'metadata.json';
const imgRE = /(jpe?g|png|webp|gif|bmp)/i;

class MangaService extends Service {

  async list(path = '', baseDir) {
    return await traverse({ path, baseDir, onlyDir: false });
  }

  async folder(path = '', baseDir) {
    return await traverse({ path, baseDir, skipMeta: true });
  }
}

// Private Methods
async function traverse({ path = '', baseDir, maxDepth = 1, onlyDir = true, skipMeta = false }) {
  let err, stat, files;
  const absPath = pathFn.resolve(baseDir, path);
  // basic info
  const children = [];
  const name = pathFn.basename(path);
  [ err, stat ] = await to(fs.stat(absPath));
  if (err) return null;

  const isDir = stat.isDirectory();
  
  // extra info
  let metadata, type, cover, width, height, hasChildren = false;

  if (!isDir && !imgRE.test(extname(path))) return null;
  
  // sort files by filename
  if (isDir) { 
    metadata = await readMeta(absPath);
    if (metadata && metadata.cover) {
      cover = pathFn.posix.join(path, metadata.cover);
    }
  
    [ err, files ] = await to(fs.readdir(absPath))
    if (err) return null; // simple check operation not permitted
    files = sortFiles(files);

    for (let i = 0; i < files.length; i++) {
      let child;
      const childPath = pathFn.posix.join(path, files[i]);

      if (maxDepth > 0) {
        child = await traverse({ baseDir, path: childPath, maxDepth: maxDepth-1, onlyDir, skipMeta });
      } else {
        child = await simpleTraverse({ baseDir, path: childPath });
      }
      
      if (child) {
        // handle `cover` & `type`
        if (!child.isDir && !cover) cover = child.path;
        if (child.isDir && metadata) child.type = FILE_TYPE.CHAPTER; 
        
        // handle `children`
        if (child && child.isDir && !hasChildren) hasChildren = true;
        if (!onlyDir || (onlyDir && child.isDir) && maxDepth > 0) children.push(child);
      }
    }
  }

  // handle file type
  if (isDir) {
    type = metadata ? FILE_TYPE.MANGA : FILE_TYPE[hasChildren ? 'FOLDER' : 'MANGA'];
  } else {
    type = FILE_TYPE.IMAGE;
  }

  // handle size (W & H)
  if (!isDir || (isDir && cover)) {
    const imgPath = cover || path;

    try {
      const size = sizeOf(pathFn.resolve(baseDir, imgPath));
      width = size.width;
      height = size.height;
    } catch (e) {}
    
  }

  // merge info
  return { isDir, path, name, type, cover, metadata, width, height, children, hasChildren };
}

async function simpleTraverse({ path, baseDir }) {
  let err, stat, files;
  const absPath = pathFn.resolve(baseDir, path);
  [ err, stat ] = await to(fs.stat(absPath));
  
  if (err) return null;
  
  const ret = { 
    path, 
    hasChildren: false,
    isDir: stat.isDirectory()
  };

  if (!ret.isDir) return imgRE.test(extname(path)) ? ret : null;

  [ err, files ] = await to(fs.readdir(absPath));
  if (err) return null; // simple check operation not permitted

  for (let i = 0; i < files.length; i++) {
    const childPath = pathFn.resolve(absPath, files[i]);
    const [ err, stat ] = await to(fs.stat(childPath));
    
    if (stat && stat.isDirectory()) {
      // check has sub folder
      ret.hasChildren = true;
      return ret;
    }
  }

  return ret;
}

async function readMeta(dir) {
  let metadata = null;
  const path = pathFn.resolve(dir, METADATA_FILENAME);
  const isExist = await pathExists(path);

  if (!isExist) {
    return metadata;
  }

  const data = await fs.readFile(path, 'utf8');
  try {
    metadata = JSON.parse(data);
  } catch (err) {
    metadata = { $error: err } // add error info to metadata
  }
  
  return metadata;
}

module.exports = MangaService;