// https://github.com/notable/notable/blob/ed04e45054b544a44afec0d70555cc6d72ac596c/src/renderer/utils/watcher.ts
const chokidar = require('chokidar');
const { merge } = require('../helpers/utils');
const fileRE = /\.(mp4|pdf|zip)$/i;

module.exports = function watcher( root, options = {}, callbacks = {} ) {
  let filesStats = {}, // filePath => fs.Stats
      renameSignalers = {}, // ino => Function
      // Amount of time to wait for the complementary add/unlink event
      // chokidar interval is 1000
      renameTimeout = 1500,
      isReady = false;

  function emit(event, args) {
    if (!callbacks[event])return;
    callbacks[event].apply(undefined, args);
  }

  function change(filePath, stats) {
    if (!isReady) return
    emit('change', [filePath, stats]);
  }

  function add(filePath, stats) {
    stats = stats || {}; // Just to be safe
    filesStats[filePath] = stats;
    if (!isReady) return

    const renameSignaler = renameSignalers[stats.ino];

    if (renameSignaler) { // Rename
      const prevPath = renameSignaler();
      emit('rename', [filePath, prevPath, stats]);
    } else {
      const timeoutId = setTimeout(() => { // Added
        delete renameSignalers[stats.ino];
        emit('add', [filePath, stats]);
      }, renameTimeout);

      renameSignalers[stats.ino] = () => { // Renamed
        clearTimeout(timeoutId);
        delete renameSignalers[stats.ino];
        return filePath;
      };
    }
  }

  function unlink(filePath) {
    if (!isReady) return

    const stats = filesStats[filePath] || {}; // Just to be safe
    const renameSignaler = renameSignalers[stats.ino];

    if (renameSignaler) { // Rename

      const newPath = renameSignaler();
      emit('rename', [newPath, filePath, stats]);
    } else {

      const timeoutId = setTimeout(() => { // Deleted
        delete renameSignalers[stats.ino];
        emit('unlink', [filePath, stats]);
      }, renameTimeout);

      renameSignalers[stats.ino] = () => { // Renamed
        clearTimeout(timeoutId);
        delete renameSignalers[stats.ino];
        return filePath;
      };
    }

  }

  function ready() {
    isReady = true;
  }

  const chokidarOptions = merge({}, options, { ignoreInitial: false });

  return chokidar.watch(
    root, 
    chokidarOptions
  )
  .on('change', change)
  .on('add', (path, stats) => {
    if (fileRE.test(path)) add(path, stats);
  })
  .on('unlink', unlink)
  .on('addDir', add)
  .on('unlinkDir', unlink)
  .on('ready', ready)
}