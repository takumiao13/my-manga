const Service = require('./_base');
const fs = require('../helpers/fs');
const to = require('await-to-js').default;
const sizeOf = require('image-size');
const pathFn = require('path');

// File Types Enum
const FileTypes = {
  FOLDER: 'FOLDER', 
  MANGA: 'MANGA', 
  CHAPTER: 'CHAPTER', 
  IMAGE: 'IMAGE' 
};

const METADATA_FILENAME = 'metadata.json';
const imgRE = /\.(jpe?g|png|webp|gif|bmp)/i;

class MangaService extends Service {

  async list(path = '', baseDir) {
    return await traverse({ path, baseDir, onlyDir: false });
  }

  async folder(path = '', baseDir) {
    return await traverse({ path, baseDir });
  }
}

// Private Methods
async function traverse({ 
  path = '',
  baseDir,
  maxDepth = 1,
  onlyDir = true
}) {
  let err, stat, files;
  const absPath = pathFn.resolve(baseDir, path);
  const name = pathFn.basename(path);
  const children = [];
  
  [ err, stat ] = await to(fs.stat(absPath));
  
  if (err) return null;

  const isDir = stat.isDirectory();
  
  // extra info
  let metadata, type, cover, width, height, hasChildren = false;

  // Ignore if file is either image or directory type
  if (!isDir && !imgRE.test(pathFn.extname(path))) return null;
  
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
    files.sort((a, b) => {
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
          onlyDir
        });
      } else {
        // when `maxDepth` is decrease to 0
        // we need do one more iteratee to check 
        // current directory type is `MANGA` or `FOLDER`
        // - if directory has sub folder then consider it as `FOLDER`
        // - if directory has more than 10 image then consider it as `MANGA`

        const filepath = pathFn.resolve(baseDir, childPath);
        const [ err, stat ] = await to(fs.stat(filepath));

        //console.log(filepath);
        if (err) { continue }

        const isDir = stat.isDirectory();

        if (!isDir && !imgRE.test(pathFn.extname(filepath))) { continue }

        child = { path: childPath, isDir }
      } 
           
      if (child) {
        // if directory has not specify cover
        // use first image child as it's cover
        if (!child.isDir && !cover) {
          cover = child.path;
        }

        // change child type to `CHAPTER` if contains metadata
        if (child.isDir && metadata) {
          child.type = FileTypes.CHAPTER;
        }
        
        // sometimes we will not push child to `children` (onlyDir or performance)
        // so we can use `hasChildren` key to know the directory whether has children
        if (child.isDir && !hasChildren) {
          hasChildren = true;
        }

        // if we get the directory type skip the loop for performance
        if (maxDepth == 0 && (hasChildren || i >= 10)) {
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
      FileTypes[hasChildren ? 'FOLDER' : 'MANGA'];
  } else {
    type = FileTypes.IMAGE;
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
  return { isDir, path, name, type, cover, metadata, width, height, children, hasChildren };
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
    metadata = JSON.parse(data);
  } catch (err) {
    metadata = { $error: err } // add error info to metadata
  }
  
  return metadata;
}

module.exports = MangaService;