<template>
  <div 
    class="viewer-viewport"
    @mousedown="$event.preventDefault()"
  >
    <!-- @todo may be support more mode later -->
    <scroll-mode 
      :gallery="gallery"
      :chapters="chapters"
      :page="page"
      :chIndex="chIndex"
      :image-margin="settings.imageMargin"
      @pageChange="$emit('pageChange', $event)"
      @chapterChange="$emit('chapterChange', $event)" 
    />
  </div>
</template>

<script>
import ScrollMode from './ScrollMode';
import SwipeMode from './SwipeMode';

export default {
  name: 'ViewerMode',

  components: {
    ScrollMode,
    SwipeMode
  },
  
  props: {
    page: [Number, String],
    chIndex: Number,
    gallery: Array,
    chapters: Array,
    settings: Object,
    mode: {
      type: String,
      default: 'scroll'
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
    background: #2e2e2e;
    overflow: hidden;


    &.has-margin {
      margin: .25rem auto;

      @include media-breakpoint-up(md) {
        margin-top: .5rem;
        margin-bottom: 1rem;
      }
    }

    > .img-loading {
      color: #666;
      font-size: 8rem;
      position: absolute;
      top: 0;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      font-weight: 900;
    }

    > .img-inner img {
      position: absolute;
      width: 100%;
      max-height: 100%;
    }
  }
}
</style>