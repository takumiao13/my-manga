<template>
  <div>
    <div 
      :class="[
        'topbar viewer-topbar fixed-top', 
        { open: locking }
      ]"
    >
      <navbar :left-btns="leftBtns" :right-btns="rightBtns" />
    </div>

    <div class="viewer-container">
      <div class="viewer-viewport">
        <Loading :visible="pending" />

        <video-player
          v-if="inited"
          ref="videoPlayer"
          :options="options"
          @ready="handleReady"
          @play="handlePlay"
          @pause="handlePause"
          @active="handleActive"
          @inactive="handleInactive"
        />
      </div>
    </div>

    <ListDrawer
      :visible="chapterListVisible"
      :list="parts"
      item-key="name"
      :active-key="name"
      @change="handlePartChange"
      @close="chapterListVisible = false"
    />
  </div>
</template>

<script>
import { mapState, mapGetters, mapMutations, mapActions } from 'vuex';
import qs from '@/helpers/querystring';
import { last } from '@/helpers/utils';
import screenfull from 'screenfull';
import ListDrawer from '../components/ListDrawer';
import Loading from '../components/Loading';
import FullscreenToggle from './FullscreenToggle';

export default {
  components: {
    ListDrawer,
    Loading,
  },

  data() {
    return {
      inited: false,
      paused: true,
      chapterListVisible: false,
    }
  },
  
  computed: {
    ...mapState('app', { appError: 'error' }),

    ...mapState('viewer', [ 'name', 'source', 'cover', 'parts', 'fullscreen', 'locking' ]),

    ...mapGetters('viewer', [ 'pending' ]),

    ...mapGetters('app', [ 'repo' ]),
    
    options() {
      return this.inited ? {
        sources: [ this.$service.video.makeSrc(this.source, true) ],
        poster: this.$service.image.makeSrc({
          path: this.cover,
          escape: true
        }),
        controls: true,
        autoplay: true,
        preload: 'auto',
        fluid: true,
        //playbackRates: [0.5, 1, 1.5, 2],
        controlBar: {
          fullscreenToggle: false,
          pictureInPictureToggle: false
        }
      } : null;
    },

    leftBtns() {
      return [{
        icon: 'arrow-left',
        tip: 'Back',
        title: this.pending ? '' : this.name,
        click: this.handleBack,
        className: 'text-truncate viewer-title'
      }];
    },

    rightBtns() {
      return [
        this.parts.length > 1 ? {
          icon: 'list-alt',
          tip: 'parts',
          click: () => this.chapterListVisible = true
        } : null,
        {
          icon: 'level-up-alt',
          tip: 'Detail',
          click: () => this.handleDetail()
        }
      ]
    }
  },

  watch: {
    fullscreen(val) {
      screenfull[val ? 'request' : 'exit']();
    }
  },

  methods: {
    ...mapActions('viewer', ['fetchVideo']),

    ...mapMutations('viewer', [
      'setSettings',
      'setAutoPlaying',
      'setLocking',
      'setFullscreen'
    ]),

    // events
    handlePlay() {
      this.paused = false;
    },

    handlePause() {
      this.paused = true;
      this.setLocking(true);
    },

    handleActive() {
      this.setLocking(true);
    },

    handleInactive() {
      if (!this.paused) {
        //this.locking = false;
        this.setLocking(false);
      }
    },

    handlePartChange(item) {
      this.$router.replace({
        name: 'viewer',
        params: this.$route.params,
        query: Object.assign({}, this.$route.query, { name: item.name })
      }).then(() => this.chapterListVisible = false);
    },

    handleBack() {
      if (this.$router._routerHistory.length === 1) {
        const { dirId } = this.$router.history.current.params;
        this.$router.push({ 
          name: 'explorer', 
          params: { dirId } 
        });
      } else {
        this.$router.go(-1);
      }
    },

    handleDetail() {
      const { dirId } = this.repo;
      const { ver } = this.$router.history.current.query;
      let path  = qs.decode(this.$router.history.current.params.path);

      path = ver
        ? path.split('/').slice(0, -1).join('/')
        : path;

      const prevMangaListFullpath = `/repo/${dirId}/manga/${encodeURIComponent(path)}`
      const mayBeBack = last(this.$router._routerHistory).startsWith(prevMangaListFullpath);

      if (mayBeBack) {
        this.$router.go(-1);
      } else {
        this.$router.replace({
          name: 'explorer',
          params: { 
            dirId, 
            path: qs.encode(path)
          },
          query: {
            type: 'manga',
            ver
          }
        });
      }
    },

    handleReady(videoPlayer) {
      const controlBar = videoPlayer.getChild('ControlBar'); 
      // fullscreen button
      const fullscreenToggleButton = new FullscreenToggle(videoPlayer);
      fullscreenToggleButton.el().style.marginLeft = 'auto';
      fullscreenToggleButton.on('click', () => this.setFullscreen());

      controlBar.addChild(fullscreenToggleButton);
    }
  },

  mounted() {
    if (this.appError) return;
    
    this.$on('leave', () => {
      setTimeout(() => screenfull.exit());
    });

    this.$on('update', (route) => {
      const { dirId, path } = route.params;
      const { ver, name } = route.query;

      this.fetchVideo({ dirId, path: qs.decode(path), ver, name })
        .then(() => {
          this.inited = true;
        });
    });
  }
}
</script>

<style lang="scss">
@import '@/assets/style/base';

.viewer-viewport {
  cursor: pointer;
  position: relative;
  min-height: 100vh;

  display: flex;
  justify-content: center;
  align-items: center;

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
}

// overwrite video.js style for video
// TODO: remove !important, remaining time.
.video-js {
  position: fixed !important;
  bottom: 0 !important;
  left: 0 !important;
  height: 100% !important;
  padding-top: 0 !important;


  &.vjs-error .vjs-error-display .vjs-modal-dialog-content {
    top: 3rem;
  }

  .vjs-poster {
    top: 3rem !important;
    bottom: 3rem !important;
    height: auto !important;
  }

  .vjs-tech {
    top: 3.25rem !important;
    height: calc(100% - 6.5rem) !important;

    &:focus {
      outline: none;
    }
  }

  .vjs-time-control {
    line-height: 3rem !important;
  }

  .vjs-button {
    width: 3rem !important;
  }

  .vjs-button > .vjs-icon-placeholder:before {
    font-size: 1.5rem !important;
    line-height: 3rem !important;
  }

  .vjs-big-play-button {
    font-size: 3rem !important;
    border-width: 2px !important;
  }

  .vjs-play-progress {
    background: $primary !important;
  }

  .vjs-progress-control {
    position: fixed !important;
    display: flex;
    height: 2rem !important;
    bottom: 3rem;
    width: 100% !important;
  }

  // volume bar
  .vjs-volume-control .vjs-control .vjs-volume-horizontal {
    height: 3rem !important;
  }

  .vjs-volume-bar {
    margin: 0 !important;
    top: 50% !important;
    margin-top: -0.15em !important;
  }

  .vjs-slider-horizontal .vjs-volume-level:before {
    top: -0.4em;
    right: -0.5em;
  }

  .vjs-volume-panel {
    width: 10em !important;
  }

  .vjs-volume-panel.vjs-volume-panel-vertical {
    width: 3rem !important;
  }

  .vjs-volume-panel .vjs-volume-control {
    width: auto !important;
    height: auto !important;
    opacity: 1 !important;
  }

  .vjs-volume-bar .vjs-volume-level {
    //background: #dc143d !important;
  }

  .vjs-playback-rate .vjs-menu {
    width: 3rem !important;
    margin-bottom: 3rem !important;
  }

  .vjs-playback-rate .vjs-playback-rate-value {
    line-height: 3rem !important;
  }

  .vjs-menu-button-popup .vjs-menu .vjs-menu-content {
    bottom: 0 !important;
  }

  .vjs-control-bar {
    height: 3rem !important;
  }

  .vjs-text-track-display {
    bottom: 3rem !important;
  }

  // handle controlbar show/hide
  .vjs-has-started .vjs-control-bar {
    opacity: 1 !important;
    transition: transform .3s ease-in !important;
  }

  .vjs-has-started.vjs-user-active.vjs-playing .vjs-control-bar {
    transform: translateY(0);
  }

  .vjs-has-started.vjs-user-inactive.vjs-playing .vjs-control-bar {
    transform: translateY(100%);
  }
}
</style>