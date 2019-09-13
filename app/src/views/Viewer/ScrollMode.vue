<template>
  <div class="viewer-mode" ref="mode">
    <div class="prev-ch"
      v-if="chIndex && chIndex > 1"
      @click="$emit('chapterChange', chIndex - 1)">
      Prev Chapter
      <icon name="chevron-circle-up" />
    </div>

    <div
      ref="imgWrapper"
      v-for="(item, index) in gallery"
      :class="['img-wrapper', { 'has-margin': imageMargin }]"
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
      <icon name="chevron-circle-down" />
    </div>

    <!-- PAGER -->
    <div class="pager-info py-1 px-2 d-md-none">
      {{ page_ }} / {{ gallery.length }}
    </div>
    <!-- /PAGER -->
  </div>
</template>

<script>
import { debounce, getScrollTop, getScrollHeight, getOffsetHeight, smoothscroll } from '@/helpers';
import config from '@/config';

export default {
  name: 'ScrollMode',

  props: {
    zoom: String,
    gallery: Array,
    chapters: Array,
    page: [ Number, String ],
    chIndex: Number,
    imageMargin: {
      type: Boolean,
      default: true
    }
  },

  data() {
    return {
      page_: this.page, // 内部 page 值
      chCount: this.chapters.length
    }
  },

  watch: {
    gallery(newVal, oldVal) {
      if (newVal) {
        this.$nextTick(() => {
          this.refresh('gallery');
          this.scrollToCurrPage(); 
        });
      }
    },

    page(newVal, oldVal) {
      // 如果 page 和 page_ 值不一致，说明通过其他方式改变 page (seekbar)
      // 需要滚动到正确的位置
      if (newVal !== this.page_) {
        this.page_ = newVal;
        this.$nextTick(() => this.scrollToCurrPage());
      }
    },

    zoom(newVal, oldVal) {
      console.log('zoom', newVal);
      this.refresh();
    }
  },

  created() {
    this._offsets = [];
    this._ignoreScrollEvent = false;
    window.addEventListener('scroll', this.handleScroll);
    window.addEventListener('resize', this.handleResize);
  },

  destroyed() {
    window.removeEventListener('scroll', this.handleScroll);
    window.removeEventListener('resize', this.handleResize);
  },

  mounted() {
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

    wrapperStyle(item) {
      return { width: item.width + 'px' }
    },

    scrollToCurrPage() {
      this._ignoreScrollEvent = true;
      const y = this._offsets[this.page - 1];
      console.log('scrollTo', this.page, y);
      window.scrollTo(0, y);
    },

    handleScroll(e) {
      // 阻止 scrollTo 触发事件，改变 page_
      if (this._ignoreScrollEvent) {
        this._ignoreScrollEvent = false;
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
    
    handleResize: debounce(function() {
      this.refresh();
    }, 500)
  }
}
</script>

<style lang="scss" scoped>
.pager-info {
  position: fixed;
  background: rgba(#202124, .6);
  right: 0;
  bottom: 0;
}

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