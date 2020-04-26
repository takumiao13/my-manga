<template>
  <div class="main-explorer">
    <topbar
      :title="topbarTitle"
      :show-address="showAddress"
      :view-type="viewType"
      @refresh="handleRefresh"
    />
    
    <data-view 
      class="main-explorer-container" 
      :loading="pending"
      :empty="empty"
      :error="error"
    >
      <div class="row" v-show="success">
        <!-- METADATA -->
        <meta-data
          v-if="isManga"
          class="col-12" 
          ref="metadata"
          :title="title"
          :sharing="sharing"
        />

        <div class="area-container mt-3 col-12" v-show="!sharing">

          <!-- LATEST -->
          <latest-group 
            v-if="!path && !isSearch && latest.length"
            :list="latest"
            :active-path="activePath"
            @more="readFile"  
            @item-click="readFile"
          />

          <!-- FILE -->
          <file-group
            :view-mode="viewMode.file"
            :list="files"
            :active-path="activePath"
            @viewModeChange="(mode) => viewMode.file = mode"
            @item-click="readFile"
          />

          <!-- MANGA -->
          <manga-group
            :view-mode="viewMode.manga"
            :list="mangas"
            @viewModeChange="(mode) => viewMode.manga = mode"
            @item-click="readFile"
          />

          <!-- CHAPTER -->
          <chapter-group
            :list="chapters"
            :active-name="activeChapter"
            :metadata="metadata"
            @item-click="readManga"
          />

          <!-- GALLERY -->
          <gallery-group
            :list="images"
            @item-click="readManga"
          />
        </div>      
      </div>
    </data-view>
  </div>
</template>

<script>
import { isDef, get, eq } from '@/helpers/utils';
import { getScrollTop } from '@/helpers/dom';
import { types as mangaTypes } from '@/store/modules/manga';
import { types as viewerTypes } from '@/store/modules/viewer';
import { mapState, mapGetters } from 'vuex';

// Components
import Topbar from './Topbar';
import MetaData from './Metadata';
import LatestGroup from './LatestGroup';
import FileGroup from './FileGroup';
import ChapterGroup from './ChapterGroup';
import MangaGroup from './MangaGroup';
import GalleryGroup from './GalleryGroup';

export default {
  components: {
    Topbar,
    MetaData,
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
      'inited', 'name', 'path', 'list', 'type', 'cover', 'files', 
      'chapters', 'versions', 'images', 
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
        this.title : ''
    }
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

  activated() {
    if (
      this.appError || // error
      this.$router._reset || // reset store
      (this.$route.meta.isBack && this.inited) // back
    ) {
      return;
    }

    this.refreshData(this.$route);
    this.fetchMangas(this.$route);
  },

  beforeRouteUpdate(to, from, next) {
    // check only change activity 
    if (this.appError || (eq(to.params, from.params))) {
      return next();
    }

    const { isBack } = to.meta;
    this.refreshData(to);
    to.meta.resolver = this.fetchMangas(to, { isBack });
    next();
  },

  created() {
    this._prevScrollTop;
    window.addEventListener('scroll', this.handleScroll);
  },

  destroyed() {
    window.removeEventListener('scroll', this.handleScroll);
  },

  methods: {
    refreshData(route) {
      this.sharing = false;
      this.showAddress = true; // always show addressbar when route update
      this._ignoreScrollEvent = true; // prevent collapse addressbar

      this.isManga = route.query.type === 'manga'; // quickly know page is dir or manga
      this.isSearch = route.query.search == 1;
    
      if (this.isManga) {
        this.viewType = 'manga';
      } else if (this.isSearch) {
        this.viewType = 'search';
      } else {
        this.viewType = 'file';
      }
    },

    // TODO: put code in store
    fetchMangas(route, { isBack = false, clear = false } = {}) {
      const { 
        params: { path }, 
        query: { kw, search, ver } 
      } = route;
      const { dirId } = this.repo;

      let promise = Promise.resolve();

      if (path !== this.path || clear) {
        promise = promise.then(() => 
          this.$store.dispatch(mangaTypes.FETCH, { 
            isBack, dirId, path, ver, search, clear,
            keyword: kw, 
          })
        );
      }

      // attach version handle multi versions
      if (ver) {
        promise = promise.then(() => 
          this.$store.dispatch(mangaTypes.TOGGLE_VERSION, {
            dirId, ver
          })
        );
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
          params: { dirId, path },
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
          params: { type: 'video', dirId, path: this.path },
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
        this.$store.commit(viewerTypes.LOAD, {
          name: this.name,
          path: this.path,
          images: this.images,
          chapters: this.chapters
        });
      }

      this.$router.push({
        name: 'viewer',
        params: { 
          type: 'manga', 
          dirId, 
          path: this.activeVer ? this.activeVerPath : this.path, 
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
      const metaHeight = this.$refs.metadata.$refs.root.clientHeight - 16;
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
      const scrollTop = getScrollTop();
      this.fetchMangas(this.$route, { clear: true })
        .then(() => {
          window.setTimeout(() => window.scrollTo(0, scrollTop));
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
}

// Area
// ==
.area-container {

  .area-header {
    padding: .5rem 0;
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

  .area-item {
    cursor: pointer;
    padding: .5rem;
    margin-bottom: 3rem;
  }

  .list-group {
    margin-left: -15px;
    margin-right: -15px;

    .list-group-item {
      text-decoration: none;
      border-radius: 0;
      border-width: .5px 0;
      cursor: pointer;

      @include media-breakpoint-up(sm) {
        border-width: .5px;
      }
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
    overflow: hidden;
    max-height: 46px;
    line-height: 1.6;
    padding: .2rem .4rem;
    display: block;
    font-size: 13px;
    word-wrap: break-word;
    word-break: break-all;
  }
}
</style>