<template>
  <div ref="mode" class="viewer-mode">
    <div class="prev-chapter"
      v-if="chIndex && chIndex > 1"
      @click.stop="$emit('chapterChange', chIndex - 1)">
      Prev Chapter
      <icon name="arrow-up" />
    </div>
    <div class="empty" v-if="!gallery.length"></div>

    <!-- SWIPER -->
    <swiper 
      ref="swiper" 
      class="swiper" 
      :key="settings.effect" 
      :options="swiperOptions"
      :auto-update="true"
    >
      <swiper-slide v-for="(item, index) in gallery" :key="item.path">       
        <div class="img-wrapper">
          <div class="img-loading">{{ index + 1 }}</div>
            <img 
              ref="imgs"
              class="swiper-lazy"
              :data-src="$service.image.makeSrc({
                path: item.path,
                width: item.width,
                height: item.height
              })"  
            />
        </div>       
      </swiper-slide>
      <div class="swiper-button-prev" slot="button-prev" @click.stop="$emit('prev')"></div>
      <div class="swiper-button-next" slot="button-next" @click.stop="$emit('next')"></div>
    </swiper>
    <!-- /SWIPER -->

    <div class="next-chapter"
      v-if="chIndex && chIndex < chCount" 
      @click.stop="$emit('chapterChange', chIndex + 1)">
      Next Chapter
      <icon name="arrow-down" />
    </div>
  </div>
</template>

<script>
export default {
  name: 'SwiperMode',

  props: {
    gallery: Array,
      // - change page by props (next, prev)
      // - change page auto play
      // - change page by navigation
    page: [ Number, String ],
    chIndex: Number,
    chCount: Number,
    settings: Object,
    fullscreen: Boolean,
    autoScrolling: Boolean,
    locking: Boolean
  },

  data() {
    return {
      started: this.autoScrolling,
      paused: true 
    }
  },

  computed: {
    swiper() {
      return this.$refs.swiper.$swiper;
    },

    swiperOptions() {
      const options = {
        spaceBetween: 8,
        navigation: {
          nextEl: '.swiper-button-next',
          prevEl: '.swiper-button-prev'
        },
        lazy: {
          loadPrevNext: true,
          loadPrevNextAmount: 2
        },
      };

      if (this.settings.effect === 'fade') {
        options.effect = 'fade';
        options.fadeEffect = { crossFade: true };
      }

      return options;
    }
  },

  watch: {
    page(newVal, oldVal) {
      const slideSpeed = Math.abs(newVal - oldVal) > 1 ? 0 : 500;
      this.$nextTick(() => this.swiper.slideTo(newVal-1, slideSpeed, true));
    },

    locking(val) {
      if (this.autoScrolling && this.started) {
        this[val ? 'pausePlay' : 'startPlay']();
      }
    },

    autoScrolling(val) {
      this[val ? 'startPlay' : 'stopPlay']();
    }
  },

  mounted() {
    this.swiper.on('slideChange', (evt) => {
      const page = evt.activeIndex + 1;

      if (page <= this.gallery.length) {
        this.$emit('pageChange', page);
      }

      if (page >= this.gallery.length && this.autoScrolling) {
        this.$emit('autoPlayEnd');
      }
    });

    // slide to current page
    this.swiper.slideTo(this.page-1, 0, true);
  },

  methods: {
    startPlay() {
      console.log('[swipe] start');
      const loop = () => {
        setTimeout(() => {
          if (this.paused) return;
          this.$emit('pageChange', this.page+1);
          loop();
        }, this.settings.playInterval);
      };

      this.started = true;
      this.paused = false;
      loop();
    },

    stopPlay() {
      console.log('[swipe] stop');
      this.paused = true;
      this.started = false;
    },

    pausePlay() {
      console.log('[swipe] pause');
      this.paused = true;
    }
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
  z-index: 3; // over `viewer-viewport`
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
  margin: 0 auto;
  overflow:  hidden;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
 
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

  >  img {
    max-height: 100%;
    max-width: 100%;
    position: relative;
  }
}

.swiper {
  width: 100%;
  height: 100%;
}

.swiper-slide {
  display: flex;
  justify-content: center;
  align-items: center;
}

.swiper-button-prev,
.swiper-button-next {
  width: 33.3%;
  margin-top: 0;
  height: auto;
  opacity: .5;
  top: 0;
  bottom: 0;

  &:after {
    content: ''
  }

  @include media-breakpoint-up(md) {
    display: none;
  }
}

.swiper-button-prev {
  left: 0;
}

.swiper-button-next {
  right: 0;
}

</style>