import Service from './_base';

const MediaQuery = {
  XL: '(min-width: 1200px)',
  LG: '(max-width: 1199.98px) and (min-width: 992px)',
  MD: '(max-width: 991.98px) and (min-width: 576px)',
  SM: '(max-width: 575.98px)'
};

class MediaService extends Service {

  constructor(options) {
    super(options);
    const xl = window.matchMedia(MediaQuery.XL);
    const lg = window.matchMedia(MediaQuery.LG);
    const md = window.matchMedia(MediaQuery.MD);
    const sm = window.matchMedia(MediaQuery.SM);

    this.mqMap = {
      [MediaQuery.XL]: { $media: xl, $active: 'xl' },
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
    return this.mqMap[media].$active === value;
  }

  get active() {
    const media = this._currentMq.media;
    return this.mqMap[media].$active;
  }
}

export default MediaService;