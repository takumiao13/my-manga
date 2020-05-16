<template>
  <div id="viewer" :class="`viewer-${settings.handMode}-hand`">
    <!-- HEADER -->
    <Header 
      :title="title"
      :pager="pager"
      :auto-scrolling="autoScrolling"
      :locking="locking"
      :fullscreen="fullscreen"
      :settings="settings"
      @back="handleBack"
      @fullscreen="setFullscreen"
      @settings="handleSettings"
    />

    <!-- VIEWPORT -->
    <Viewport
      :hand="settings.handMode"
      :locking="locking"
      :auto-scrolling="setScroll"
      @click="setLock"
      @prev="prev"
      @next="next"
    >
      <!-- TODO: may be support more mode later -->
      <ScrollMode
        :gallery="images"
        :chapters="chapters"
        :page="page"
        :chIndex="chIndex"
        :settings="settings"
        :fullscreen="fullscreen"
        :auto-scrolling="autoScrolling"
        :locking="locking"
        :speed="speed"
        @pageChange="go"
        @chapterChange="goChapter"
        @scrollEnd="setScroll(false)"
      />
    </Viewport>
    <!-- /VIEWPORT -->

    <div class="viewer-loading" v-show="pending">
      <Spinner class="loading-spinner" size="lg" tip="Loading" />
    </div>

    <HelpOverlay
      v-show="helpOpen"
      :hand="settings.handMode"
      @click.native="helpOpen = false"
    />

    <div
      class="viewer-toolbar fixed-bottom" 
      :class="{ open: locking }"
    >
      <Seekbar :value="page" :max="count" @end="go" />
      <Controlbar
        :speed="speed"
        @auto-scroll="setScroll"
        @speed="setSpeed"
      />
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
import { mapState, mapGetters, mapMutations, mapActions } from 'vuex';
import qs from '@/helpers/querystring';
import screenfull from 'screenfull';
import animateScrollTo from 'animate-scroll-to.js';
import { types } from '@/store/modules/viewer';

// Components
import Header from './Header';
import Viewport from './Viewport';
import ScrollMode from './ScrollMode';
import Seekbar from './Seekbar';
import Controlbar from './Controlbar';
import HelpOverlay from './HelpOverlay';

export default {
  components: {
    Header,
    Viewport,
    ScrollMode,
    Seekbar,
    Controlbar,
    HelpOverlay
  },

  data() {
    return {
      helpOpen: false
    }
  },

  watch: {
    fullscreen(val) {
      screenfull[val ? 'request' : 'exit']();
    }
  },
  
  computed: {
    ...mapState('viewer', [ 
      'name', 'path', 'page', 'ch', 'chName', 'images', 'chapters',
      'settings', 'autoScrolling', 'fullscreen', 'locking', 'speed'
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
    }
  },

  mounted() {
    if (this.appError) return

    this.$on('leave', () => {
      // when manga or chapter changed this function will be invoked
      // we should stop scrolling and lock viewer to show title info.
      this.setScroll(false);
      this.setFullscreen(false);
      
     // prevent locked when scroll.
      this.setLock(true);
      window._ignoreScrollEvent = true;
    });

    this.$on('update', (route) => {
      const { dirId, path, ch = '' } = route.params;
      const page = route.query.start || 1;

      // prevent locked when scroll.
      this.setLock(true);
      window._ignoreScrollEvent = true;

      this.$store.dispatch(types.VIEW, { dirId, path: qs.decode(path), ch, page });
    });
  },

  created() { this._$effects(true) },

  destroyed() { this._$effects(false) },

  methods: {
    ...mapActions('viewer', [
      'setScroll'
    ]),

    ...mapMutations('viewer', [
      'setSettings',
      'setSpeed',
      'setLock',
      'setFullscreen'
    ]),

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
        path: qs.encode(this.path),
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
      if (payload.handMode) this.helpOpen = true;
    },

    handleScroll() {
      if (window._ignoreScrollEvent || this.autoScrolling) return;
      this.setLock(false);
      this.helpOpen = false;
    },

    handleKeydown($event) {
      $event.stopPropagation();
      const keyCode = $event.keyCode;
      const action = this.$consts.KEYBOARD_ACTION[this.settings.handMode];

      if (keyCode == action.lock) {
         $event.preventDefault();
      }

      // when autoScrolling (no-pause) should disable keyboard events
      if (this.autoScrolling) {
        if (keyCode === action.lock) {
          this.setLock();
        }

        if (!this.locking) {
          return
        }  
      }
      
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
          animateScrollTo('-=100', { animate: false });
          break;
        case action.down:
          $event.preventDefault();
          animateScrollTo('+=100', { animate: false });
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