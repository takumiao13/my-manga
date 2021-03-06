import fetch from './fetch';
import { groupBy, orderBy } from '@/helpers/utils';

function _buildURL(dirId, path) {
  let url = `api/mangas/${dirId}`;
  if (path) url += `/${encodeURIComponent(path)}`;
  return url;
}

function _transformResponse(res) {
  let { cover, children: list } = res;
  
  // FIXED: put this in store ??
  const group = groupBy(list, 'type');
  const versions = group.VERSION ? 
    orderBy(group.VERSION, 
      ['fileType', 'name'], 
      ['desc', 'asc']
    ) : [];

  Object.assign(res, {
    list,
    cover,
    files: group.FILE || [],
    chapters: (group.CHAPTER || []).map(_attachPlaceholder),
    chaptersSp: (group.CHAPTER_SP || []).map(_attachPlaceholder),
    mangas: (group.MANGA || []).map(_attachPlaceholder),
    images: group.IMAGE || [],
    versions
  });

  return _attachPlaceholder(res);
}

function _attachPlaceholder(obj) {
  obj.placeholder = 1;
  const ratio = (obj.height / obj.width) * 100;
  if (!isNaN(ratio) && ratio < 85) {
    obj.placeholder++;
  }

  return obj;
}

function search({ dirId, path, keyword, ver, uptime }) {
  const url = `${_buildURL(dirId, path)}/search?keyword=${keyword}&ver=${ver}&uptime=${uptime}`;
  return fetch(url).then(res => {
    const obj = { path: '', children: res };
    return _transformResponse(obj);
  });
}

function list({ dirId, path, _t }, options = {}) {
  let url = `${_buildURL(dirId, path)}/list`;
  if (_t) url += `?_t=` + _t;
  return fetch(url, options).then(_transformResponse)
}

function folder({ dirId, path }) {
  const url = `${_buildURL(dirId, path)}/folder`;
  return fetch(url).then(res => {
    // group manga
    const mangaGroup = {
      _parentPath: path,
      _mangaGroup: true,
      children: []
    };
    const list = [];
    res.children.forEach(child => {
      child._parentPath = path;
      if (child.type === 'FILE') {
        child._mangaGroup = false;
        list.push(child);
      } else {
        mangaGroup.children.push(child);
      }
    });
    
    const count = mangaGroup.children.length;
    if (count) {
      list.unshift(mangaGroup);
    }

    return { list }
  })
}

function pick({ dirId, path }) {
  const url = `${_buildURL(dirId, path)}/pick`;
  return fetch(url);
}

function latest({ dirId }) {
  const url = `${_buildURL(dirId)}/latest`;
  return fetch(url).then(res => res.map(_attachPlaceholder));
}

function versions({ dirId }) {
  const url = `${_buildURL(dirId)}/versions`;
  return fetch(url);
}

function share(longUrl) {
  const url = 'api/mangas/share';
  return fetch(url, {
    method: 'post',
    headers: {
      'content-type': 'application/json;charset=utf-8'
    },
    body: JSON.stringify({ url: longUrl })
  });
}

export default {
  search,
  list,
  folder,
  pick,
  latest,
  share,
  versions
}