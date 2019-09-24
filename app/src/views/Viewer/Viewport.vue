<template>
  <div class="viewer-container" :class="hand">
    <div class="viewer-viewport-left" @click.stop="handleLeft"/>
    <div class="viewer-viewport" 
      :class="{ 'viewer-locking': shouldLock() }"
    >
      <!-- TODO: may be support more mode later -->
      <scroll-mode
        v-if="mode === 'scroll'"
        v-bind="options"
        @pageChange="handlePageChange"
        @chapterChange="handleChapterChange"
      />
    </div>
    <div class="viewer-viewport-right" @click.stop="handleRight" />
  </div>
</template>

<script>
import ScrollMode from './ScrollMode';

export default {
  name: 'Viewport',

  components: {
    ScrollMode
  },
  
  props: [ 'mode', 'hand', 'options' ],

  methods: {
    shouldLock() {
      const { autoScrolling, locking } = this.options;
      return (autoScrolling && !locking) || (!autoScrolling && locking);
    },

    handleLeft($event) {
      this.$emit(this.hand === 'right' ? 'prev' : 'next');
    },

    handleRight($event) {
      this.$emit(this.hand === 'right' ? 'next' : 'prev');
    },

    handlePageChange(page) {
      this.$emit('pageChange', page);
    },

    handleChapterChange(chIndex) {
      this.$emit('chapterChange', chIndex);
    }
  }
}
</script>

<style lang="scss">
@import '../../assets/style/base';

.viewer-viewport.viewer-locking {
  &::after {
    content: '';
  }
}

.viewer-viewport {
  cursor: pointer;
  position: relative;
  min-height: 100vh;
  padding-top: 3rem;
  padding-bottom: 3rem;

  &:after {
    content: none;
    display: block;
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    z-index: 2;
  }

  .viewer-mode {
    width: 100%;
    margin: 0 auto;
    border: 1px solid transparent; // for BFC
  }

  .img-wrapper {
    max-width: 100%;
    position: relative;
    margin: 0 auto; // .25rem
    background: #3c4043;
    overflow:  hidden;

    &.gaps {
      margin: .25rem auto;

      @include media-breakpoint-up(md) {
        margin-top: .5rem;
        margin-bottom: .5rem;
      }
    }

    > .img-loading {
      color: #666;
      font-size: 6rem;
      position: absolute;
      top: 0;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      font-weight: 300;
    }

    > .img-inner img {
      position: absolute;
      width: 100%;
      max-height: 100%;
    }
  }
}

.viewer-viewport-left,
.viewer-viewport-right {
  width: 33.3%;
  opacity: .5;
  position: fixed;
  top: 3rem;
  bottom: 3rem;
  z-index: 1;
}

.viewer-viewport-left {
  left: 0;
}

.viewer-viewport-right {
  right: 0;
}

.left {
  .viewer-viewport-left {
    cursor: url('../../assets/right_arrow.cur'), auto;
  }

  .viewer-viewport-right {
    cursor: url('../../assets/left_arrow.cur'), auto;
  }
}

.right {
  .viewer-viewport-left {
    cursor: url('../../assets/left_arrow.cur'), auto;
  }

  .viewer-viewport-right {
    cursor: url('../../assets/right_arrow.cur'), auto;
  }
}

@include media-breakpoint-up(md) {
  .viewer-mode { max-width: 600px }
  .viewer-viewport-left,
  .viewer-viewport-right {
    width: calc(50% -  300px);
  }
}

@include media-breakpoint-up(lg) {
  .viewer-mode { max-width: 800px }
  .viewer-viewport-left,
  .viewer-viewport-right {
    width: calc(50% -  400px);
  }
}
</style>