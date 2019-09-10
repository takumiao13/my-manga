<template>
  <div id="viewer" @click="handleOperation">
    <navbar 
      class="viewer-topbar fixed-top"
      :class="{ in: inOperation }"
      :left-btns="leftBtns"
      @click="$event.stopPropagation()"
    />

    <viewport 
      :mode="mode"
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
      v-show="inOperation" 
      @click="handleBackdropClick" 
    />
  
    <side-toolbar
      class="d-none d-md-block"
      v-show="inOperation"
      :actions="actions" 
    />

    <div
      class="viewer-toolbar fixed-bottom" 
      :class="{ in: inOperation }"
      @click="$event.stopPropagation()"
    >
      <seekbar :value="page" :max="count" @end="go" />
    </div>

    <div 
      class="qrcode-container" 
      v-if="isQrcodeShown" 
      @click="handleQrcodeToggle"
    >
      <div class="qrcode">
        <qriously :value="getQrval()" :size="200" />
      </div>
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

export default {
  components: {
    Viewport,
    Seekbar
  },

  data() {
    return {
      routePath: '',
      inOperation: true,
      isQrcodeShown: false,
      actions: [{
        icon: 'arrow-up',
        click: this.handlePrevPage
      },{
        icon: 'arrow-down',
        click: this.handleNextPage
      }]
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
        icon: 'back',
        title: this.title,
        click: this.handleBack
      }];
    },

    title() {
      return ` <small>${this.baseTitle} - ${this.pager}</small>`
    },

    baseTitle() {
      const maxLen = 20;
      let title = last(this.path.split('/'));

      // truncate title
      if (title.length > maxLen) {
        title = title.substring(0, maxLen - 3) + '...';
      }

      // addon chapter name
      if (this.ch) title += ` - ${this.ch}`
      return title;
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
          this.inOperation = false;
        }, false);
      }, 300);
    };
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

    toggleOperation(show) {
      this.inOperation = show !== undefined ? 
        !!show : 
        !this.inOperation;
    },
    
    // events
    handleBack($event) {
      if (this.$router._routerHistory.length === 1) {
        const { dirId } = this.$router.history.current.params;
        this.$router.push({ name: 'explorer', params: { dirId } })
      } else {
        this.$router.go(-1);
      }
    },

    handleBackdropClick($event) {
      $event.stopPropagation();
      this.toggleOperation(false);
    },

    handleQrcodeToggle($event) {
      $event.stopPropagation();
      this.isQrcodeShown = !this.isQrcodeShown;
    },

    handlePrevPage($event) {
      $event.stopPropagation();
      this.go(this.page - 1);
    },

    handleNextPage($event) {
      $event.stopPropagation();
      this.go(this.page + 1);
    },

    handleOperation($event) {
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
            this.toggleOperation(true);
          } else if (x > right) {
            this.go(this.page + 1);
          }
        } else {
          this.toggleOperation(true);
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

  &.in {
    transform: translateY(0);
  }
}

.viewer-toolbar {
  transform: translateY(100%);
  transition: transform .3s ease-in;

  &.in {
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

.qrcode-container {
  position: fixed;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  overflow: auto;
  z-index: 2000;
  cursor: pointer;
  
  .qrcode {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    padding: .25rem;
    border-radius: .25rem;
  }
}
</style>