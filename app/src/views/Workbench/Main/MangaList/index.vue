<template>
  <div 
    class="main-explorer" 
    :class="{ 
      'addressbar-collapsed': !showAddress || !needAddress
    }"
  >
    <Topbar
      :title="topbarTitle"
      :view-type="viewType"
      :navs="navs"
      :need-address="needAddress"
      @refresh="handleRefresh"
    />
    
    <DataView 
      class="main-explorer-container"
      :class="{ 'has-addressbar' : needAddress }"
      :loading="pending"
      :empty="empty"
      :error="error"
    >
      <div v-show="success && !empty">
        <!-- METADATA -->
        <Metadata
          v-if="isManga"
          ref="metadata"
          :title="title"
          :sharing="sharing"
          @read-manga="readManga"
          @read-file="readFile"
        />

        <div class="row">
          <div class="area-container mt-3 col-12" v-show="!sharing">

            <!-- LATEST -->
            <LatestGroup 
              v-if="!path && !isSearch && latest.length"
              :list="latest"
              :active-path="activePath"
              @more="readFile"  
              @item-click="readFile"
            />

            <!-- FILE -->
            <FileGroup
              :view-mode="viewMode.file"
              :list="files"
              :active-path="activePath"
              @viewModeChange="(mode) => viewMode.file = mode"
              @item-click="readFile"
            />

            <!-- MANGA -->
            <MangaGroup
              :view-mode="viewMode.manga"
              :list="mangas"
              :active-path="activePath"
              @viewModeChange="(mode) => viewMode.manga = mode"
              @item-click="readFile"
            />

            <!-- CHAPTER -->
            <ChapterGroup
              :list="chapters"
              :active-name="activeChapter"
              :metadata="metadata"
              @item-click="readManga"
            />

            <!-- GALLERY -->
            <GalleryGroup
              :list="images"
              :hide-first-image="type === 'MANGA'"
              @item-click="readManga"
            />
          </div>   
        </div>   
      </div>
    </DataView>
  </div>
</template>

<script>
import { isDef, get } from '@/helpers/utils';
import { getScrollTop } from '@/helpers/dom';
import qs from '@/helpers/querystring';
import { types as mangaTypes } from '@/store/modules/manga';
import { mapState, mapGetters, mapActions, mapMutations } from 'vuex';

// Components
import Topbar from './Topbar';
import Metadata from './Metadata';
import LatestGroup from './LatestGroup';
import FileGroup from './FileGroup';
import ChapterGroup from './ChapterGroup';
import MangaGroup from './MangaGroup';
import GalleryGroup from './GalleryGroup';

export default {
  components: {
    Topbar,
    Metadata,
    LatestGroup,
    FileGroup,
    ChapterGroup,
    MangaGroup,
    GalleryGroup
  },

  data() {
    return {
      activeChapter: '',
      showTitle: false,
      showAddress: true,
      isManga: false,
      isSearch: false,
      sharing: false,
      viewType: 'file',
      viewMode: {
        file: 'grid',
        manga: 'grid'
      }
    }
  },

  computed: {
    ...mapState('app', { appError: 'error' }),

    ...mapState('explorer', {
      latest(state) {
        return state.latest.slice(0, 24);
      }
    }),

    ...mapState('manga', [
      'inited', 'name', 'path', 'list', 'type', 'fileType', 'cover', 
      'files', 'chapters', 'versions', 'images', 
      'activePath', 'activeVer', 'activeVerPath',
      'error', 'metadata'
    ]),

    ...mapState('viewer', {
      viewerPath: 'path',
      viewerCh: 'ch'
    }),

    ...mapGetters('app', [ 'repo' ]),

    ...mapGetters('manga', [ 'mangas', 'pending', 'success', 'empty' ]),

    title() {
      if (this.isSearch) {
        return 'Search: ' + this.$route.query.kw;
      }

      const repoName = this.repo.name;
      const title = this.path ? 
        get(this.metadata, 'title') || this.name : 
        repoName;
      
      return title;
    },

    topbarTitle() {
      return (!this.isManga || (this.isManga && this.showTitle)) ? 
        this.title : '';
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
      return (this.viewType === 'file' || this.viewType === 'random') && 
             !!this.navs.length;
    },
  },

  watch: {
    // TODO: pretty code
    // when route change (not update)
    $route(to, from) {
      if (from.name === 'viewer') {
        this.activeChapter = this.viewerCh;
      }
    }
  },

  methods: {
    ...mapActions('manga', [ 'fetchMangas', 'fetchVersion' ]),

    ...mapMutations('viewer', [ 'setManga' ]),

    refreshData(route) {
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

    fetchMangasWithVersion(route, { isBack = false, clear = false } = {}) {
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
      if (path === '@random' || path !== this.path || search) {
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
        promise = promise
          .then(() => this.fetchVersion({ dirId, ver }));
      }

      return promise;
    },

    // when file clicked.
    readFile(item, type) {
      const { dirId } = this.repo;
      const { isDir, fileType, path, verNames } = item;

      // handle manga or dir
      if (isDir || item.type === 'MANGA') {
        const ver = verNames && verNames.length > 1 ? 
          verNames[0] : undefined;
        let query = null;
        
        // use the first version if exists multi version
        if (ver || type) {
          query = Object.assign({}, { ver, type });
        }

        this.$router.push({
          name: 'explorer', 
          params: { dirId, path: qs.encode(path) }, // hanle path with % char
          query
        });

      // handle pdf | mp4 | zip (support later)
      } else if (fileType === 'video') {
        // use parent path as route path
        const query = this.activeVer ? 
          { ver: this.activeVer } : 
          { name: item.name }

        this.$router.push({
          name: 'viewer',
          params: { type: 'video', dirId, path: qs.encode(this.path) },
          query
        });
      } else if (fileType === 'pdf') {
        // use browser as pdf reader 
        // `item.path` as source
        const href = this.$service.pdf.makeSrc(path);
        href && window.open(href, 'target', '');
      }
    },

    // when chapter and gallery clicked.
    readManga(item, index = 0) {
      const { dirId } = this.repo;
      const ch = item.type === 'CHAPTER' ? item.name : undefined;
      
      // TODO: when in multi versions could not sync state
      // because of `this.path` is changed to active version path.
      // sync state to viewer store.
      const shouldSyncState = () => {
        if (item.type === 'IMAGE') {
          return !this.path || this.path !== this.viewerPath || this.viewerPath;
        }

        if (item.type === 'CHAPTER') {
          return !this.path || 
            this.path !== this.viewerPath || 
            this.ch !== this.viewerCh;
        }
      };

      // activate chapter
      if (item.type === 'CHAPTER') {
        this.activeChapter = item.name;
      }

      // sync state to viewer store
      if (shouldSyncState()) {
        this.setManga({
          name: this.name,
          path: this.path,
          images: this.images,
          chapters: this.chapters
        });
      }

      const path = this.activeVer ? this.activeVerPath : this.path;
      
      this.$router.push({
        name: 'viewer',
        params: { 
          type: 'manga', 
          dirId, 
          path: qs.encode(path),
          ch 
        },
        query: {
          // use a query from start page, prepare for history feature
          start: index + 1,
          ver: this.activeVer
        }
      });
    },

    toggleTopTitle(scrollTop) {
      const metaHeight = (this.$refs.metadata.$refs.root.clientHeight/2) - 16;
      this.showTitle = metaHeight > 0 && (scrollTop >= metaHeight);
    },

    toggleAddressbar(scrollTop, prevScrollTop) {
      this.showAddress = scrollTop >= 160 ? 
        isDef(prevScrollTop) && scrollTop < prevScrollTop :
        true;
    },

    // events
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
      // TODO:
      // refresh file list
      // const scrollTop = getScrollTop();
      this.fetchMangas(this.$route, { clear: true })
        .then(() => {
          window.setTimeout(() => window.scrollTo(0, 0));
        });
    },

    handleShareManga() {
      const { HOST, PORT } = this.$config.api;
      const { hash } = window.location;
      
      const port = process.env.NODE_ENV === 'development' ?
        window.location.port : // user client port
        PORT; // user server port

      const protocol = this.$platform.isElectron() ? 'http:' : window.location.protocol;
      const url = `${protocol}//${HOST}:${port}/${hash}`;
      
      this.$store.dispatch(mangaTypes.SHARE, { url }).then(() => {
        this.sharing = true;
      }); 
    }
  },

  activated() {
    if (
      this.appError || // error
      this.$router._reset || // reset store
      (this.$route.meta.isBack && this.inited) // back
    ) {
      return;
    }

    this.refreshData(this.$route);
    this.fetchMangasWithVersion(this.$route);
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
    this.refreshData(to);
    const resolver = this.fetchMangasWithVersion(to, { isBack: to.meta.isBack });
    resolver.then(next); // TODO: handle error
    to.meta.resolver = resolver
  },

  created() {
    this._prevScrollTop;
    window.addEventListener('scroll', this.handleScroll);
  },

  destroyed() {
    window.removeEventListener('scroll', this.handleScroll);
  }
}
</script>

<style lang="scss">
@import '../../../../assets/style/base';

.main-explorer-container {
  min-height: calc(100vh - 5rem);
  padding-left: 0;
  padding-right: 0;

  @include media-breakpoint-up(xl) {
    max-width: 1140px;
    margin-right: auto;
    margin-left: auto;
  }

  &.has-addressbar {
    margin-top: 2rem;
  }
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

  position: sticky;
  top: 78px;
  z-index: 3;
  transition-duration: .3s;

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