const fs = require('fs-extra');

const accessAsync = (path) => 
  new Promise(resolve => fs.access(path, fs.F_OK, err => resolve(!err)));

const accessSync = (path) => {
  try {
    fs.accessSync(path)
    return true;
  } catch(e) {
    return false;
  }
}

const chineseNumberMap = {
  '一': 1, '二': 2, '三': 3, '四': 4, '五': 5,
  '六': 6, '七': 7, '八': 8, '九': 9, '十': 10
};

const lastChars = ['最終', '最终'];

const filenameComparator = (a, b, fixedTop = []) => {
  // first check a or b whether contains other.
  if (a.indexOf(b) === 0 && b.indexOf(a) === -1) return 1;
  if (b.indexOf(a) === 0 && a.indexOf(b) === -1) return -1;

  if (fixedTop) {
    // handle some fixedTop ['banner', 'cover']
    const fixedAIndex = fixedTop.indexOf(a);
    const fixedBIndex = fixedTop.indexOf(b);
    
    if (fixedAIndex == -1 && fixedBIndex == -1) {
      // skip
    } else if (fixedAIndex > -1 && fixedBIndex > -1) {
      return fixedAIndex - fixedBIndex;
    } else {
      if (fixedAIndex === -1) return 1;
      if (fixedBIndex === -1) return 1;
    }
  }

  let m = 0, n = 0;
  const j = a.length, k = b.length;

  while (m < j && n < k) {
    let ca = a.substr(m++),
        cb = b.substr(n++);

    if (lastChars.indexOf(ca.substr(0,2)) > -1) return 1;
    if (lastChars.indexOf(cb.substr(0,2)) > -1) return -1;

    let na = parseInt(ca, 10),
        nb = parseInt(cb, 10);

    // case for `xx-1` > `xx-2` 
    // will check negative number `-1` and `-2`
    ca = !isNaN(na) ? Math.abs(na) : ca[0];
    cb = !isNaN(nb) ? Math.abs(nb) : cb[0]; 
    
    const aIsNum = typeof ca === 'number';
    const bIsNum = typeof cb === 'number';

    if (ca === cb) continue;

    if (aIsNum && bIsNum) {
      return ca - cb;
    } else if (!aIsNum && !bIsNum) {
      // replace chinese with digit.
      if (ca in chineseNumberMap) ca = chineseNumberMap[ca];
      if (cb in chineseNumberMap) cb = chineseNumberMap[cb];
      return [-1, 1][+(ca > cb)];
    } else {
      if (!aIsNum) return '.-_'.indexOf(ca) > -1 ? -1 : 1;
      if (!bIsNum) return '.-_'.indexOf(cb) > -1 ? 1 : -1;
    }
  }
};

module.exports = {
  ...fs,
  accessSync,
  accessAsync,
  filenameComparator
}