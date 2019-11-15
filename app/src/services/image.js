import Service from './_base';
import { isArray } from '@/helpers/utils';
import { NAMESPACE as APP_NAMESPACE} from '@/store/modules/app';

const DEFAULT = {
  vRatio: 141.4,
  hRatio: 70.1
};

class ImageService extends Service {

  makeSrc(paths, escape) {
    const { baseURL } = this.$config;
    const { dirId } = this.$store.getters[`${APP_NAMESPACE}/repo`];
    const path = isArray(paths) ? paths.join('/') : paths;
    let src = dirId && path && `${baseURL}img/${dirId}/${encodeURIComponent(path)}`;
    
    // TODO: remove it ?
    if (src && escape) {
      src = src.replace(/(\(|\))/g, '\\$1');
    }
  
    return src;
  }
  
  coverStyle({ width, height }) {
    let ratio = (height / width) * 100;
    let adjust = false;
    const bounding = 8;
    
    if (ratio >= DEFAULT.vRatio - bounding && ratio <= DEFAULT.vRatio + bounding) {
      ratio = DEFAULT.vRatio;
      adjust = true;
    } else if (ratio >= DEFAULT.hRatio - bounding && ratio <= DEFAULT.hRatio + bounding) {
      ratio = DEFAULT.hRatio;
      adjust = true;
    }

    if (ratio > DEFAULT.vRatio + bounding) {
      ratio = DEFAULT.vRatio;
    }

    return {
      class: { adjust },
      style: { padding:'0 0 ' + ratio + '%' }
    }
  }

  style({ width, height }, maxRatio) {
    let ratio = (height / width) * 100;
    if (maxRatio) ratio = Math.min(ratio, maxRatio);
    return { padding:'0 0 ' + ratio + '%' }
  }

}

export default ImageService;