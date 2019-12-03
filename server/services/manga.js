const Service = require('./_base');
const fs = require('../helpers/fs');
const { escapeRegExp } = require('../helpers/utils'); 
const to = require('await-to-js').default;
const sizeOf = require('image-size');
const pathFn = require('path');

// File Types Enum
const FileTypes = {
  FILE: 'FILE', 
  MANGA: 'MANGA', 
  IMAGE: 'IMAGE',
  CHAPTER: 'CHAPTER',
  VERSION: 'VERSION'
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


// TODO: put private to class
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
  let metadata, type, fileType, cover, width, height, 
      mtime = stat.mtime, hasSubfolder = false;

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

    // try to find `cover.jpg` as cover
    if (!cover && fs.accessSync(pathFn.join(absPath, 'cover.jpg'))) {
      cover = pathFn.posix.join(path, 'cover.jpg');
    }

    // if find metadata and cover, needn't do one more check.
    if (maxDepth === 0 && metadata && cover) {
      // skip this
    } else {
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
        } else if (maxDepth === 0) {
          // when `maxDepth` is decrease to 0, if not metadata and not cover
          // we need do one more iteratee to check 
          // current directory type is `MANGA` or `FILE`
          // - if directory has sub folder then consider it as `FILE`
          // - if directory has more than 10 image then consider it as `MANGA`
          // the end we cat get `cover` and know the current dir contains sub folder or not by `hasSubfolder`.
          
          // TODO: user other key replace `hasSubfolder`

          const filepath = pathFn.resolve(baseDir, childPath);
          const [ err, stat ] = await to(fs.stat(filepath));

          if (err) { continue }

          const isDir = stat.isDirectory();
          const { name } = pathFn.parse(filepath);

          child = { name, path: childPath, isDir }
        } 
            
        if (child) {
          // if directory has not specify cover
          // use first image child as cover
          if (!child.isDir && !cover && imgRE.test(child.path)) {
            cover = child.path;
          }

          // sometimes we will not push child to `children` (onlyDir or performance)
          // so we can use `hasSubfolder` key to know the directory whether has children
          if (
            child.isDir && 
            !isChapter(child, { parentName: name, metadata }) && 
            !isVersion(child, { parentName: name, metadata }) &&
            !hasSubfolder
          ) {
            hasSubfolder = true;
          }

          // if we get the cover and directory type 
          // skip the loop for performance
          if (maxDepth == 0 && (cover && (hasSubfolder || i >= 10))) {
            break;
          }

          // push `child` to `children`
          // - `maxDepth > 0` not the last iteratee
          // - `onlyDir` only push directory type
          if (maxDepth > 0 && (!onlyDir || onlyDir && child.isDir)) {
            children.push(child);
          }
        }
      }
    }
  }

  // Determine the file type
  if (isDir) {
    type = metadata ? 
      FileTypes.MANGA :
      FileTypes[hasSubfolder ? 'FILE' : 'MANGA'];

    // fix child type if parent type is `MANGA`
    if (type === FileTypes.MANGA) {
      children.forEach((child) => {
        fixChildType(child, { parentName: name, metadata })
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
  return { 
    isDir, path, name, type, fileType, mtime, 
    cover, metadata, width, height, 
    children, hasSubfolder 
  };
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

const fixChildType = (child, options) => {
  if (child.isDir) {
    if (isChapter(child, options)) {
      child.type = FileTypes.CHAPTER;
    } else if (isVersion(child, options)) {
      child.type = FileTypes.VERSION;
    } else {
      child.type = FileTypes.FILE;
    }
  } else if (fileRE.test(child.path)) {
    child.type = isVersion(child, options) ?
      FileTypes.VERSION :
      FileTypes.FILE;
  }
}

const isChapter = (child, { parentName, metadata }) => {
  const regstr = `${escapeRegExp(parentName)}\\s-\\s(.+)`;
  const chapterRE = new RegExp(regstr);
  const matched = child.name.match(chapterRE);

  if (matched) {
    child.chapterName = matched[1]; // add special chapter name to child
    return true;
  }

  if (metadata && metadata.chapters) {
    const chapters = metadata.chapters;
    if (typeof chapters === 'string') {
      return new RegExp(chapters).test(child.name)
    } else {
      return !!metadata.chapters;
    }
  }

  return false;
}

const isVersion = (child, { parentName, metadata }) => {
  const regstr = `${escapeRegExp(parentName)}\\s\\[(.*?)\\](\\.(mp4|pdf|zip))?$`;
  const versionRE = new RegExp(regstr);
  const matched = child.name.match(versionRE);

  console.log(child.name, parentName);
  if (matched) {
    child.versionName = matched[1]; // add special chapter name to child
    return true;
  }

  if (metadata && metadata.versions) {
    const versions = metadata.versions;
    if (typeof versions === 'string') {
      return new RegExp(versions).test(child.name)
    } else {
      return !!metadata.versions;
    }
  }

  return false;
}

module.exports = MangaService;