<template>
  <div class="viewer-container" :class="{ 'viewer-locking': shouldLock }">
    <div class="viewer-viewport-left" @click.stop="handleLeft" />
    <div class="viewer-viewport" @click.stop="$emit('click')">
      <slot class="viewer-mode" /> 
    </div>
    <div class="viewer-viewport-right" @click.stop="handleRight" />
  </div>
</template>

<script>
export default {
  name: 'Viewport',

  props: [ 'hand', 'autoPlaying', 'locking' ],

  computed: {
    shouldLock() {
      // TODO:
      // lock viewport disable prev and next ??
      // use css to implement ??
      return (this.autoPlaying && !this.locking) || (!this.autoPlaying && this.locking);
    }
  },

  methods: {
    handleLeft() {
      if (this.shouldLock) {
        this.$emit('click');
        return;
      }
      this.$emit(this.hand === 'right' ? 'prev' : 'next');
    },

    handleRight() {
      if (this.shouldLock) {
        this.$emit('click');
        return;
      }
      this.$emit(this.hand === 'right' ? 'next' : 'prev');
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/assets/style/base';

.viewer-locking {
  .viewer-viewport:after {
    content: '';
  }

  .viewer-viewport-left,
  .viewer-viewport-right {
    background-image: none !important;
  }
}

.viewer-container {
  position: relative;
}

.viewer-viewport {
  cursor: pointer;
  position: relative;
  min-height: 100vh;
  user-select: none
  
  // locked
  &:after {
    content: none;
    display: block;
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    z-index: 4;
  }
}

.viewer-viewport-left,
.viewer-viewport-right {
  width: 25%;
  opacity: .5;
  position: fixed;
  top: 3rem;
  bottom: 3rem;
  z-index: 3; // over viewer-viewport
  cursor: pointer;
}

.viewer-viewport-left {
  left: 0;
}

.viewer-viewport-right {
  right: 0;
}

@include media-breakpoint-up(md) {
  .viewer-mode { max-width: 600px }
  .viewer-viewport-left,
  .viewer-viewport-right {
    width: calc(50% -  300px);

    background-size: 300px 100px;
    background-repeat: no-repeat;
    background-position: center;
  }

  .viewer-viewport-left:hover {
    background-image: url('../../../assets/chevron-left.svg?url');
  }

  .viewer-viewport-right:hover {
    background-image: url('../../..//assets/chevron-right.svg?url');
  }
}

@include media-breakpoint-up(lg) {
  .viewer-mode { max-width: 800px }
  .viewer-viewport-left,
  .viewer-viewport-right {
    width: calc(50% -  400px);
  }
}

@include media-breakpoint-up(xl) {
  .viewer-mode { max-width: 1000px }
  .viewer-viewport-left,
  .viewer-viewport-right {
    width: calc(50% -  500px);
  }
}

</style>

<style lang="scss">
@import '@/assets/style/base';

.viewer-mode {
  width: 100%;
  margin: 0 auto;
  // border: 1px solid transparent; // for BFC
  display: flex;
  flex-direction: column;
  flex: 1;
}

.viewer-scroll-mode {
  .viewer-viewport {
    padding-top: 3rem;
  }

  .viewer-mode {
    min-height: calc(100vh - 3rem);
  }
}

.viewer-swipe-mode {
  .viewer-mode {
    height: calc(100vh - 3rem);
  }

  @include media-breakpoint-down(sm) {
    .viewer-viewport-left,
    .viewer-viewport-right {
      display: none;
    }
  }
}
</style>