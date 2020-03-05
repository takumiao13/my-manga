<template>
  <div id="viewer" :class="`viewer-${settings.handMode}-hand`">
    <!-- TOPBAR -->
    <div
      :class="[
        'topbar viewer-topbar fixed-top',
        { 'viewer-autoscrolling': autoScrolling, open: locking }
      ]"
    >
      <navbar
        :title="{ 
          content: pager, 
          className: 'text-center d-none d-md-block'
        }"
        :left-btns="leftBtns"
        :right-btns="rightBtns"
      />
    </div>
    <div 
      v-show="!locking"
      class="viewer-topbar-placeholder" 
      @mouseenter="locking = true"
    />
    <!-- /TOPBAR -->

    <!-- VIEWPORT -->
    <viewport
      :hand="settings.handMode"
      :locking="locking"
      :autoScrolling="autoScrollToggle"
      @click="lockToggle()"
      @prev="prev"
      @next="next"
    >
      <!-- TODO: may be support more mode later -->
      <scroll-mode
        :gallery="images"
        :chapters="chapters"
        :page="page"
        :chIndex="chIndex"
        :settings="settings"
        :isFullscreen="isFullscreen"
        :autoScrolling="autoScrolling"
        :locking="locking"
        @pageChange="go"
        @chapterChange="goChapter"
      />
    </viewport>
    <!-- /VIEWPORT -->

    <div class="viewer-loading" v-show="pending">
      <spinner class="loading-spinner" size="lg" tip="Loading" />
    </div>

    <help-overlay
      v-show="helpOpen"
      :hand="settings.handMode"
      @click.native="helpOpen = false"
    />

    <div
      class="viewer-toolbar fixed-bottom" 
      :class="{ open: locking }"
    >
      <seekbar :value="page" :max="count" @end="go" />
    </div>

    <div 
      v-show="settings.pagerInfo" 
      class="viewer-page-indicator py-1 px-2 d-md-none"
    >
      {{ page }} / {{ images.length }}
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import screenfull from 'screenfull';
import animateScrollTo from 'animate-scroll-to.js';
import { isDef, capitalize } from '@/helpers/utils';
import { types } from '@/store/modules/viewer';

// Components
import Viewport from './Viewport';
import ScrollMode from './ScrollMode';
import Seekbar from './Seekbar';
import HelpOverlay from './HelpOverlay';

export default {
  components: {
    Viewport,
    ScrollMode,
    Seekbar,
    HelpOverlay
  },

  props: {
    fullscreen: Boolean
  },

  data() {
    return {
      locking: true,
      isFullscreen: this.fullscreen,
      helpOpen: false
    }
  },

  watch: {
    // when prop change
    fullscreen() {
      this.isFullscreen = this.fullscreen;
    },

    isFullscreen() {}
  },
  
  computed: {
    
    ...mapState('viewer', [ 
      'name', 'path', 'mode', 'settings', 'autoScrolling', 
      'page', 'ch', 'chName', 'images', 'chapters' 
    ]),

    ...mapState('app', { appError: 'error', appSize: 'size' }),

    ...mapGetters('app', [ 'repo' ]),

    ...mapGetters('viewer', [ 'count', 'chIndex', 'chCount', 'pending', 'settings' ]),

    title() {
      if (this.appSize === 'sm') {
        return this.ch ? this.chName : '';
      } else {
        let title = this.name;

        // addon chapter name
        // TODO: use chName ....
        if (this.ch) title = `${this.chName} / ${title}`;
        return ' ' + title;
      }
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

      const selected = menu.map(item => item.zoom).indexOf(this.settings.zoom);

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
                      ${capitalize(this.settings.handMode)}
                    </strong>
                  `,
                  click: this.handModeToggle
                }, {
                  type: 'check',
                  checked: this.settings.gaps,
                  text: 'Show Gaps Between Pages',
                  click: this.gapsToggle
                }, {
                  type: 'check',
                  checked: this.settings.pagerInfo,
                  text: 'Show Pager Info',
                  click: this.pagerInfoToggle
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

  mounted() {
    if (this.appError) return

    this.$on('leave', () => {
      // when manga or chapter changed this function will be invoked
      // we should stop scrolling and lock viewer to show title info.
      this.autoScrollToggle(false);
      
     // prevent locked when scroll.
      this.locking = true;
      window._ignoreScrollEvent = true;

      setTimeout(() => screenfull.exit());
    });

    this.$on('update', (route) => {
      const { dirId, path, ch = '' } = route.params;
      const page = route.query.start || 1;

      // prevent locked when scroll.
      this.locking = true;
      window._ignoreScrollEvent = true;

      this.$store.dispatch(types.VIEW, { dirId, path, ch, page });
    });
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

      const params = {
        type: 'manga',
        dirId: this.repo.dirId,
        path: this.path,
        ch: chapter.name
      };

      this.$router.replace({ name: 'viewer', params });
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

    zoomToggle(zoom) {
      this.$store.commit(types.SETTINGS, { zoom });
    },

    gapsToggle() {
      this.$store.commit(types.SETTINGS, { gaps: !this.settings.gaps })
    },

    pagerInfoToggle() {
      this.$store.commit(types.SETTINGS, { pagerInfo: !this.settings.pagerInfo })
    },

    handModeToggle() { 
      const handMode = { left: 'right', right: 'left' }[this.settings.handMode];
      this.$store.commit(types.SETTINGS, { handMode });
      this.helpOpen = true;
    },

    fullscreenToggle() {
      screenfull.toggle();
      this.isFullscreen = !this.isFullscreen;
    },

    autoScrollToggle(val) {
      this.locking = false;
      
      this.$store.commit(types.TOGGLE_AUTO_SCROLLING, { 
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
      const action = this.$consts.KEYBOARD_ACTION[this.settings.handMode];

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
@import '../../../assets/style/base';

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