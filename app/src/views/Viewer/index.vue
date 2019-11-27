<template>
  <MangaViewer v-if="type === 'manga'" />
  <videoViewer v-else-if="type === 'video'" />
</template>

<script>
import MangaViewer from './Manga';
import VideoViewer from './Video';

export default {
  components: {
    MangaViewer,
    VideoViewer
  },

  data() {
    return {
      type: this.$route.params.type || 'manga'
    }
  }
}
</script>

<style lang="scss">
@import '../../assets/style/base';

.viewer-title {
  max-width: 50vw;

  @include media-breakpoint-up(md) {
    max-width: 40vw;
  }
}

.viewer-container {
  position: relative;
}

.viewer-topbar {
  transform: translateY(-100%);
  transition: transform .3s ease-in;

  &.open {
    transform: translateY(0);
  }
}
</style>