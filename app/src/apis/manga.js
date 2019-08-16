
import fetch from './fetch';
import groupBy from 'lodash/groupBy';

function list({ path, dirId }) {
  let url = `api/manga/list/${dirId}`;
  if (path) url += `/${encodeURIComponent(path)}`;
  return fetch(url)
    .then(res => {
      // filter cover from list
      let list = res.list = res.children;
      if (res.metadata && res.metadata.cover) {
        list = list.filter(img => img.name !== res.metadata.cover);
      }

      const group = groupBy(list, 'type');

      Object.assign(res, {
        folders: group.FOLDER || [],
        mangas: group.MANGA || [],
        chapters: group.CHAPTER || [],
        images: group.IMAGE || []
      });

      return res;
    });
}

function folder({ path, dirId }) {
  let url = `api/manga/folder/${dirId}`;
  if (path) url += `/${encodeURIComponent(path)}`;
  return fetch(url);
}

export default {
  list,
  folder,
}