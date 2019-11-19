import ImageService from './image';
import VideoService from './video';
import PDFService from './pdf';

const Services = {
  install(Vue, options) {
    const imageService = new ImageService(options);
    const videoService = new VideoService(options);
    const pdfService = new PDFService(options);

    Vue.prototype.$service = {
      image: imageService,
      video: videoService,
      pdf: pdfService
    }
  }
}

export default Services;