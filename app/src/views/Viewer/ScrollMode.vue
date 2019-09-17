<template>
  <div class="viewer-mode" ref="mode" :style="{ width: zoom === 100 ? 'auto' : '100%' }">
    <div class="prev-ch"
      v-if="chIndex && chIndex > 1"
      @click="$emit('chapterChange', chIndex - 1)">
      Prev Chapter
      <icon name="arrow-up" />
    </div>

    <div
      ref="imgWrapper"
      v-for="(item, index) in gallery"
      :class="['img-wrapper', { gaps: gaps }]"
      :key="item.path"
      :style="wrapperStyle(item)"
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
      @click="$emit('chapterChange', chIndex + 1)">
      Next Chapter
      <icon name="arrow-down" />
    </div>
  </div>
</template>

<script>
import { debounce, getScrollTop, getScrollHeight, getOffsetHeight } from '@/helpers';
import { types } from '@/store/modules/viewer';

export default {
  name: 'ScrollMode',

  props: {
    gallery: Array,
    chapters: Array,
    page: [ Number, String ],
    chIndex: Number,
    gaps: {
      type: Boolean,
      default: true
    },
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
    gallery(newVal) {
      if (newVal) {
        this.$nextTick(() => {
          this.refresh('gallery');
          this.scrollToCurrPage(); 
        });
      }
    },

    page(newVal) {
      // 如果 page 和 page_ 值不一致，说明通过其他方式改变 page (seekbar)
      // 需要滚动到正确的位置
      if (newVal !== this.page_) {
        this.page_ = newVal;
        this.$nextTick(() => this.scrollToCurrPage());
      }
    },

    zoom() {
      this.refresh();
    },

    // TODO: 锁住 ...
    locking(val) {

    },

    autoScrolling(val) {
      console.log('auto scrolling ', val);
      const $cntr = this.$container;
      const self = this;

      // start
      if (val) {
        start();
      // stop
      } else {
        stop();
      }

      function start() {
        step();
      }

      function step() {
        setTimeout(() => {
          $cntr.scrollTop += 5;
          if (isBottom() || self.locking) {
            stop();
          } else {
            step();
          }
        }, 100);
      }

      function stop() {
        // when locking dont change auto scrolling
        // just pause it
        if (self.autoScrolling && !self.locking) {
          self.$store.dispatch(types.TOGGLE_AUTO_SCROLLING, { autoScrolling: false });
        }
      }

      function isBottom() {
        const scrollH = $cntr.scrollHeight;
        const h = $cntr.scrollTop + $cntr.clientHeight;
        return scrollH < h + 1 && scrollH > h - 1;
      }
    }
  },

  created() {
    this._offsets = [];
    this._ignoreScrollEvent = false;
    this._startScrolling = false;
  },

  destroyed() {
    this.$container.removeEventListener('scroll', this.handleScroll);
    window.removeEventListener('resize', this.handleResize);
  },

  mounted() {
    this.$container = document.querySelector('.viewer-container');
    this.$container.addEventListener('scroll', this.handleScroll);
    window.addEventListener('resize', this.handleResize);

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

        const scrollTop = getScrollTop(this.$container);
        const itemBCR = item.getBoundingClientRect();
        if (itemBCR.width || itemBCR.height) {
          return itemBCR.top + scrollTop
        }
      });
    },

    wrapperStyle(item) {
      return { width: item.width + 'px' }
    },

    scrollToCurrPage() {
      this._ignoreScrollEvent = true;
      const y = this._offsets[this.page - 1];
      console.log('scrollTo', this.page, y);
      window.scrollTo(0, y);
    },

    // events
    handleScroll() {
      // prevent scrollTo trigger event，when page_ updated
      if (this._ignoreScrollEvent) {
        this._ignoreScrollEvent = false;
        return;
      }

      const scrollHeight = getScrollHeight(this.$container);
      const maxScroll = scrollHeight - getOffsetHeight(this.$container);
      const scrollTop = Math.ceil(getScrollTop(this.$container));
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