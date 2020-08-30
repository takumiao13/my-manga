import Service from './_base';
import { isArray } from '@/helpers/utils';
import { NAMESPACE as APP_NAMESPACE} from '@/store/modules/app';

const Ratio = {
  V: 141.4, // 297 : 210,
  H: 65 // old -> 70.1
}

const Bounding = {
  EDGE: 2,
  MAX: (Ratio.V - 100)/2,
  MIN: (100 - Ratio.H)/2
};

class ImageService extends Service {

  /**
   * 
   * @param {string[]|string} paths 
   * @param {Boolean} escape escape `(` and `)`
   * @param {string} dirId 
   */
  makeSrc({ dirId, path, escape, thumb, width, height }) {
    dirId = dirId || this.$store.getters[`${APP_NAMESPACE}/repo`].dirId
    path = isArray(path) ? path.join('/') : path;

    const { BASE_URL } = this.$config.api;
    let src = dirId && path && `${BASE_URL}img/${dirId}/${encodeURIComponent(path)}`;
    
    if (!src) return src;

    // escape `()` when in background-image (video poster)
    if (escape) {
      src = src.replace(/(\(|\))/g, '\\$1');
    }
    const params = [];
  
    if (src && thumb) {
      if (width > height) {
        params.push('h=380');
      } else {
        params.push('w=240');
      }
    } else if (width && width > 800) {
      params.push('w=800')
    }
  
    // add jwt token for auth
    const token = localStorage.getItem('Authorization');
    if (src && token) {
      params.push(`access_token=${token}`)
    }

    if (params.length) {
      src += `?${params.join('&')}`
    }

    return src;
  }
  
  coverStyle({ width, height }) {
    let ratio = (height / width) * 100 || Ratio.V;
    let scale = false, fitW = false, fitH = false;

    if (isNaN(ratio)) ratio = Ratio.V;

    // _m____x_ (h) _x___ 100 ___x_ (v) _x____m_
    //
    // - ratio in [r-x ~ r+x] (scale)
    // - ratio > max (fitW, fitH)
    // - else center original size

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
      style: { padding: '0 0 ' + ratio + '%' } // height: '100%'
    }
  }

  // when in gallery should use maxRatio to prevent size too long
  // when in viewer must no maxRation to show the origin size
  style({ width, height }, maxRatio) {
    let ratio = (height / width) * 100;

    if (maxRatio) {
      ratio = Math.min(ratio, maxRatio);
    }

    return { padding:'0 0 ' + ratio + '%' }
  }

  shouldMultiWidth({ width, height }) {
    if (!width || !height) return false;
    const ratio = (height / width) * 100;
    if (ratio < 72) return true;
    return false;
  }
}

export default ImageService;