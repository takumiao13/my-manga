const Service = require('./_base');
const fs = require('../helpers/fs');
const to = require('await-to-js').default;
const sizeOf = require('image-size');
const pathFn = require('path');

// File Types Enum
const FileTypes = {
  FILE: 'FILE', 
  MANGA: 'MANGA', 
  CHAPTER: 'CHAPTER', 
  IMAGE: 'IMAGE' 
};

const METADATA_FILENAME = 'metadata.json';
const imgRE = /\.(jpe?g|png|webp|gif|bmp)$/i;
const fileRE = /\.(mp4|pdf|zip)$/i;

class MangaService extends Service {

  async list(path = '', baseDir, settings) {
    return await traverse({ path, baseDir, onlyDir: false, settings });
  }

  async folder(path = '', baseDir, settings) {
    return await traverse({ path, baseDir, settings });
  }
}

// Private Methods
async function traverse({ 
  path = '',
  baseDir,
  maxDepth = 1,
  onlyDir = true,
  settings = {}
}) {
  let err, stat, files;
  const absPath = pathFn.resolve(baseDir, path);
  const name = pathFn.basename(path);
  const children = [];
  
  [ err, stat ] = await to(fs.stat(absPath));
  
  if (err) return null;

  const isDir = stat.isDirectory();
  
  // extra info
  let metadata, type, fileType, cover, width, height, hasChildren = false;

  // Ignore if file is either image or file or directory type
  const extname = pathFn.extname(path).toLowerCase();
  if (!isDir && !imgRE.test(extname) && !fileRE.test(extname)) return null;
  
  // Traverse sub directory
  if (isDir) {
    // try to get metadata
    metadata = await readMeta(absPath);

    // get cover if metadata has `cover` key
    if (metadata && metadata.cover) {
      cover = pathFn.posix.join(path, metadata.cover);
    }
  
    [ err, files ] = await to(fs.readdir(absPath))

    // simple check id path operation not permitted
    if (err) return null; 

    // Sort files by filename
    files = files
      .filter(ignorePathFilter(settings.ignorePath))
      .sort((a, b) => {
        a = pathFn.parse(a).name;
        b = pathFn.parse(b).name;
        return fs.filenameComparator(a, b);
      });
    
    for (let i = 0; i < files.length; i++) {
      let child;
      const childPath = pathFn.posix.join(path, files[i]);

      if (maxDepth > 0) {
        child = await traverse({ 
          baseDir, 
          path: childPath, 
          maxDepth: maxDepth-1, 
          onlyDir,
          settings
        });
      } else {
        // when `maxDepth` is decrease to 0
        // we need do one more iteratee to check 
        // current directory type is `MANGA` or `FILE`
        // - if directory has sub folder then consider it as `FILE`
        // - if directory has more than 10 image then consider it as `MANGA`

        const filepath = pathFn.resolve(baseDir, childPath);
        const [ err, stat ] = await to(fs.stat(filepath));

        if (err) { continue }

        const isDir = stat.isDirectory();
        const extname = pathFn.extname(filepath);

        if (!isDir && !imgRE.test(extname) && !fileRE.test(extname)) { 
          continue 
        }

        child = { path: childPath, isDir }
      } 
           
      if (child) {

        // if directory has not specify cover
        // use first image child as it's cover
        if (!child.isDir && !cover && imgRE.test(child.path)) {
          cover = child.path;
        }

        // sometimes we will not push child to `children` (onlyDir or performance)
        // so we can use `hasChildren` key to know the directory whether has children
        if (child.isDir && !hasChildren) {
          hasChildren = true;
        }

        // if we get the cover and directory type 
        // skip the loop for performance
        if (maxDepth == 0 && (cover && hasChildren || i >= 10)) {
          break;
        }

        // push `child` to `children`
        // - `maxDepth > 0` not the last iteratee
        // - `onlyDir` only push directory type
        if (maxDepth > 0 && !onlyDir || onlyDir && child.isDir) {
          children.push(child);
        }
      }
    }
  }

  // Determine the file type
  if (isDir) {
    type = metadata ? 
      FileTypes.MANGA :
      FileTypes[hasChildren ? 'FILE' : 'MANGA'];

    // change child type if parent type is `MANGA`
    if (type === FileTypes.MANGA) {
      children.forEach(child => {
        if (child.isDir) {
          child.type = metadata.chapters ? 
            FileTypes.CHAPTER : 
            FileTypes.FILE;
          
        } else if (fileRE.test(child.path)) {
          child.type = FileTypes.FILE;
        }
      });
    }

  } else {
    type = imgRE.test(extname) ? 
      FileTypes.IMAGE : 
      FileTypes.MANGA;
      
    fileType = getFileType(extname);
  }

  // Determine the file path
  let imgPath;
  
  if (type === FileTypes.IMAGE) {
    imgPath = path;
  } else if (type === FileTypes.MANGA) {
    imgPath = cover;
  }

  // Calculate image size (W & H)
  // if `onlyDir` is true we should not calculate it
  if (imgPath && !onlyDir) {
    try {
      const size = sizeOf(pathFn.resolve(baseDir, imgPath));
      width = size.width;
      height = size.height;
    } catch (e) {}
  }

  // Merge base info and extra info
  return { isDir, path, name, type, fileType, cover, metadata, width, height, children, hasChildren };
}

async function readMeta(dir) {
  let metadata = null;
  const path = pathFn.resolve(dir, METADATA_FILENAME);
  const isExist = await fs.accessAsync(path);

  if (!isExist) {
    return metadata;
  }

  const data = await fs.readFile(path, 'utf8');
  try {
    metadata = data ? JSON.parse(data) : {}; // handle empty file
  } catch (err) {
    metadata = { $error: err } // add error info to metadata
  }
  
  return metadata;
}

const ignorePathFilter = (ignorePath) => (filename, index) => {
  if (Array.isArray(ignorePath) && ignorePath.indexOf(filename) > -1) {
    return false;
  } else {
    return true;
  }
}

const getFileType = (extname) => {
  if (imgRE.test(extname)) return 'image';
  if (extname === '.mp4') return 'video';
  if (extname === '.zip') return 'zip';
  if (extname === '.pdf') return 'pdf';
}

module.exports = MangaService;