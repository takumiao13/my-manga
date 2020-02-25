import Service from './_base';

const MediaQuery = {
  LG: '(min-width: 1200px)',
  MD: '(max-width: 1199.98px) and (min-width: 576px)',
  SM: '(max-width: 575.98px)'
};

class MediaService extends Service {

  constructor(options) {
    super(options);
    const lg = window.matchMedia(MediaQuery.LG);
    const md = window.matchMedia(MediaQuery.MD);
    const sm = window.matchMedia(MediaQuery.SM);

    this.mqMap = {
      [MediaQuery.LG]: { $media: lg, $active: 'lg' },
      [MediaQuery.MD]: { $media: md, $active: 'md' },
      [MediaQuery.SM]: { $media: sm, $active: 'sm' }
    }

    this._currentMq = null;
  }

  addListener(listener) {
    const _listener = (mq) => {
      if (mq.matches) {
        this._currentMq = mq;
        mq.$active = this.mqMap[mq.media].$active;
        listener(mq);
      }
    }

    Object.keys(this.mqMap).forEach(key => {
      const mq = this.mqMap[key].$media;
      _listener(mq);
      mq.addListener(_listener);
    });

    return () => {
      Object.keys(this.mqMap).forEach(key => {
        const mq = this.mqMap[key].$media;
        mq.removeListener(_listener);
      });
    }
  }

  isActive(value) {
    const media = this._currentMq.media;
    console.log(media, this.mqMap[media].$active);

    return this.mqMap[media].$active === value;
  }
}

export default MediaService;