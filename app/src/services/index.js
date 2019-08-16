import ImageService from './image';

const Services = {
  install(Vue, options) {
    const imageService = new ImageService(options);

    Vue.prototype.$service = {
      image: imageService
    }
  }
}

export default Services;