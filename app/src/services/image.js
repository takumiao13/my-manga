import Service from './_base';

const DEFAULT = {
  ratio: 141.4
};

class ImageService extends Service {

  makeSrc(...paths) {
    const { baseURL } = this.$config;
    const { dirId } = this.$store.getters['app/repo'];
    const path = paths.join('/');
    
    return dirId && path && `${baseURL}img/${dirId}/${encodeURIComponent(path)}`;
  }

  coverStyle({ width, height }, limit) {
    let ratio = (height / width) * 100;
    if (limit) ratio = Math.min(ratio, DEFAULT.ratio);
    return { padding:'0 0 ' + ratio + '%' }
  }

}

export default ImageService;