<template>
  <div 
    class="viewer-viewport"
    @mousedown="$event.preventDefault()"
  >
    <!-- TODO: may be support more mode later -->
    <scroll-mode
      v-if="mode === 'scroll'"
      v-bind="options"
      @pageChange="handlePageChange"
      @chapterChange="handleChapterChange"
    />
  </div>
</template>

<script>
import ScrollMode from './ScrollMode';

export default {
  name: 'Viewport',

  components: {
    ScrollMode
  },
  
  props: [ 'mode', 'options' ],

  methods: {
    handlePageChange(page) {
      this.$emit('pageChange', page);
    },

    handleChapterChange(chIndex) {
      this.$emit('chapterChange', chIdex);
    }
  }
}
</script>

<style lang="scss">
@import '../../assets/style/base';

.viewer-viewport {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  min-height: 100vh;
  margin: 0 auto;

  @include media-breakpoint-up(md) {
    max-width: 600px;
    .viewer-mode {
      margin-top: 3rem;
    }
  }

  @include media-breakpoint-up(lg) {
    max-width: 800px;
  }

  .viewer-mode {
    width: 100%;
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
        margin-bottom: 1rem;
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
</style>