<template>
  <div 
    id="viewer" 
    :class="[
      `viewer-${settings.hand}-hand`,
      `viewer-${settings.mode}-mode`
    ]"
  >
    <!-- HEADER -->
    <Header 
      :title="title"
      :pager="pager"
      :locking="locking"
      :fullscreen="fullscreen"
      :settings="settings"
      :chapterlist-visible="!!chapters.length"
      @chapterlist:show="chapterListVisible = true"
      @back="handleBack"
      @fullscreen="setFullscreen"
    />

    <div 
      v-show="!locking"
      class="viewer-topbar-placeholder" 
      @mouseenter="setLocking"
    />
    <!-- /HEADER -->

    <div class="viewer-backdrop" @mousedown.stop="handleBackdropClick"></div>

    <!-- VIEWPORT -->
    <Viewport
      :locking="locking"
      :auto-scrolling="autoPlaying"
      :hand="settings.hand"
      @click="setLocking"
      @prev="prevPage"
      @next="nextPage"
    >
      <ScrollMode 
        v-if="settings.mode === $consts.VIEWER_MODE.SCROLL"
        v-bind="viewerModeProps"
        v-on="{
          pageChange: gotoPage,
          chapterChange: gotoChapter,
          autoPlayEnd: handleAutoPlayEnd
        }"
      />   
      <SwiperMode 
        v-else
        v-bind="viewerModeProps"
        v-on="{
          pageChange: gotoPage,
          chapterChange: gotoChapter,
          prev: prevPage,
          next: nextPage,
          autoPlayEnd: handleAutoPlayEnd
        }"
      />
    </Viewport>
    <!-- /VIEWPORT -->

    <div class="viewer-loading" v-show="pending">
      <Spinner class="loading-spinner" size="lg" tip="Loading" />
    </div>

    <HelpOverlay
      v-show="helpVisible"
      :hand="settings.hand"
      @click.native="helpVisible = false"
    />

    <!-- re-create settingsMenu when read mode changed -->
    <SettingsMenu
      :key="settings.mode" 
      :visible="settingsVisible" 
      :settings="settings"
      @finish="handleSettings"
    />

    <ListDrawer
      :visible="chapterListVisible"
      :list="chapters || parts"
      :active-name="ch"
      @change="handleChapterChange"
      @close="chapterListVisible = false"
    />

    <div
      class="viewer-toolbar fixed-bottom" 
      :class="{ open: locking }"
    >  
      <Seekbar :value="page" :max="count" @end="gotoPage" />
      <Controlbar
        :auto-playing="autoPlaying"
        @autoPlayChange="handleAutoPlayChange"
        @settings="handleSettingsVisible"
      /> 
    </div>

    <div 
      v-show="settings.pagerInfo && !locking" 
      class="viewer-page-indicator p-2"
    >
      {{ page }} / {{ images.length }}
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters, mapMutations, mapActions } from 'vuex';
import qs from '@/helpers/querystring';
import screenfull from 'screenfull';
import animateScrollTo from 'animate-scroll-to.js';

// Components
import Header from './Header';
import Viewport from './Viewport';
import ScrollMode from './ScrollMode';
import SwiperMode from './SwiperMode';
import Seekbar from './Seekbar';
import Controlbar from './Controlbar';
import HelpOverlay from './HelpOverlay';
import SettingsMenu from './SettingsMenu';
import ListDrawer from '../components/ListDrawer'

export default {
  components: {
    Header,
    Viewport,
    ScrollMode,
    SwiperMode,
    Seekbar,
    Controlbar,
    HelpOverlay,
    SettingsMenu,
    ListDrawer,
  },

  data() {
    return {
      helpVisible: false,
      settingsVisible: false,
      chapterListVisible: false,
      backdropVisible: false
    }
  },

  watch: {
    fullscreen(val) {
      screenfull[val ? 'request' : 'exit']();
    },

    settingsVisible(val) {
      // detect settings open or not
      this.backdropVisible = !!val;
    },

    backdropVisible(val) {
      window.document.body.classList[val ? 'add' : 'remove']('backdrop-open');
    }
  },
  
  computed: {
    ...mapState('viewer', [ 
      'name', 'path', 'page', 'ch', 'chName', 'images', 'chapters', 'parts',
      'settings', 'autoPlaying', 'fullscreen', 'locking',
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

    viewerModeProps() {
      return {
        gallery: this.images,
        page: this.page,
        chIndex: this.chIndex,
        chCount: this.chCount,
        settings: this.settings,
        fullscreen: this.fullscreen,
        autoPlaying: this.autoPlaying,
        locking: this.locking,
        appSize: this.appSize
      }
    }
  },

  methods: {
    ...mapActions('viewer', [
      'gotoPage',
      'fetchManga'
    ]),

    ...mapActions('viewer', {
      nextPage(action) {
        if (this.page === this.count) {
          this.$notify({
            group: 'viewer',
            title: 'Already the last page'
          });
        }
        action('nextPage');
      },
      prevPage(action) {
        if (this.page === 1) {
          this.$notify({
            group: 'viewer',
            title: 'Already the first page'
          });
        }
        action('prevPage');
      }
    }),

    ...mapMutations('viewer', [
      'setSettings',
      'setAutoPlaying',
      'setLocking',
      'setFullscreen'
    ]),

    // private
    _$effects(val) {
      document.body.classList[val ? 'add' : 'remove']('viewer-active');
      window[val ? 'addEventListener' : 'removeEventListener']('keydown', this.handleKeydown);
      window[val ? 'addEventListener' : 'removeEventListener']('scroll', this.handleScroll);
    },

    gotoChapter(chIndex) {
      if (chIndex < 1 || chIndex > this.chCount) return;

      const chapter = this.chapters[chIndex-1];
      const params = {
        type: 'manga',
        dirId: this.repo.dirId,
        path: qs.encode(this.path),
        ch: chapter.name
      };

      this.$router.replace({ name: 'viewer', params });
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

    handleSettings(payload) {
      this.setSettings(payload);
      this.settingsVisible = false;
    },

    handleScroll() {
      if (window._ignoreScrollEvent || this.autoPlaying) return;
      if (this.locking) this.setLocking(false);
      this.helpVisible = false;
    },

    handleAutoPlayChange() {
      if (this.autoPlaying) {
        this.setAutoPlaying(false);
        this.setLocking(true);
      } else if (this.page < this.count) {
        this.setAutoPlaying(true);
        this.setLocking(false);
      }
    },

    handleAutoPlayEnd() {
      this.setAutoPlaying(false);
      this.setLocking(true);
    },

    handleKeydown($event) {
      $event.stopPropagation();
      const keyCode = $event.keyCode;
      const action = this.$consts.KEYBOARD_ACTION[this.settings.hand];

      if (keyCode == action.lock) {
         $event.preventDefault();
      }

      // when autoPlaying (no-pause) should disable keyboard events
      if (this.autoPlaying) {
        if (keyCode === action.lock) {
          this.setLocking();
        }

        if (!this.locking) {
          return
        }  
      }
      
      switch (keyCode) {
        case action.help:
          $event.preventDefault();
          this.helpVisible = !this.helpVisible;
          break;
        case action.prev:
          $event.preventDefault();
          this.prevPage();
          break;
        case action.next:
          $event.preventDefault();
          this.nextPage();
          break;
        // TODO: scroll mode only  
        case action.up:
          if (this.settings.mode !== 'scroll') return;
          $event.preventDefault();
          animateScrollTo('-=100', { animate: false });
          break;
        case action.down:
          if (this.settings.mode !== 'scroll') return;
          $event.preventDefault();
          animateScrollTo('+=100', { animate: false });
          break;
      }
    },

    handleSettingsVisible() {
      this.settingsVisible = true;
    },

    handleBackdropClick() {
      this.settingsVisible = false;
    },

    handleChapterChange(item) {
      const route = this.$route;
      route.params.ch = item.name;
      this.$router.replace(route)
        .then(() => {
          setTimeout(() => {
            this.chapterListVisible = false
          }, 500);
        });
    }
  },

  created() { this._$effects(true) },

  destroyed() { this._$effects(false) },

  mounted() {
    if (this.appError) return;

    this.$on('leave', () => {
      // when manga or chapter changed this callback will be invoked
      // we should stop scrolling and lock viewer to show title info.
      this.setAutoPlaying(false);
      // prevent locked when scroll.
      this.setLocking(true);
      this.setFullscreen(false);
      
      window._ignoreScrollEvent = true;
    });

    this.$on('update', (route) => {
      const { dirId, path, ch = '' } = route.params;
      const page = Number(route.query.start) || 1;

      // prevent locked when scroll.
      this.setLocking(true);
      window._ignoreScrollEvent = true;

      this.fetchManga({ dirId, path: qs.decode(path), ch, page })
    });
  }
}
</script>

<style lang="scss">
@import '@/assets/style/base';

#viewer {
  user-select: none;
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

  .viewer-toolbar-container {
    max-width: 1000px;
    margin: 0 auto;
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

  .topbar {
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
}

// common backdrop
.viewer-backdrop {
  opacity: 0;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1040;
  background: $black;

  @include transition(opacity .3s);
}

.backdrop-open {
  overflow-y: hidden !important; // hide body scroll
  width: 100%;
  height: 100%;
  position: relative; // fixed will lost `scrollTop`
  
  .viewer-backdrop {
    opacity: .3;
    width: 100vw;
    height: 100vh;
  }
}
</style>