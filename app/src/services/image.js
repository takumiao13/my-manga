import Service from './_base';
import { isArray } from '@/helpers/utils';
import { NAMESPACE as APP_NAMESPACE} from '@/store/modules/app';

const Ratio = {
  V: 141.4, // 297 : 210,
  H: 65 // old -> 70.1
}

const Bounding = {
  EDGE: 1,
  MAX: (Ratio.V - 100)/2,
  MIN: (100 - Ratio.H)/2
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
    let ratio = (height / width) * 100 || Ratio.V;
    let scale = false, fitW = false, fitH = false;

    if (isNaN(ratio)) ratio = Ratio.V;

    // ___|___|___ ratio ___|___|___
    //   sec pri           pri sec
    //
    // - <= primary allow scale
    // - <= secondary allow center
    // - > secondary max 

    // should adjust v-ratio to scale image
    if (ratio > 100) {
      
      if (
        ratio >= Ratio.V - Bounding.EDGE && 
        ratio <= Ratio.V + Bounding.EDGE
      ) {
        scale = true;
        ratio = Ratio.V;
      } else if (ratio >= Ratio.V + Bounding.MAX) {
        fitW = true;
        ratio = Ratio.V + Bounding.MAX;
      }

    // should adjust h-ratio to scale image
    } else {
      
      if (
        ratio >= Ratio.H - Bounding.EDGE && 
        ratio <= Ratio.H + Bounding.EDGE
      ) {
        scale = true;
        ratio = Ratio.H;
      } else if (ratio <= Ratio.H - Bounding.MIN) {
        fitH = true;
        ratio = Ratio.H - Bounding.MIN; 
      }
    }

    return {
      class: { scale, fitW, fitH },
      style: { padding:'0 0 ' + ratio + '%' } // height: '100%'
    }
  }

  // when thumb should use maxRatio to prevent size to long
  // when in viewer must no maxRation to show origin size
  style({ width, height }, maxRatio) {
    let ratio = (height / width) * 100;

    if (maxRatio) {
      ratio = Math.min(ratio, maxRatio);
    }

    return { padding:'0 0 ' + ratio + '%' }
  }

}

export default ImageService;