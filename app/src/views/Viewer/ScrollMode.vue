<template>
  <div
    ref="mode"
    class="viewer-mode"
  >
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
        <img v-lazy="$service.image.makeSrc(item.path)" />
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
import { types } from '@/store/modules/viewer';
import animateScrollTo from 'animate-scroll-to.js';

export default {
  name: 'ScrollMode',

  props: {
    gallery: Array,
    chapters: Array,
    page: [ Number, String ],
    chIndex: Number,
    settings: Object,
    zoom: {
      type: [ String, Number ],
      default: 'width'
    },
    isFullscreen: Boolean,
    autoScrolling: Boolean,
    locking: Boolean
  },

  data() {
    return {
      page_: this.page, // internal page valu
    }
  },

  computed: {
    chCount() {
      return this.chapters.length;
    }
  },

  watch: {
    gallery(val) {
      if (val) {
        this.$nextTick(() => {
          this.refresh('gallery');
          this.scrollToCurrPage(true); 
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

    zoom() {
      this.refresh();
    },

    isFullscreen() {
      this.refresh();
    },

    settings(newVal, oldVal) {
      if (newVal.gaps !== oldVal.gaps) {
        this.refresh();
      }
    },

    autoScrolling(val) {
      this[val ? 'startScroll' : 'stopScroll']();
      this._$preventScroll(val);
    },

    locking(val) {
      if (this.autoScrolling) {
        this[val ? 'pauseScroll' : 'resumeScroll']();
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

  mounted() {
    if (this.gallery.length) {
      this.refresh()
      this.scrollToCurrPage(true);
    }
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
      document.body.classList[val ? 'add' : 'remove']('viewer-active');
      window[val ? 'addEventListener' : 'removeEventListener']('scroll', this.handleScroll);
      window[val ? 'addEventListener' : 'removeEventListener']('resize', this.handleResize);
    },

    refresh() {
      // update viewWidth first
      const { zoom } = this.settings;
      this.$refs.mode.style['max-width'] = zoom === 100 ? 'none' : null;

      const imgWrappers = this.$refs.imgWrapper;
      const viewWidth = this.$refs.mode.clientWidth;
      const viewHeight = window.innerHeight;
      if (!imgWrappers) return;

      // TODO: need optimize
      // should divide calculate offsets and set styles
      this._offsets = [].slice.call(imgWrappers).map((item, index) => {
        // when zoom is fit to screen we should adjust image height
        const { width: orgWidth, height: orgHeight } = this.gallery[index];
        const realWidth = Math.max(viewWidth, orgWidth);
        const ratio = realWidth / orgWidth;
        const realHeight = orgHeight * ratio;
        
        item.style['max-width'] = zoom === 100 ? 'none' : null;

        if (zoom === 'screen') {
          if (realHeight > viewHeight) {
            const ratio = viewHeight / realHeight;
            item.style.width = orgWidth * ratio + 'px';
          }
        } else {
          item.style.width = orgWidth + 'px';
        }

        const scrollTop = getScrollTop();
        const itemBCR = item.getBoundingClientRect();
        if (itemBCR.width || itemBCR.height) {
          return itemBCR.top + scrollTop
        }
      });
    
      console.log(this._offsets);
    },

    scrollToCurrPage(margin) {
      let y = this._offsets[this.page - 1];
      if (margin) y -= 48
      console.log('scrollTo', this.page, y, margin);
      window._ignoreScrollEvent = true;
      window.scrollTo(0, y);
    },

    // handle auto scrolling
    startScroll() {
      console.log('start');
      if (!this._scroller) {
        this._scroller = animateScrollTo('bottom', {
          speed: 50
        }, () => {
          this.stopScroll();
        });
      } else {
        this._scroller.resume();
      }
    },

    stopScroll() {
      if (this.autoScrolling) {
        console.log('stop');
        this._scroller.pause();
        this.$store.dispatch(types.TOGGLE_AUTO_SCROLLING, { autoScrolling: false });
      }
    },

    pauseScroll() {
      console.log('pause');
      this._scroller.pause();
    },

    resumeScroll() {
      console.log('resume');
      this._scroller.resume();
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
.prev-chapter, .next-chapter {
  height: 3rem;
  line-height: 3rem;
  font-size: 110%;
  text-align: center;
  cursor: pointer;

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
</style>