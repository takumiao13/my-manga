<template>
  <MangaViewer ref="viewer" v-if="type === 'manga'" />
  <VideoViewer ref="viewer" v-else-if="type === 'video'" />
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
  },

  beforeRouteLeave(to, from, next) {
    this.$refs.viewer.$emit('leave');
    next();
  },

  beforeRouteUpdate(to, from, next) {
    // trigger action to update store
    // then enter the view.
    this.$refs.viewer.$emit('update', to);
    next();
  },

  mounted() {
    this.$nextTick(() => {
      this.$refs.viewer.$emit('update', this.$route);
    });
  }
}
</script>

<style lang="scss">
@import '@/assets/style/base';

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