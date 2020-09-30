<template>
  <div id="viewer">
    <VersionSelect 
      v-if="type === 'mix'" 
      :versions="versions" 
      @change="handleVersionChange"
    />
    <VideoPlayer ref="viewer" v-else-if="type === 'video'" />
    <MangaViewer ref="viewer" v-else />
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import qs from '@/helpers/querystring';
import mangaAPI from '@/apis/manga';

// components
import MangaViewer from './MangaViewer';
import VideoPlayer from './VideoPlayer';
import VersionSelect from './components/VersionSelect';

export default {
  components: {
    MangaViewer,
    VideoPlayer,
    VersionSelect
  },

  data() {
    return {
      type: this.$route.params.type,
      versions: null
    }
  },

  computed: {
    ...mapGetters('app', [ 'repo' ]),
  },

  methods: {
    fetchVersions(route) {
      const { dirId, path } = route.params;
      mangaAPI.list({ dirId, path: qs.decode(path) })
        .then(res => this.versions = res.children)
    },

    handleVersionChange(version) {
      const { dirId } = this.repo;
      const { path, fileType = 'manga', name, ver } = version;

      if (fileType === 'pdf') {
        const href = this.$service.pdf.makeSrc(path);
        href && window.open(href, 'target', '');
        return;
      }

      this.$router.replace({
        name: 'viewer',
        params: {
          type: fileType, 
          dirId, 
          path: qs.encode(path)
        },
        query: { ver, name }
      });
    }
  },

  beforeRouteLeave(to, from, next) {
    this.$refs.viewer && this.$refs.viewer.$emit('leave');
    next();
  },

  beforeRouteUpdate(to, from, next) {
    // trigger action to update store
    // then enter the view.
    this.type = to.params.type;
    if (this.type === 'mix') {
      this.fetchVersions(to);
    } else {
      this.$nextTick(() => {
        this.$refs.viewer && this.$refs.viewer.$emit('update', to);
      });
    }
    
    next();
  },

  mounted() {
    if (this.type === 'mix') {
      this.fetchVersions(this.$route);
    } else {
      this.$nextTick(() => {
        this.$refs.viewer.$emit('update', this.$route);
      });
    }
  }
}
</script>

<style lang="scss">
@import '@/assets/style/base';

.viewer-title {
  max-width: calc(100vw - 90px);

  @include media-breakpoint-up(md) {
    max-width: 50vw;
  }
}

.viewer-container {
  position: relative;
}

.viewer-topbar {
  z-index: 1050;
  transform: translateY(-100%);
  transition: transform .3s ease-in;

  &.open {
    transform: translateY(0);
  }
}
</style>