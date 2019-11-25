<template>
  <div class="viewer-container">
    <div class="viewer-viewport-left" @click.stop="handleLeft"/>
    <div :class="['viewer-viewport', { 'viewer-locking': shouldLock() }]">
      <slot /> 
    </div>
    <div class="viewer-viewport-right" @click.stop="handleRight" />
  </div>
</template>

<script>
export default {
  name: 'Viewport',

  props: [ 'hand', 'autoScrolling', 'locking' ],

  methods: {
    shouldLock() {
      return (this.autoScrolling && !this.locking) || 
        (!this.autoScrolling && this.locking);
    },

    handleLeft() {
      this.$emit(this.hand === 'right' ? 'prev' : 'next');
    },

    handleRight() {
      this.$emit(this.hand === 'right' ? 'next' : 'prev');
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
    display: flex;
    flex-direction: column;
    min-height: calc(100vh - 6rem);
    flex: 1;
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

.viewer-left-hand {
  .viewer-viewport-left {
    cursor: url('../../assets/right_arrow.cur'), auto;
  }

  .viewer-viewport-right {
    cursor: url('../../assets/left_arrow.cur'), auto;
  }
}

.viewer-right-hand {
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