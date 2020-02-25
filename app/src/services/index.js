import ImageService from './image';
import VideoService from './video';
import PDFService from './pdf';
import MediaService from './media';

const Services = {
  install(Vue, options) {
    const imageService = new ImageService(options);
    const videoService = new VideoService(options);
    const pdfService = new PDFService(options);
    const mediaService = new MediaService(options);

    Vue.prototype.$service = {
      image: imageService,
      video: videoService,
      pdf: pdfService,
      media: mediaService
    }
  }
}

export default Services;