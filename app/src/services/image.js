import Service from './_base';
import { isArray } from '@/helpers/utils';
import { NAMESPACE as APP_NAMESPACE} from '@/store/modules/app';

const Ratio = {
  V: 141.4, // 297 : 210,
  H: 65 // old -> 70.1
}

const BOUNDING = 1;

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
    let scale = false, fitW = false, fitH = false;

    if (isNaN(ratio)) ratio = Ratio.V;

    // ___|___|___ ratio ___|___|___
    //   sec pri           pri sec
    //
    // - <= primary allow scale
    // - <= secondary allow center
    // - > secondary max 

    // should adjust v-ratio to scale image
    if (ratio > 100 || isNaN(ratio)) {
      if (
        ratio >= Ratio.V - BOUNDING && 
        ratio <= Ratio.V + BOUNDING
      ) {
        scale = true;
      } else if (ratio < Ratio.V - BOUNDING) {
        fitH = true;
      } else if (ratio > Ratio.V + BOUNDING) {
        fitW = true;
      }

      ratio = Ratio.V;

    // should adjust h-ratio to scale image
    } else {
      
      if (
        ratio >= Ratio.H - BOUNDING && 
        ratio <= Ratio.H + BOUNDING
      ) {
        scale = true;
      } else if (ratio < Ratio.H - BOUNDING) {
        fitH = true;
      } else if (ratio > Ratio.H + BOUNDING) {
        fitW = true;
      }

      ratio = Ratio.H;
    }

    return {
      class: { scale, fitW, fitH },
      style: { padding:'0 0 ' + ratio + '%', height: '100%' }
    }
  }

  style({ width, height }, maxRatio = 240) {
    let ratio = (height / width) * 100;

    if (maxRatio) {
      ratio = Math.min(ratio, maxRatio);
    }

    return { padding:'0 0 ' + ratio + '%' }
  }

}

export default ImageService;