
import fetch from './fetch';
import { groupBy, orderBy } from '@/helpers/utils';

function transformResponse(res) {
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

function list({ path, dirId }) {
  let url = `api/manga/list/${dirId}`;
  if (path) url += `/${encodeURIComponent(path)}`;
  return fetch(url).then(transformResponse)
}

function pick({ path, dirId }) {
  let url = `api/manga/pick/${dirId}`;
  if (path) url += `/${encodeURIComponent(path)}`;
  return fetch(url).then(transformResponse)
}

function folder({ path, dirId }) {
  let url = `api/manga/folder/${dirId}`;
  if (path) url += `/${encodeURIComponent(path)}`;
  return fetch(url);
}

function share(longUrl) {
  const url = 'api/manga/share';
  return fetch(url, {
    method: 'post',
    headers: {
      'content-type': 'application/json;charset=utf-8'
    },
    body: JSON.stringify({ url: longUrl })
  });
}

export default {
  list,
  pick,
  folder,
  share
}