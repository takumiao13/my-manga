<template>
  <div id="viewer">
    <div class="topbar fixed-top" :class="{ open: locking }">
      <navbar
        :title="{ content: pager, className: 'text-center d-none d-md-block' }"
        :left-btns="leftBtns"
        :right-btns="rightBtns"
      />
    </div>
    <div 
      v-show="!locking"
      class="viewer-topbar-placeholder" 
      @mouseenter="locking = true"
    />

    <viewport
      :class="{ 'viewer-locking': locking }"
      :mode="mode"
      :hand="handMode"
      :options="{
        gallery: images,
        chapters: chapters,
        page: page,
        chIndex: chIndex,
        settings: settings,
        zoom: zoom,
        autoScrolling: autoScrolling,
        locking: locking
      }"
      @click.native="lockToggle()"
      @prev="prev"
      @next="next"
      @pageChange="go"
      @chapterChange="goChapter" 
    />

    <div class="viewer-loading" v-show="pending">
      <spinner class="loading-spinner" size="lg" tip="Loading" />
    </div>

    <hand-mode
      v-show="handModeOpen"
      :hand="handMode"
      @click.native="handModeOpen = false"
    />

    <div
      class="viewer-toolbar fixed-bottom" 
      :class="{ open: locking }"
    >
      <seekbar :value="page" :max="count" @end="go" />
    </div>

    <div class="viewer-page-indicator py-1 px-2 d-md-none">
      {{ page }} / {{ images.length }}
    </div>
  </div>
</template>

<script>
import { last, isDef } from '@/helpers';
import { mapState, mapGetters } from 'vuex';
import { types } from '@/store/modules/viewer';
import screenfull from 'screenfull';
import animatescroll from 'animatescroll';

// Components
import Viewport from './Viewport';
import Seekbar from './Seekbar';
import HandMode from './HandMode';

const KEY_CODE = {
  LEFT: 37,
  RIGHT: 39,
  UP: 38,
  DOWN: 40,
  A: 65,
  D: 68,
  W: 87,
  S: 83,
  F11: 122
};

const HAND_ACTION = {
  left: {
    prev: KEY_CODE.A,
    next: KEY_CODE.D,
    up: KEY_CODE.W,
    down: KEY_CODE.S
  },

  right: {
    prev: KEY_CODE.LEFT,
    next: KEY_CODE.RIGHT,
    up: KEY_CODE.UP,
    down: KEY_CODE.DOWN
  }
}

export default {
  components: {
    Viewport,
    Seekbar,
    HandMode
  },

  data() {
    return {
      locking: true,
      isFullscreen: false,
      handMode: 'right',
      handModeOpen: false
    }
  },
  
  computed: {
    ...mapGetters('app', [ 'repo' ]),

    ...mapGetters('viewer', [ 'count', 'chIndex', 'chCount', 'pending' ]),

    ...mapState('viewer', [ 'path', 'mode', 'zoom', 'gaps', 'autoScrolling', 'page', 'ch', 'images', 'chapters' ]),

    ...mapState('app', { appError: 'error' }),

    ...mapState('settings', {
      settings(state) {
        state = state[this.repo.dirId]; // find nested state
        if (!state) return {}
        const obj = state.data.viewer || {};
        let gaps = this.gaps; // user viewer gaps as default

        // match image margin path
        if (obj.imageMargin) {
          let rest;
          gaps = obj.imageMargin['*'] || gaps;

          Object.keys(obj.imageMargin).forEach(p => {
            if (this.path.indexOf(p) === 0) {
              let r = this.path.slice(p).length;
              if (!rest || r < rest) {
                rest = r;
                gaps = obj.imageMargin[p];
              }
            }
          });
        }

        return { gaps }
      }
    }),

    title() {
      const maxLen = 20;
      let title = last(this.path.split('/'));

      // // truncate title
      // if (title.length > maxLen) {
      //   title = title.substring(0, maxLen - 3) + '...';
      // }

      // addon chapter name
      if (this.ch) title += ` - ${this.ch}`
      return ' ' + title;
    },

    pager() {
      return this.page + ' / ' + this.count;
    },

    leftBtns() {
      return [{
        icon: 'arrow-left',
        title: this.title,
        click: this.handleBack,
        className: 'text-truncate viewer-title'
      }];
    },

    rightBtns() {
      const menu = [{
        zoom: 'width',
        text: 'Fit to width'
      }, {
        zoom: 'screen',
        text: 'Fit to screen'
      }, {
        zoom: 100,
        text: '100%'
      }].map(item => ({
        ...item,
        click: () => this.handleZoom(item.zoom)
      }));

      const selected = menu.map(item => item.zoom).indexOf(this.zoom);

      return [{
        icon: this.isFullscreen ? 'compress' : 'expand',
        tip: 'Fullscreen',
        click: this.handleToggleFullscreen
      }, {
        icon: 'page-alt',
        tip: 'Page Display',
        dropdown: {
          props: {
            type: 'select',
            menu: [{
              text: 'Hand Mode: ' + this.handMode.toUpperCase(),
              click: this.handleToggleHandMode
            }, {
              type: 'check',
              checked: this.gaps,
              text: 'Show Gaps Between Pages',
              click: this.handleToggleGaps
            }, {
              type: 'check',
              checked: this.autoScrolling,
              text: 'Auto Scrolling',
              click: this.handleAutoScrolling
            }]
          }
        }
      }, {
        icon: 'search-plus',
        tip: 'Zoom',
        dropdown: {
          props: {
            type: 'select',
            selected,
            menu
          }
        }
      }]
    }
  },

  mounted() {
    if (!this.appError) {  
      const { path, ch } = this.$route.params;
      const { dirId } = this.repo;
      
      this.$store.dispatch(types.VIEW, { dirId, path, ch });
      window.addEventListener('keydown', this.handleKeydown);
      window.addEventListener('scroll', this.handleScroll);
    }
  },

  destroyed() {
    window.removeEventListener('keydown', this.handleKeydown);
    window.removeEventListener('scroll', this.handleScroll);
  },

  methods: {
    go(page) {
      this.$store.dispatch(types.GO, { page });
    },

    goChapter(chIndex) {
      const { dirId } = this.repo;
      this.$store.dispatch(types.GO_CH, { dirId, chIndex });
    },
    
    prev() {
      console.log('prev');
      this.go(this.page - 1);
    },

    next() {
      console.log('next');
      this.go(this.page + 1);
    },

    lockToggle(val) {
      this.locking = isDef(val) ?
        !!val :
        !this.locking;
    },

    // events
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

    handleScroll() {
      if (window._ignoreScrollEvent || this.autoScrolling) return;
      this.locking = false;
    },

    handleKeydown($event) {
      $event.stopPropagation();
      const keyCode = $event.keyCode;  
      const action = HAND_ACTION[this.handMode];

      switch (keyCode) {
        case action.prev:
          $event.preventDefault();
          this.prev();
          break;
        case action.next:
          $event.preventDefault();
          this.next();
          break;  
        case action.up:
          $event.preventDefault();
          animatescroll.by({
            y: -50,
            animate: false
          });
          break;
        case action.down:
          $event.preventDefault();
          animatescroll.by({
            y: +50,
            animate: false
          });
          break;
      }
    },

    // toolbar events
    handleToggleFullscreen() {
      screenfull.toggle();
      this.isFullscreen = !this.isFullscreen;
    },

    handleZoom(zoom) {
      this.$store.dispatch(types.ZOOM, { zoom });
    },

    handleToggleGaps() {
      this.$store.dispatch(types.TOGGLE_GAPS);
    },

    handleToggleHandMode() {
      this.locking = false;
      this.handModeOpen = true;
      if (this.handMode === 'left') {
        this.handMode = 'right';
      } else {
        this.handMode = 'left';
      } 
    },

    handleAutoScrolling() {
      this.locking = false;
      this.$store.dispatch(types.TOGGLE_AUTO_SCROLLING);
    },

    // handleOperation($event) {
    //   if (this.locking) {
    //     this.locking = false;
    //     return;
    //   }

    //   if (this.mode === 'scroll') {
    //     // only for mobile
    //     const x = $event.pageX;
        
    //     // |-- left --|-- middle --|-- right --|
    //     const width = window.innerWidth;
    //     const justifyWidth = width / 3;
        
    //     const left = justifyWidth;
    //     const right = justifyWidth * 2;

    //     if (x > 0 && x < left) {
    //       this.go(this.page - 1);
    //     } else if (x >= left && x <= right) {
    //       this.locking = true;
    //     } else if (x > right) {
    //       this.go(this.page + 1);
    //     }
    //   }
    // }
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

#viewer > .topbar {
  transform: translateY(-100%);
  transition: transform .3s ease-in;

  &.open {
    transform: translateY(0);
  }
}

.viewer-topbar-placeholder {
  height: 3rem;
  position: fixed;
  left: 0;
  right: 0;
  z-index: 1040;
  top: 0;
}

.viewer-toolbar {
  transform: translateY(100%);
  transition: transform .3s ease-in;

  &.open {
    transform: translateY(0);
  }
}

.viewer-loading {
  position: fixed;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 1040;

  .loading-spinner {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
}

.viewer-page-indicator {
  position: fixed;
  right: 0;
  bottom: 0;
}
</style>