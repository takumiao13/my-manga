<template>
  <div id="viewer" @click="handleOpenMenu">
    <navbar 
      class="viewer-topbar fixed-top"
      :class="{ open: menuOpen }"
      :title="{ content: pager, className: 'text-center d-none d-md-block' }"
      :left-btns="leftBtns"
      :right-btns="rightBtns"
      @click="$event.stopPropagation()"
    />

    <viewport 
      :mode="mode"
      :zoom="zoom"
      :gallery="images"
      :chapters="chapters"
      :page="page"
      :chIndex="chIndex"
      :settings="settings"
      @pageChange="go"
      @chapterChange="goCh" 
    />

    <div
      class="viewer-loading"
      v-show="pending"
    >
      <spinner class="loading-spinner" size="lg" />
    </div>

    <div
      class="viewer-backdrop" 
      v-show="menuOpen" 
      @click="handleBackdropClick" 
    />
  
    <!-- <side-toolbar
      class="d-none d-md-block"
      v-show="menuOpen"
      :actions="actions" 
    /> -->

    <div
      class="viewer-toolbar fixed-bottom" 
      :class="{ open: menuOpen }"
      @click="$event.stopPropagation()"
    >
      <seekbar :value="page" :max="count" @end="go" />
    </div>
  </div>
</template>

<script>
import config from '@/config';
import { last, inElectron } from '@/helpers';
import { mapState, mapGetters } from 'vuex';
import { types } from '@/store/modules/viewer';
import Viewport from './Viewport';
import Seekbar from './Seekbar';
import screenfull from 'screenfull';

export default {
  components: {
    Viewport,
    Seekbar
  },

  data() {
    return {
      routePath: '',
      menuOpen: true,
      isFullscreen: false,
      zoom: 'width'
    }
  },
  
  computed: {
    ...mapGetters('app', [ 'repo' ]),

    ...mapGetters('viewer', [ 'count', 'chIndex', 'chCount', 'pending' ]),

    ...mapState('viewer', [ 'path', 'mode', 'page', 'ch', 'images', 'chapters' ]),

    ...mapState('app', { appError: 'error' }),

    ...mapState('settings', {
      settings(state) {
        state = state[this.repo.dirId]; // find nested state
        if (!state) return {}
        const obj = state.data.viewer || {};
        let margin = true;

        // match image margin path
        if (obj.imageMargin) {

          
          margin = obj.imageMargin['*'] || margin;
          let rest;

          Object.keys(obj.imageMargin).forEach(p => {
            if (this.path.indexOf(p) === 0) {
              let r = this.path.slice(p).length;
              if (!rest || r < rest) {
                rest = r;
                margin = obj.imageMargin[p];
              }
            }
          });
        }

        return {
          imageMargin: margin
        }
      }
    }),

    leftBtns() {
      return [{
        icon: 'arrow-left',
        title: this.backTitle,
        click: this.handleBack
      }];
    },

    rightBtns() {
      const self = this;
      return [{
        icon: this.isFullscreen ? 'compress' : 'expand',
        tip: 'Fullscreen',
        click: this.handleToggleFullscreen
      },{
        icon: 'search-plus',
        tip: 'Zoom',
        dropdown: {
          items: [{
            text: 'Fit to width',
            click() { self.handleZoom('width') }
          }, {
            text: 'Fit to screen',
            click() { self.handleZoom('screen') }
          },{
            text: 'Real width',
            click() { self.handleZoom('real') }
          }]
        }
      }]
    },

    backTitle() {
      const maxLen = 20;
      let title = last(this.path.split('/'));

      // truncate title
      if (title.length > maxLen) {
        title = title.substring(0, maxLen - 3) + '...';
      }

      // addon chapter name
      if (this.ch) title += ` - ${this.ch}`
      return ' ' + title;
    },

    pager() {
      return this.page + ' / ' + this.count;
    }
  },

  mounted() {
    if (!this.appError) {  
      const { path, ch } = this.$route.params;
      const { dirId } = this.repo;
      this.$store.dispatch(types.VIEW, { dirId, path, ch });
      
      setTimeout(_ => { 
        window.addEventListener('scroll', (e) => {
          this.menuOpen = false;
        }, false);
      }, 300);
    };
  },

  created() {
    setTimeout(() => {
      window.addEventListener('scroll', this.handleScroll);
    }, 300);
    
    window.addEventListener('keydown', this.handleKeydown);
  },

  destroyed() {
    window.removeEventListener('scroll', this.handleScroll);
    window.removeEventListener('keydown', this.handleKeydown);
  },

  

  methods: {
    getQrval() {
      const { hash, href } = window.location;
      if (inElectron) {
        const { host, port } = config;
        // when share the qrcode we need the real ip
        if (process.env.NODE_ENV === 'development') {
          return href.replace('localhost', host); // replace real ip
        } else {
          return `http://${host}:${port}/${hash}`
        }
      } else {
        return href;
      }
    },

    go(page) {
      this.$store.dispatch(types.GO, { page });
    },

    goCh(chIndex) {
      const { dirId } = this.repo;
      this.$store.dispatch(types.GO_CH, { dirId, chIndex });
    },

    toggleMenu(show) {
      this.menuOpen = show !== undefined ? 
        !!show : 
        !this.menuOpen;
    },
    
    // events
    handleBack() {
      if (this.$router._routerHistory.length === 1) {
        const { dirId } = this.$router.history.current.params;
        this.$router.push({ name: 'explorer', params: { dirId } })
      } else {
        this.$router.go(-1);
      }
    },

    handleBackdropClick($event) {
      $event.stopPropagation();
      this.toggleMenu(false);
    },

    handleKeydown($event) {
      const { keyCode } = $event;
      $event.stopPropagation();
      
      if (keyCode === 37 ) {
        this.go(this.page - 1);
      } else if (keyCode === 39) {
        console.log(this.page + 1);
        this.go(this.page + 1);
      }
    },

    handleToggleFullscreen() {
      screenfull.toggle();
      this.isFullscreen = !this.isFullscreen;
    },

    handleZoom(zoom) {
      this.zoom = zoom;
    },

    handleScroll() {
      this.inOperation = false;
    },

    handleOpenMenu() {
      // only for mobile
      if (this.mode === 'scroll') {

        if ('ontouchstart' in window) {
          const width = window.innerWidth;
          const x = $event.pageX;
          const wHalf = width / 2;
          const left = wHalf - 120;
          const right = wHalf + 120;

          if (x > 0 && x < left) {
            this.go(this.page - 1);
          } else if (x >= left && x <= right) {
            this.toggleMenu(true);
          } else if (x > right) {
            this.go(this.page + 1);
          }
        } else {
          this.toggleMenu(true);
        }
      }
    }
  }
}
</script>

<style lang="scss">
@import '../../assets/style/base';
#viewer {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  min-height: 100vh;
}

.viewer-topbar {
  transform: translateY(-100%);
  transition: transform .3s ease-in;

  &.open {
    transform: translateY(0);
  }

  @include media-breakpoint-up(md) {
    padding-left: 1rem !important;
    padding-right: 1rem !important;
  }
}

.viewer-toolbar {
  transform: translateY(100%);
  transition: transform .3s ease-in;

  &.open {
    transform: translateY(0);
  }
}

.viewer-backdrop {
  position: fixed;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  overflow: auto;
}

.viewer-loading {
  position: fixed;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  background: $black;
  z-index: 1040;

  .loading-spinner {
    color: $white;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
}
</style>