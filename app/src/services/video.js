import { isArray } from '@/helpers/utils';
import Service from './_base';

class MotionService extends Service {

  makeSrc(paths, escape) {
    const { baseURL } = this.$config;
    const { dirId } = this.$store.getters['app/repo'];
    const path = isArray(paths) ? paths.join('/') : paths;

    let src = dirId && path && `${baseURL}vid/${dirId}/${encodeURIComponent(path)}`;

    return src;
  }
}

export default MotionService;