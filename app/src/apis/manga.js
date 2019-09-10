
import fetch from './fetch';
import groupBy from 'lodash/groupBy';

function transformResponse(res) {
  let { metadata, cover, path, children: list } = res;
      
  if (metadata && metadata.cover) {
    cover = path + '/' + metadata.cover; // if cover specified use it
    list = list.filter(img => img.name !== metadata.cover);
  }

  const group = groupBy(list, 'type');

  Object.assign(res, {
    list,
    cover,
    folders: group.FOLDER || [],
    mangas: group.MANGA || [],
    chapters: group.CHAPTER || [],
    images: group.IMAGE || []
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

export default {
  list,
  pick,
  folder,
}