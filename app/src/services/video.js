import { isArray } from '@/helpers/utils';
import Service from './_base';

class MotionService extends Service {

  makeSrc(paths) {
    const { BASE_URL } = this.$config.api;
    const { dirId } = this.$store.getters['app/repo'];
    const path = isArray(paths) ? paths.join('/') : paths;

    let src = dirId && path && `${BASE_URL}vid/${dirId}/${encodeURIComponent(path)}`;

    return src;
  }
}

export default MotionService;