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
  const versions = group.VERSION ? orderBy(group.VERSION, ['fileType', 'name'], ['desc', 'asc']) : [];
  
  // FIXED: simple extract cover, but we should do more check later.
  const images = group.IMAGE && group.IMAGE.length > 1 ? group.IMAGE : [];

  Object.assign(res, {
    list,
    cover,
    files: group.FILE || [],
    mangas: group.MANGA || [],
    chapters: group.CHAPTER || [],
    images,
    versions
  });

  return res;
}

function search({ dirId, path, keyword }) {
  const url = `${_buildURL(dirId, path)}/search?keyword=${keyword}`;
  return fetch(url).then(res => {
    const obj = { path: '', children: res };
    return _transformResponse(obj);
  });
}

function list({ dirId, path }) {
  const url = `${_buildURL(dirId, path)}/list`;
  return fetch(url).then(_transformResponse)
}

function folder({ dirId, path }) {
  const url = `${_buildURL(dirId, path)}/folder`;
  return fetch(url).then(res => {
    // group manga
    const mangaGroup = {
      _mangaGroup: true,
      children: []
    };
    const folders = [];
    res.children.forEach(child => {
      if (child.type === 'FILE') {
        folders.push(child);
      } else {
        mangaGroup.children.push(child);
      }
    });

    const count = mangaGroup.children.length;
    if (count) {
      folders.unshift(mangaGroup);
    }

    return { folders }
  })
}

function pick({ dirId, path }) {
  const url = `${_buildURL(dirId, path)}/pick`;
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
  share
}