<template>
  <div ref="mode" class="viewer-mode">
    <div class="prev-chapter"
      v-if="chIndex && chIndex > 1"
      @click.stop="$emit('chapterChange', chIndex - 1)">
      Prev Chapter
      <icon name="arrow-up" />
    </div>
    <div class="empty" v-if="!gallery.length"></div>

    <!-- GALLERY -->
    <div
      ref="imgWrapper"
      v-for="(item, index) in gallery"
      :key="item.path"
      :class="['img-wrapper', { gaps: settings.gaps }]"
    >
      <div class="img-loading">{{ index + 1 }}</div>
      <div 
        class="img-inner"
        :style="$service.image.style(item)"
      >
        <img 
          v-lazy="$service.image.makeSrc({
            path: item.path,
            width: item.width,
            height: item.height
          })" 
        />
      </div>
    </div>
    <!-- /GALLERY -->
    
    <div class="next-chapter"
      v-if="chIndex && chIndex < chCount" 
      @click.stop="$emit('chapterChange', chIndex + 1)">
      Next Chapter
      <icon name="arrow-down" />
    </div>
  </div>
</template>

<script>
import { debounce } from '@/helpers/utils';
import { getScrollTop, getScrollHeight, getOffsetHeight } from '@/helpers/dom';
import animateScrollTo from 'animate-scroll-to.js';

const SCROLL_SPEED_ADAPTER = {
  sm: 1.2,
  md: 1,
  lg: .8,
  xl: .6
};

export default {
  name: 'ScrollMode',

  props: {
    gallery: Array,
    page: [ Number, String ],
    chIndex: Number,
    chCount: Number,
    settings: Object,
    zoom: {
      type: [ String, Number ],
      default: 'width'
    },
    fullscreen: Boolean,
    autoPlaying: Boolean,
    locking: Boolean,
    appSize: String
  },

  data() {
    return {
      page_: this.page, // internal page valu
    }
  },

  watch: {
    gallery(val) {
      if (val) {
        this.$nextTick(() => {
          this.refresh();
          this.scrollToCurrPage(); 
        });
      }
    },

    page(val) {
      // 如果 page 和 page_ 值不一致，说明通过其他方式改变 page (seekbar)
      // 需要滚动到正确的位置
      if (val !== this.page_) {
        this.page_ = val;
        this.$nextTick(() => this.scrollToCurrPage());
      }
    },

    fullscreen() {
      this.refresh();
    },

    settings(newVal, oldVal) {
      // when settings changed refresh
      if (
        newVal.gaps !== oldVal.gaps || 
        newVal.zoom !== oldVal.zoom
      ) {
        this.$nextTick(() => {
          this.refresh();
          this.scrollToCurrPage(); 
        });
      }

      if (newVal.scrollSpeed !== oldVal.scrollSpeed) {
        this.changeScrollSpeed(newVal.scrollSpeed);
      }
    },

    autoPlaying(val) {
      this[val ? 'startScroll' : 'stopScroll']();
      this._$preventScroll(val);
    },

    locking(val) {
      if (this.autoPlaying) {
        this[val ? 'pauseScroll' : 'startScroll']();
        this._$preventScroll(!val);
      } 
    }
  },

  created() {
    this._offsets = [];
    this._$effects(true);
  },

  destroyed() {
    this._$effects(false);
  },

  methods: {
    _$preventScroll(val) {
      const options = { passive: false };
      window[val ? 'addEventListener' : 'removeEventListener']('wheel', this._$handlePreventScroll, options);
      document.body[val ? 'addEventListener' : 'removeEventListener']('touchmove', this._$handlePreventScroll, options);
    },

    _$handlePreventScroll($event) {
      $event.preventDefault();
    },

    _$effects(val) {
      window[val ? 'addEventListener' : 'removeEventListener']('scroll', this.handleScroll);
      window[val ? 'addEventListener' : 'removeEventListener']('resize', this.handleResize);
    },

    refresh() {
      const imgWrappers = this.$refs.imgWrapper;
      if (!imgWrappers) return;

      // should divide calculate offsets and set styles
      this._offsets = [].slice.call(imgWrappers).map((item, index) => {
        // when zoom is fit to screen we should adjust image height
        const { width } = this.gallery[index];
        item.style.width = width + 'px';

        const scrollTop = getScrollTop();
        const itemBCR = item.getBoundingClientRect();
        if (itemBCR.width || itemBCR.height) {
          return itemBCR.top + scrollTop
        }
      });
    
      console.log(this._offsets);
    },

    scrollToCurrPage() {
      let y = this._offsets[this.page - 1];
      // not covered image
      if (this.locking) {
        y -= 48;
      }

      if (this.settings.gaps) {
        y -= 2;
      }

      window._ignoreScrollEvent = true;
      window.scrollTo(0, y);
    },

    // handle auto scrolling
    startScroll() {
      console.log('[scroll] start');
      if (!this._scroller) {
        this._scroller = animateScrollTo('bottom', {
          speed: this.settings.scrollSpeed
        }, () => {
          this.stopScroll();
        });
      } else {
        this._scroller.resume();
      }
    },

    stopScroll() {
      if (this.autoPlaying) {
        console.log('[scroll] stop');
        this._scroller.pause();
        this.$emit('autoPlayEnd');
      }
    },

    changeScrollSpeed(value) {
      // adjust scroll spped by current app size
      value = (SCROLL_SPEED_ADAPTER[this.appSize] || 1) * value;
      
      if (this._scroller) {
        this._scroller.speed(value);
      }
    },

    pauseScroll() {
      console.log('[scroll] pause');
      this._scroller.pause();
    },

    // events
    handleScroll() {
      // prevent scrollTo trigger event，when page_ updated
      if (window._ignoreScrollEvent) {
        setTimeout(() => window._ignoreScrollEvent = false);
        return;
      }

      const scrollHeight = getScrollHeight();
      const maxScroll = scrollHeight - getOffsetHeight();
      const scrollTop = Math.ceil(getScrollTop());
      const offsetLength = this._offsets.length;

      if (scrollTop >= maxScroll) {
        if (this.page_ !== this.gallery.length) {
          this.page_ = this.gallery.length;
          this.$emit('pageChange', this.page_);
        }
        return;
      }

      for (let i = offsetLength; i >= 0; i--) {
        let isActiveTarget = this.page_ !== i+1 &&
          scrollTop >= this._offsets[i] &&
          (typeof this._offsets[i + 1] === 'undefined' || scrollTop < this._offsets[i + 1]) // check last offset
          
        if (isActiveTarget) {
          this.page_ = i+1;
          this.$emit('pageChange', this.page_);
        }
      }
    },
    
    handleResize: debounce(function() { this.refresh() }, 500)
  }
}
</script>

<style lang="scss" scoped>
@import '@/assets/style/base';

.prev-chapter, .next-chapter {
  height: 3rem;
  line-height: 3rem;
  font-size: 110%;
  text-align: center;
  cursor: pointer;
  position: relative;
  z-index: 4; // over `viewer-viewport`
  background: #666;

  &:hover {
    color: #fff;
  }
}

.empty {
  display: flex;
  flex: 1;
  justify-content: center;
  align-items: center;
}

.img-wrapper {
  position: relative;
  margin: 0 auto; // .25rem
  background: #3c4043;
  overflow:  hidden;
  max-width: 100%;

  &.gaps {
    margin: .25rem auto;
  }

  > .img-loading {
    color: #666;
    font-size: 6rem;
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    font-weight: 300;

    @include media-breakpoint-up(md) {
      font-size: 8rem;
    }

    @include media-breakpoint-up(lg) {
      font-size: 10rem;
    }

    @include media-breakpoint-up(xl) {
      font-size: 12rem;
    }
  }

  > .img-inner img {
    position: absolute;
    max-width: 100%;
    max-height: 100%;
    left: 50%;
    transform: translateX(-50%);
  }
}
</style>