<template>
  <div 
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
      :settings="settings"
      :chapterlist-visible="!!chapters.length"
      @chapterlist:show="chapterListVisible = true"
      @back="handleBack"
      @detail="handleDetail"
    />

    <div 
      v-show="!locking"
      class="viewer-topbar-placeholder" 
      @mouseenter="setLocking"
    />
    <!-- /HEADER -->

    <!-- VIEWPORT -->
    <Viewport
      :locking="locking"
      :auto-scrolling="autoPlaying"
      :hand="settings.hand"
      @click="setLocking"
      @prev="prevPage"
      @next="nextPage"
    >
      <Loading :visible="pending" />

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
      @close="settingsVisible = false"
    />

    <ListDrawer
      :visible="chapterListVisible"
      :list="chapters"
      item-key="name"
      :active-key="ch"
      @change="handleChapterChange"
      @close="chapterListVisible = false"
    />

    <div
      class="viewer-toolbar fixed-bottom" 
      :class="{ open: locking }"
    >  
      <Seekbar :value="page" :max="count" @end="gotoPage" />
      <Controlbar
        :fullscreen="fullscreen"
        :auto-playing="autoPlaying"
        @auto-play-change="handleAutoPlayChange"
        @settings="handleSettingsVisible"
        @fullscreen="setFullscreen"
      /> 
    </div>

    <div 
      v-show="settings.pagerInfo && !locking" 
      class="viewer-page-indicator"
    >
      {{ page }} / {{ images.length }}
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters, mapMutations, mapActions } from 'vuex';
import qs from '@/helpers/querystring';
import { last } from '@/helpers/utils';
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
import Loading from '../components/Loading';

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
    Loading,
  },

  data() {
    return {
      helpVisible: false,
      settingsVisible: false,
      chapterListVisible: false
    }
  },

  watch: {
    fullscreen(val) {
      screenfull[val ? 'request' : 'exit']();
    }
  },
  
  computed: {
    ...mapState('app', { appError: 'error', appSize: 'size' }),

    ...mapState('viewer', [ 
      'name', 'path', 'page', 'ch', 'chName', 'images', 'chapters', 'parts',
      'autoPlaying', 'fullscreen', 'locking',
    ]),

    ...mapGetters('app', [ 'repo' ]),

    ...mapGetters('viewer', [ 'count', 'chIndex', 'chCount', 'pending', 'success', 'settings' ]),

    title() {
      if (this.pending) return '';

      const title = this.ch 
        ? this.chName
        : this.$options.filters.stripVer(this.name);
      
      return ' ' + title;
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

    handleDetail() {
      const { dirId } = this.repo;
      const { ver } = this.$router.history.current.query;
      const path = ver
        ? this.path.split('/').slice(0, -1).join('/')
        : this.path;

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

    handleChapterChange(item) {
      const route = this.$route;
      route.params.ch = item.name;
      this.chapterListVisible = false;
      setTimeout(() => this.$router.replace(route), 300);
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

// pager info
.viewer-page-indicator {
  position: fixed;
  right: 0;
  bottom: 0;
}

.viewer-scroll-mode {
  .viewer-page-indicator {
    padding: .25rem .5rem;
  }
}

.viewer-swipe-mode {
  .viewer-page-indicator {
    text-align: center;
    left: 0;
    height: 3rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }
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
</style>