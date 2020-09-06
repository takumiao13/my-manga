import videojs from 'video.js'
import expandSvgInline from '@/assets/icons/expand.svg?inline';
import compressSvgInline from '@/assets/icons/compress.svg?inline';
import makeSvg from './makeSvg';

const expandSvg = makeSvg(expandSvgInline);
const compressSvg = makeSvg(compressSvgInline);

const Button = videojs.getComponent('Button');

class FullscreenToggleButton extends Button  {
  constructor(player, options = {}) {
    super(player, options);
    this._isFullscreen = false;
  }

  ready() {
    const el = this.el();
    el.style.marginLeft = 'auto';
    this.replaceIcon();
  }

  handleClick() {
    this._isFullscreen = !this._isFullscreen;
    this.replaceIcon();
  }

  replaceIcon() {
    const icon = this._isFullscreen ? compressSvg  : expandSvg;
    const el = this.el();
    const wrapper = el.querySelector('.vjs-icon-placeholder');
    wrapper.innerHTML = '';
    wrapper.appendChild(icon)
  }
}

FullscreenToggleButton.prototype.controlText_ = 'Fullscreen';

export default FullscreenToggleButton;