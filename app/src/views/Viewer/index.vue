<template>
  <div id="viewer" :class="{
    'viewer-left-hand': this.handMode === 'left',
    'viewer-right-hand': this.handMode === 'right'
  }">
    <div class="topbar viewer-topbar fixed-top" 
      :class="{ 
        'viewer-autoscrolling': autoScrolling,
        open: locking 
      }"
    >
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
      :mode="mode"
      :hand="handMode"
      :options="{
        gallery: images,
        chapters: chapters,
        page: page,
        chIndex: chIndex,
        settings: settings,
        zoom: zoom,
        isFullscreen: isFullscreen,
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

    <help-overlay
      v-show="helpOpen"
      :hand="handMode"
      @click.native="helpOpen = false"
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
import { mapState, mapGetters } from 'vuex';
import screenfull from 'screenfull';
import animateScrollTo from 'animate-scroll-to.js';
import { last, isDef, capitalize } from '@/helpers/utils';
import { types } from '@/store/modules/viewer';

// Components
import Viewport from './Viewport';
import Seekbar from './Seekbar';
import HelpOverlay from './HelpOverlay';

const KEY_CODE = {
  LEFT: 37,
  RIGHT: 39,
  UP: 38,
  DOWN: 40,
  A: 65,
  D: 68,
  W: 87,
  S: 83,
  F1: 112,
  F11: 122
};

const KEYBOARD_ACTION = {
  left: {
    prev: KEY_CODE.A,
    next: KEY_CODE.D,
    up: KEY_CODE.W,
    down: KEY_CODE.S,
    help: KEY_CODE.F1
  },

  right: {
    prev: KEY_CODE.LEFT,
    next: KEY_CODE.RIGHT,
    up: KEY_CODE.UP,
    down: KEY_CODE.DOWN,
    help: KEY_CODE.F1
  }
}

export default {
  components: {
    Viewport,
    Seekbar,
    HelpOverlay
  },

  data() {
    return {
      locking: true,

      isFullscreen: false,

      helpOpen: false
    }
  },
  
  computed: {
    ...mapGetters('app', [ 'repo' ]),

    ...mapGetters('viewer', [ 'count', 'chIndex', 'chCount', 'pending' ]),

    ...mapState('viewer', [ 'name', 'path', 'mode', 'zoom', 'gaps', 'handMode', 'autoScrolling', 'page', 'ch', 'images', 'chapters' ]),

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
      let title = last(this.path.split('/'));

      // addon chapter name
      if (this.ch) title = `${this.ch} / ${title}`;
      return ' ' + title;
    },

    pager() {
      return this.page + ' / ' + this.count;
    },

    leftBtns() {
      return [{
        icon: 'arrow-left',
        tip: 'Back',
        title: this.title,
        click: this.handleBack,
        className: 'text-truncate viewer-title'
      }];
    },

    rightBtns() {

      const leftHandBack = {
        icon: 'arrow-left',
        tip: 'Back',
        click: this.handleBack,
        className: 'viewer-back'
      }

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
        click: () => this.zoomToggle(item.zoom)
      }));

      const selected = menu.map(item => item.zoom).indexOf(this.zoom);

      return this.autoScrolling ? 
        [
          leftHandBack,
          {
            icon: 'pause',
            title: 'Stop scrolling',
            click: () => this.autoScrollToggle(false)
          }
        ] : 
        [
          leftHandBack,
          {
            icon: this.isFullscreen ? 'compress' : 'expand',
            tip: 'Fullscreen',
            click: () => this.fullscreenToggle()
          }, 
          {
            icon: 'page-alt',
            tip: 'Page Display',
            dropdown: {
              props: {
                menu: [{
                  html: `
                    Hand Mode : 
                    <strong class="text-primary">
                      ${capitalize(this.handMode)}
                    </strong>
                  `,
                  click: this.handModeToggle
                }, {
                  type: 'check',
                  checked: this.gaps,
                  text: 'Show Gaps Between Pages',
                  click: this.gapsToggle
                }, {
                  text: 'Auto Scrolling',
                  click: () => this.autoScrollToggle(true)
                }]
              }
            }
          }, 
          {
            icon: 'search-plus',
            tip: 'Zoom',
            dropdown: {
              props: {
                type: 'select',
                selected,
                menu
              }
            }
          }
        ];
    }
  },

  beforeRouteUpdate (to, from, next) {
    // when manga or chapter changed this function will be invoked
    // we should stop scrolling and lock viewer to show title info.
    const { dirId, path, ch } = to.params;
    this.autoScrollToggle(false);
    this.locking = true;

    // prevent locked when scroll.
    window._ignoreScrollEvent = true;

    // trigger action to update store
    // then enter the view.
    this.$store.dispatch(types.VIEW, { dirId, path, ch, page: 1 })
      .then(next);
  },

  beforeRouteLeave (to, from, next) {
    this.autoScrollToggle(false);
    setTimeout(() => screenfull.exit());
    next();
  },

  mounted() {
    if (!this.appError) {  
      const { dirId, path, ch = '' } = this.$route.params;
      const { start: page } = this.$route.query;

      this.$store.dispatch(types.VIEW, { dirId, path, ch, page });
    }
  },

  created() { this._$effects(true) },

  destroyed() { this._$effects(false) },

  methods: {
    // private
    _$effects(val) {
      window[val ? 'addEventListener' : 'removeEventListener']('keydown', this.handleKeydown);
      window[val ? 'addEventListener' : 'removeEventListener']('scroll', this.handleScroll);
    },

    // public
    go(page) {
      this.$store.dispatch(types.GO, { page });
    },

    goChapter(chIndex) {
      if (chIndex < 1 || chIndex > this.chCount) return;

      const chapter = this.chapters[chIndex-1];
      const ch = chapter.name;


      console.log(this.path, ch);
      const { dirId } = this.repo;
 
      this.$router.replace({
        name: 'viewer',
        params: { dirId, path: this.path, ch }
      });
    },
    
    prev() {
      this.go(this.page - 1);
    },

    next() {
      this.go(this.page + 1);
    },

    lockToggle(val) {
      this.locking = isDef(val) ?
        !!val :
        !this.locking;
    },

    fullscreenToggle() {
      screenfull.toggle();
      this.isFullscreen = !this.isFullscreen;
    },

    zoomToggle(zoom) {
      this.$store.dispatch(types.ZOOM, { zoom });
    },

    gapsToggle() {
      this.$store.dispatch(types.TOGGLE_GAPS);
    },

    handModeToggle() {
      this.helpOpen = true;
      this.$store.dispatch(types.TOGGLE_HAND_MODE);
    },

    autoScrollToggle(val) {
      this.locking = false;
      this.$store.dispatch(types.TOGGLE_AUTO_SCROLLING, { 
        autoScrolling: val 
      });
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
      this.helpOpen = false;
    },

    handleKeydown($event) {
      // when autoScrolling (no-pause) should disable keyboard events
      if (this.autoScrolling && !this.locking) return;
      
      $event.stopPropagation();
      const keyCode = $event.keyCode;
      const action = KEYBOARD_ACTION[this.handMode];

      switch (keyCode) {
        case action.help:
          $event.preventDefault();
          this.helpOpen = !this.helpOpen;
          break;
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
          animateScrollTo('-=50', { animate: false });
          break;
        case action.down:
          $event.preventDefault();
          animateScrollTo('+=50', { animate: false });
          break;
      }
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

// change left and right position

.viewer-back {
  display: none;
}

.viewer-left-hand {

  .viewer-back {
    display: block;
  }

  .navbar-nav-left {
    order: 2;

    .viewer-title .svg-icon {
      display: none;
    }
  }

  .navbar-nav-right {
    order: 1;
    margin-left: 0 !important;
    
    .dropdown-menu-right {
      left: 0;
      right: auto;
    }
  }
}
</style>