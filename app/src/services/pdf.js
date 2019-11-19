import { isArray } from '@/helpers/utils';
import Service from './_base';

class PDFService extends Service {

  makeSrc(paths, escape) {
    const { baseURL } = this.$config;
    const { dirId } = this.$store.getters['app/repo'];
    const path = isArray(paths) ? paths.join('/') : paths;

    let src = dirId && path && `${baseURL}pdf/${dirId}/${encodeURIComponent(path)}`;
    
    if (src && escape) {
      src = src.replace(/(\(|\))/g, "\\$1");
    }

    return src;
  }
}

export default PDFService;