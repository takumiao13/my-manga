<template>
  <div class="viewer-mode" ref="mode" 
    :style="{ 
      'max-width': zoom === 100 ? 'none' : null, 
      width: zoom === 100 ? 'auto' : null  
    }"
  >
    <div class="prev-ch"
      v-if="chIndex && chIndex > 1"
      @click.stop="$emit('chapterChange', chIndex - 1)">
      Prev Chapter
      <icon name="arrow-up" />
    </div>

    <div
      ref="imgWrapper"
      v-for="(item, index) in gallery"
      :class="['img-wrapper', { gaps: settings.gaps }]"
      :key="item.path"
      :style="{ 
        width: item.width + 'px',
        'max-width': zoom === 100 ? 'none' : null
      }"
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

    <div class="next-ch"
      v-if="chIndex && chIndex < chCount" 
      @click.stop="$emit('chapterChange', chIndex + 1)">
      Next Chapter
      <icon name="arrow-down" />
    </div>
  </div>
</template>

<script>
import { debounce, getScrollTop, getScrollHeight, getOffsetHeight } from '@/helpers';
import { types } from '@/store/modules/viewer';
import animatescroll from 'animatescroll';

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
    autoScrolling: Boolean,
    locking: Boolean
  },

  data() {
    return {
      page_: this.page, // internal page value
      chCount: this.chapters.length
    }
  },

  watch: {
    gallery(val) {
      if (val) {
        this.$nextTick(() => {
          this.refresh('gallery');
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

    zoom() {
      this.refresh();
    },

    autoScrolling(val) {
      console.log('autoScrolling', val);
      this[val ? 'startScroll' : 'stopScroll']();
    },

    locking(val) {
      console.log('locking', val);
      this.autoScrolling && this[val ? 'pauseScroll' : 'resumeScroll']();
    }
  },

  created() {
    console.log(this._scroller);
    this._offsets = [];
    this._ignoreScrollEvent = false;
  },

  destroyed() {
    window.removeEventListener('scroll', this.handleScroll);
    window.removeEventListener('resize', this.handleResize);
  },

  mounted() {
    window.addEventListener('resize', this.handleResize);
    window.addEventListener('scroll', this.handleScroll);
  
    this.refresh()
    this.scrollToCurrPage();
  },

  methods: {
    refresh() {
      const imgWrappers = this.$refs.imgWrapper;
      const viewWidth = this.$refs.mode.clientWidth;
      const viewHeight = window.innerHeight;
      if (!imgWrappers) return;

      this._offsets = [].slice.call(imgWrappers).map((item, index) => {
        // when zoom is fit to screen we should adjust image height
        const { width: orgWidth, height: orgHeight } = this.gallery[index];
        const realWidth = Math.max(viewWidth, orgWidth);
        const ratio = realWidth / orgWidth;
        const realHeight = orgHeight * ratio;

        if (this.zoom === 'screen') {
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
    },

    scrollToCurrPage() {
      const y = this._offsets[this.page - 1];
      console.log('scrollTo', this.page, y);
      window._ignoreScrollEvent = true;
      window.scrollTo(0, y);
    },

    startScroll() {
      console.log('start');
      if (!this._scroller) {
        this._scroller = animatescroll.to({
          y: 'bottom',
          speed: 50
        });
      } else {
        this._scroller.resume();
      }
    },

    stopScroll() {
      if (this.autoScrolling && !this._scroller.isPaused()) {
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
.prev-ch, .next-ch {
  padding: 1rem;
  text-align: center;
  color: #999;
  font-weight: bold;
  cursor: pointer;

  &:hover {
    color: #fff;
  }
}
</style>