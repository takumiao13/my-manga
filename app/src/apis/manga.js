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
    chapters: _attachPlaceholder(group.CHAPTER || []),
    mangas: _attachPlaceholder(group.MANGA || []),
    images: group.IMAGE || [],
    versions
  });

  return res;
}

function _attachPlaceholder(mangas) {
  // add placeholder for manga to fill gutter 
  // when some manga cover is to long
  return mangas.map(item => {
    item.placeholder = 1;
    const ratio = (item.height / item.width) * 100;
    if (!isNaN(ratio) && ratio < 85) {
      item.placeholder++;
    }
    return item;
  });
}

function search({ dirId, path, keyword, ver }) {
  const url = `${_buildURL(dirId, path)}/search?keyword=${keyword}&ver=${ver}`;
  return fetch(url).then(res => {
    const obj = { path: '', children: res };
    return _transformResponse(obj);
  });
}

function list({ dirId, path, _t }) {
  let url = `${_buildURL(dirId, path)}/list`;
  if (_t) url += `?_t=` + _t;
  return fetch(url).then(_transformResponse)
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
  return fetch(url).then(res => _attachPlaceholder(res));
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