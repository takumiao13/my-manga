<template>
  <div
    id="workbench.main.manga"
    class="manga-content" 
    :class="{ 
      'addressbar-collapsed': !showAddress || !needAddress
    }"
  >
    <Header
      :title="topbarTitle"
      :view-type="viewType"
      :navs="navs"
      :need-address="needAddress"
      @refresh="handleRefresh"
    />
    
    <DataView
      class="manga-body"
      :class="{ 'has-addressbar' : needAddress }"
      :loading="pending"
      :error="error"
      :spinner="{ size: 'md' }"
    >

      <template v-slot:spinner-tip>
        <p class="manga-loading-tip">Loading</p>
      </template>

      <!-- METADATA -->
      <Metadata
        v-if="isManga"
        v-show="success"
        ref="metadata"
        :ver-loading="loadingVersion"
        :title="title"
        :sharing="sharing"
        @item-click="handleItemClick"
      />

      <div class="manga-empty-container" v-show="success && empty">
        <Empty full />
      </div>

      <div class="manga-area row" v-show="success && !sharing && !empty">
        <div class="manga-version-loading" v-show="loadingVersion">
          <Spinner center>
            <p class="text-center">Loading</p>
          </Spinner>
        </div>
        <div class="area-container mt-3 col-12" v-show="!loadingVersion">

          <!-- LATEST -->
          <LatestGroup 
            v-if="!path && !isSearch && latest.length"
            :list="latest"
            :active-path="activePath"
            :app-size="appSize"
            @more="handleItemClick"
            @item-click="handleItemClick"
          />

          <!-- FILE -->
          <FileGroup
            :view-mode="viewMode.file"
            :list="files"
            :active-path="activePath"
            @view-mode-change="(mode) => viewMode.file = mode"
            @item-click="handleItemClick"
          />

          <!-- MANGA -->
          <MangaGroup
            :show-path="isSearch"
            :view-mode="viewMode.manga"
            :list="mangas"
            :active-path="activePath"
            @view-mode-change="(mode) => viewMode.manga = mode"
            @item-click="handleItemClick"
          />

          <!-- CHAPTER -->
          <ChapterGroup
            :list="chapters"
            :active-name="activeChapter"
            :metadata="metadata"
            @item-click="handleItemClick"
          />

          <!-- CHAPTER SP -->
          <ChapterGroup sp
            :list="chaptersSp"
            :active-name="activeChapter"
            :metadata="metadata"
            @item-click="handleItemClick"
          />

          <!-- GALLERY -->
          <GalleryGroup
            :view-mode="viewMode.gallery"
            :list="images"
            :active-page="activePage"
            :hide-first-image="type === 'MANGA'"
            @view-mode-change="(mode) => viewMode.gallery = mode"
            @item-click="handleItemClick"
          />
        </div>   
      </div>
    </DataView>
  </div>
</template>

<script>
import { mapState, mapGetters, mapActions, mapMutations } from 'vuex';
import { isDef, get } from '@/helpers/utils';
import { getScrollTop, inViewport } from '@/helpers/dom';
import qs from '@/helpers/querystring';

// Components
import Header from './Header';
import Metadata from './Metadata';
import LatestGroup from './LatestGroup';
import FileGroup from './FileGroup';
import ChapterGroup from './ChapterGroup';
import MangaGroup from './MangaGroup';
import GalleryGroup from './GalleryGroup';

export default {
  components: {
    Header,
    Metadata,
    LatestGroup,
    FileGroup,
    ChapterGroup,
    MangaGroup,
    GalleryGroup
  },

  data() {
    return {
      activePath: '',
      activeChapter: '',
      activePage: -1,
      showTitle: false,
      showAddress: true,
      isManga: false,
      isSearch: false,
      sharing: false,
      loadingVersion: false,
      viewType: 'file',
      viewMode: {
        file: 'grid',
        manga: 'grid',
        gallery: 'grid'
      }
    }
  },

  computed: {
    ...mapState('app', { appError: 'error', appSize: 'size' }),

    ...mapState('explorer', {
      latest(state) {
        return state.latest.slice(0, 24);
      }
    }),

    ...mapState('manga', [
      'inited', 'name', 'path', 'list', 'type', 'fileType', 'cover', 
      'files', 'chapters', 'chaptersSp', 'versions', 'images', 
      'activeVer', 'activeVerPath',
      'error', 'metadata'
    ]),

    ...mapState('manga', {
      mangaPath: 'activePath'
    }),

    ...mapState('viewer', {
      viewerPath: 'path',
      viewerPage: 'page',
      viewerCh: 'ch'
    }),

    ...mapGetters('app', [ 'repo' ]),

    ...mapGetters('manga', [ 'mangas', 'pending', 'success', 'empty' ]),

    title() {
      if (this.isSearch) {
        let title = 'Search: ';
        if (this.$route.query.kw) title += this.$route.query.kw;
        if (this.$route.query.ver) title += `[${this.$route.query.ver}]`;
        return title;
      }

      const repoName = this.repo.name;
      const title = this.path
        ? get(this.metadata, 'title') || this.$options.filters.stripVer(this.name)
        : repoName;
      
      return title;
    },

    topbarTitle() {
      return (!this.isManga || (this.isManga && this.showTitle)) 
        ? this.title 
        : '';
    },

    navs() {
      const { path } = this.$route.params;
      const safepath = qs.decode(path);
      const items = [];

      if (safepath) {
        const fragments = safepath.split('/');
        const { name } = this.repo;
        items.push({ name });
        
        fragments.pop(); // remove curr path
        fragments.length && fragments.forEach((item, idx) => {
          const path = fragments.slice(0, idx + 1).join('/');
          const data = { name: item, path };
          items.push(data);
        });
      }
      
      return items;
    },

    needAddress() {
      return !!this.navs.length
        && (this.viewType === 'file' || this.viewType === 'random')
    }
  },

  watch: {
    $route(to, from) {
      if (from.name === 'viewer') {
        this.activeChapter = this.viewerCh;
        this.activePage = this.viewerPage;
        this.activePath = this.viewerPath;
        this.$nextTick(() => this.scrollToActive());
      } else {
        this.activeChapter = '';
        this.activePage = -1;
        this.$nextTick(() =>  this.activePath = this.mangaPath);
      }
    }
  },

  methods: {
    ...mapActions('manga', [ 'fetchMangas', 'fetchVersion' ]),

    ...mapMutations('viewer', [ 'setManga' ]),

    _reset(route) {
      this._prevScrollTop = undefined;
      this.sharing = false;
      this.showAddress = true; // always show addressbar when route update
      this._ignoreScrollEvent = true; // prevent collapse addressbar

      this.isManga = route.query.type === 'manga'; // quickly know page is dir or manga
      this.isSearch = route.query.search == 1;
      this.isRandom = route.params.path === this.$consts.RANDOM_PATH;
    
      if (this.isManga) {
        this.viewType = 'manga';
      } else if (this.isSearch) {
        this.viewType = 'search';
      } else if (this.isRandom) {
        this.viewType = 'random';
      } else {
        this.viewType = 'file'
      }
    },

    fetchData(route, { isBack = false, clear = false } = {}) {
      const { 
        params: { path }, 
        query: { kw, search, ver, uptime } 
      } = route;
      const { dirId } = this.repo;
      const safepath = qs.decode(path);
      let promise = Promise.resolve();
      
      // - toggle version
      // - search
      // - @random
      // - toggle activity
      if (
        path === this.$consts.RANDOM_PATH 
        || path !== this.path 
        || search
      ) {
        promise = promise
          .then(() => this.fetchMangas({ 
              isBack, dirId, ver, search, clear,
              path: safepath,
              keyword: kw,
              uptime: uptime
            })
          );
      }

      // TODO: search type use another name replace `ver`
      // when not search type
      // attach version handle multi versions
      if (!search && ver) {
        if (this.success) {
          this.loadingVersion = true;
        }

        promise = promise
          .then(() => this.fetchVersion({ dirId, ver }))
          .then(() => this.loadingVersion = false);
      }

      return promise;
    },

    toggleTopTitle(scrollTop) {
      const metaHeight = (this.$refs.metadata.$refs.root.clientHeight / 2) - 16;
      this.showTitle = metaHeight > 0 && (scrollTop >= metaHeight);
    },

    toggleAddressbar(scrollTop, prevScrollTop) {
      this.showAddress = scrollTop >= 160 
        ? isDef(prevScrollTop) && scrollTop < prevScrollTop
        : true;
    },

    scrollToActive() {
      if (this.activePage === 1 && !this.activeChapter) {
        return window.scrollTo(0, 0);
      }

      if (this.activeChapter || this.activePage > 0) {
        const activeEl = document.querySelector('.gallery-area .active')
          || document.querySelector('.chapter-area .active');

        // check active element existsa and is in viewport
        if (!activeEl || inViewport(activeEl)) return;

        // top of viewport
        const { top } = activeEl.getBoundingClientRect();

        // dont scroll to top (offset 120px)
        const offsetY = 120; 

        // the target scroll to
        const y = top > 0 
          ? top  - getScrollTop()
          : getScrollTop() + top;

        window.scrollTo(0, Math.max(0, y - offsetY));
      }
    },

    // Events
    // ==
    handleItemClick(item, index = 0) {
      const { dirId } = this.repo;
      const { fileType, verNames, chapterSize } = item;
      const isMulitVers = verNames && verNames.length > 1;
      
      // handle pdf in manga
      if (fileType === 'pdf' && this.isManga) {
        const path = item.path;
        const href = this.$service.pdf.makeSrc(path);
        href && window.open(href, 'target', '');

      // handle video
      } else if (fileType === 'video') {
        const path = this.isManga
          ? this.activeVer ? this.activeVerPath : this.path
          : item.path;

        const name = this.isManga ? item.name : undefined

        this.$router.push({
          name: 'viewer',
          params: {
            type: 'video', 
            dirId, 
            path: qs.encode(path)
          },
          query: {
            ver: this.activeVer || undefined,
            name
          }
        });

      // handle file、chapter、mulit version manga or pdf in dir
      } else if (!this.isManga && (item.type === 'FILE' || fileType === 'pdf' || chapterSize || isMulitVers)) {
        // use the first version if exists multi version
        const ver = isMulitVers ? verNames[0] : undefined;       
        const type = item.type.toLowerCase();
        const path = item.path;

        this.$router.push({
          name: 'explorer', 
          params: { 
            dirId,
            path: qs.encode(path) // hanle path with % char
          },
          query: { ver, type }
        });

      // handle click from chapter、gallery、single manga
      } else {
        const ch = item.type.startsWith('CHAPTER') ? item.name : undefined;
        let path = this.isManga
          ? this.activeVer ? this.activeVerPath : this.path
          : item.path;
        if (item.type === 'CHAPTER_SP') path += '/@sp';
        
        this.$router.push({
          name: 'viewer',
          params: { 
            type: 'manga',
            dirId,
            path: qs.encode(path),
            ch
          },
          query: { 
            start: index + 1, 
            ver: this.activeVer || undefined
          } 
        });
      }
    },

    handleScroll() {
      const scrollTop = getScrollTop();

      // TODO: optimize
      // not prevent title check !!.
      // handle mange title show or hide
      if (this._ignoreScrollEvent) {
        setTimeout(() => this._ignoreScrollEvent = false);
        return;
      }

      // handle title and navs show or hide
      if (this.isManga) {
        this.toggleTopTitle(scrollTop); 
      } else {
        this.toggleAddressbar(scrollTop, this._prevScrollTop);
      }

      this._prevScrollTop = scrollTop;
    },

    handleRefresh() {
      this.fetchData(this.$route, { clear: true })
        .then(() => {
          window.setTimeout(() => window.scrollTo(0, 0));
        });
    },

    // TODO: support later
    // handleShareManga() {
    //   const { HOST, PORT } = this.$config.api;
    //   const { hash } = window.location;
      
    //   const port = process.env.NODE_ENV === 'development' ?
    //     window.location.port : // user client port
    //     PORT; // user server port

    //   const protocol = this.$platform.isElectron() ? 'http:' : window.location.protocol;
    //   const url = `${protocol}//${HOST}:${port}/${hash}`;
      
    //   this.$store.dispatch(mangaTypes.SHARE, { url }).then(() => {
    //     this.sharing = true;
    //   }); 
    // }
  },

  activated() {
    if (
      this.appError // error
      || this.$router._reset // reset store
      || (this.$route.meta.isBack && this.inited) // back
    ) {
      return;
    }

    this._reset(this.$route);
    this.fetchData(this.$route);
  },

  beforeRouteUpdate(to, from, next) {
    if (this.appError) return next();
    // check route is changed (besides `activity` querystring)
    if (JSON.stringify(to.params) == JSON.stringify(from.params)) {
      const { activity: a, ...toQuery  } = to.query;
      const { activity: b, ...fromQuery } = from.query;

      if (JSON.stringify(toQuery) == JSON.stringify(fromQuery)) {
        return next();
      }
    }

    // reset data and fetch mangas
    this._reset(to);
    to.meta.resolver = this.fetchData(to, { isBack: to.meta.isBack });
    // we should `next()` immediately otherwise lose pageOffset
    // when back can remember scroller position
    next();
  },

  created() {
    this._reset(this.$route);
    window.addEventListener('scroll', this.handleScroll);
  },

  destroyed() {
    window.removeEventListener('scroll', this.handleScroll);
  }
}
</script>

<style lang="scss">
@import '@/assets/style/base';

.manga-body {
  min-height: calc(100vh - 5rem);
  padding-left: 15px;
  padding-right: 15px;
  margin-right: auto;
  margin-left: auto;
  display: flex;
  flex-direction: column;
  
  &.has-addressbar {
    margin-top: 2rem;
  }

  // 768
  @include media-breakpoint-up(md) {
    max-width: 668px;
  }

  // 992
  @include media-breakpoint-up(lg) {
    max-width: 1140px;
  }

  // 1540
  @include media-breakpoint-up(xl) {
    max-width: 1440px;
  }
}

.manga-version-loading {
  position: absolute;
  margin: 0;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 1040;
}

.manga-area,
.manga-empty-container {
  position: relative;
  flex: 1;
}

.manga-loading-tip {
  text-align: center;
  font-size: 1.5rem;
}

// Area
// ==

.addressbar-collapsed .area-container .area-header {
  top: 48px;
}

// over the below list-group-item
[data-view-mode="list"] {
  .area-header-inner {
    border-bottom: .5px solid;  
  }
}

.area-header {
  margin-left: -15px;
  margin-right: -15px;
  
  @include media-breakpoint-up(sm) {
    padding-left: 15px;
    padding-right: 15px;
  }

  &:not(.static) {
    position: sticky;
    top: 78px;
    z-index: 3;
    transition-duration: .3s;
  }

  .area-header-inner {

    padding: .5rem 15px;

    @include media-breakpoint-up(sm) {
      padding: .5rem 0;
    }
    
    margin: 0;
    font-size: 80%;
    
    a[href] {
      cursor: pointer;
    }

    .actions {
      .svg-icon {
        margin-left: .5rem;
        cursor: pointer;
      }
    }
  }
}

.area-container {

  .area-item {
    cursor: pointer;
    padding: .5rem;
    margin-bottom: 3rem;
  }

  .list-group {
    margin-left: -15px;
    margin-right: -15px;
    margin-top: -1px;

    .list-group-item {
      text-decoration: none;
      border-radius: 0;
      border-width: .5px 0;
      cursor: pointer;

      @include media-breakpoint-up(sm) {
        border-width: .5px;
      }
    }

    .list-group-item + .list-group-item {
      border-top-width: 0px;
    }

    @include media-breakpoint-up(sm) {
      margin-left: 0;
      margin-right: 0;
    }
  }

  .cover {
    cursor: pointer;
    padding: 0 0 141.4%; // default size
    text-decoration: none;
    display: block;
    position: relative;

    img {
      position: absolute;
      width: 100%;
      height: 100%;
      z-index: 1; // covered box-shadow
    }

    img[lazy="loaded"] {
      //visibility: visible;
      background: none;
      height: auto; // when loaded use img origin height
      border: 0;
    }
  }

  .caption {
    left: .5rem;
    right: .5rem;
    position: absolute;
    padding: .2rem .4rem;
    display: block;
    font-size: 13px;

    > div,
    > small {
      max-height: 44px;
      word-wrap: break-word;
      word-break: break-all;
      overflow: hidden;
      line-height: 1.6;
    }

    &.with-status {
      > div {
        max-height: 23px;
      }
    }
  }
}
</style>