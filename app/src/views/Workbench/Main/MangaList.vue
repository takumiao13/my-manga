<template>
  <div class="main-explorer">
    <div class="topbar" ref="topbar">
      <navbar
        :class="{'no-shadow': !isManga && navs.length }" 
        :title="isManga ? titleShown ? title : '' : title" 
        :left-btns="leftBtns"
        :right-btns="rightBtns"
        @click.native="handleBackToTop"
      />
      
      <addressbar
        v-if="!isManga && navs.length" 
        :class="{ collapsed: addressbarCollapsed }"
        :navs="navs"
        @back="handleNavigateBack"
        @navigate="handleNavigate"
      />
    </div>
    
    <data-view 
      class="main-explorer-container" 
      :loading="pending"
      :empty="empty"
      :error="error"
    >
      <div class="row" v-show="success">

        <!-- META DATA -->
        <div id="metadata" v-if="isManga" class="col-12" ref="metadata"> 
          <div class="metadata-share metadata-inner" v-if="sharing">
            <div class="modal mb-3" tabindex="-1" role="dialog">
              <div class="modal-dialog">
                <div class="modal-content">
                  <div class="modal-header">
                    <h5 class="modal-title">Share: {{ title }}</h5>
                  </div>
                  <div class="modal-body">
                    <qriously class="mb-3 qr-code" :value="qrcodeValue" :size="160" />
                    <p class="text-center text-muted">Scan it to get link</p>                    
                    <hr/>
                    <p class="text-center">
                      Link: 
                      <a :href="qrcodeValue" target="_blank">{{ qrcodeValue }}</a>
                    </p>                    
                  </div>
                </div>
              </div>
            </div>
            <div class="metadata-btn">
              <a @click="sharing = false">
                <icon name="times" size="36" />
              </a>
              <span>Close</span>
            </div>
          </div>

          <div class="metadata-main metadata-inner" v-show="!sharing">

            <p class="metadata-title" href="javascript:void 0;">
              {{ title }}
            </p>

          </div>

          <!-- VERSION AREA -->
          <div class="version-area mb-4" v-show="versions.length">
            <p class="area-header">VERSIONS</p>
            <div class="list-group">
              <a 
                class="list-group-item list-group-item-action version-item text-truncate"
                :class="{ 'version-active': item.versionName === $route.query.ver }"
                v-for="item in versions" 
                :key="item.path"
                @click="readVersion(item)"
              >
                <!-- when no versionname ?? -->
                {{ (item.versionName || item.name).toUpperCase() }} 
              </a>
            </div>
          </div>
          <!-- / VERSION AREA -->
        </div>
        <!-- / META DATA -->

        <div class="area-container mt-3 col-12" v-show="!sharing">

          <!-- LATEST -->
          <LatestGroup 
            v-if="!path && latest.length"
            :length="latest.length"
            @more="readFile({ isDir: true, path: $consts.LATEST_PATH })"  
          >
            <MangaItem 
              viewMode="grid"
              v-for="item in latest"
              :key="item.path"
              :active-path="activePath"
              :item="item"
              @click.native="readFile(item, 'manga')"
            />
          </LatestGroup>
          <!-- /LATEST -->

          <!-- FILE GROUP -->
          <FileGroup
            v-show="filesShow"
            :view-mode="viewMode.file"
            :list="files"
            @viewModeChange="(mode) => viewMode.file = mode"
          >
            <FileItem 
              v-for="item in files"
              :key="item.path"
              :active-path="activePath"
              :view-mode="viewMode.file"
              :item="item"
              @click.native="readFile(item)"
            />
          </FileGroup>
          <!-- / FILE GROUP -->

          <!-- MANGA GROUP -->
          <MangaGroup
            :view-mode="viewMode.manga"
            :list="mangas"
            @viewModeChange="(mode) => viewMode.manga = mode"
          >
            <MangaItem 
              v-for="item in mangas"
              :key="item.path"
              :active-path="activePath"
              :view-mode="viewMode.manga"
              :item="item"
              @click.native="readFile(item, 'manga')"
            />
          </MangaGroup>
          <!-- / MANGA GROUP -->

          <!-- CHAPTER AREA -->
          <div class="chapter-area mb-4" v-show="chapters.length">
            <p class="area-header">CHAPTERS</p>

            <div class="list-group">
              <a class="list-group-item list-group-item-action chapter-item"
                :class="{ active: item.name === activeChapter}"
                v-for="(item, index) in chapters" 
                :key="item.path"
                @click="readManga(item, 0)"
              >

                <small class="text-muted float-right">
                  #{{ index + 1 }}
                </small>

                <div class="text-truncate pr-2">
                  {{ item.chapterName || item.name }}
                </div>                
              </a>
            </div>
          </div>
          <!-- / CHAPTER AREA -->

          <!-- GALLERY AREA -->
          <div class="gallery-area mb-4" v-show="images.length">
            <p class="area-header">GALLERY - {{ images.length }} pages</p>
            <div class="row">
              <div 
                class="col-4 col-sm-3 col-xl-2 area-item" 
                v-for="(item, index) in images" 
                :key="item.path"
              >
                <div class="cover"
                  :style="$service.image.style(item, 240)"
                  @click="readManga(item, index)">
                  <img v-lazy="$service.image.makeSrc(item.path)" />
                </div>

                <div class="caption">{{ item.name }}</div>
              </div>
            </div>
          </div>
          <!-- / GALLERY GALLERY -->

        </div>      
      </div>
    </data-view>
  </div>
</template>

<script>
import { isUndef, get, eq } from '@/helpers/utils';
import { getScrollTop } from '@/helpers/dom';
import { types as appTypes } from '@/store/modules/app';
import { types as mangaTypes } from '@/store/modules/manga';
import { types as viewerTypes } from '@/store/modules/viewer';
import { mapState, mapGetters } from 'vuex';
import animateScrollTo from 'animate-scroll-to.js';

// Components
import LatestGroup from './LatestGroup';
import FileGroup from './FileGroup';
import FileItem from './FileItem';

import MangaGroup from './MangaGroup';
import MangaItem from './MangaItem';

const PATH_SEP = '/';

export default {
  components: {
    LatestGroup,
    FileGroup,
    FileItem,
    MangaGroup,
    MangaItem
  },

  data() {
    return {
      activeChapter: '',
      addressbarCollapsed: false,
      titleShown: false,
      isManga: false,
      isSearch: false,
      sharing: false,
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
      'chapters', 'versions', 'images', 'activePath', 
      'error', 'shortId', 'metadata'
    ]),

    ...mapState('manga', {
      mangas(state) {
        if (this.path === this.$consts.LATEST_PATH) {
          return this.latest;
        } else {
          return state.mangas;
        }
      }
    }),

    ...mapState('viewer', {
      viewerPath: 'path',
      viewerCh: 'ch'
    }),

    ...mapGetters('app', [ 'repo' ]),

    ...mapGetters('manga', [ 'pending', 'success', 'empty' ]),

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

    navs() {
      const { path } = this.$route.params;
      const items = [];

      if (path) {
        const fragments = path.split('/');
        const { name } = this.repo;
        items.push({ name });
        
        fragments.pop(); // remove curr path
        fragments.length && fragments.forEach((item, idx) => {
          const path = fragments.slice(0, idx + 1).join(PATH_SEP);
          const data = { name: item, path };
          items.push(data);
        });
      }
      
      return items;
    },

    leftBtns() {
      return (this.isManga || this.isSearch) ? [{
        icon: 'arrow-left',
        tip: 'Back',
        click: this.handleBack
      }] : [{
        icon: 'bars',
        className: 'd-inline-block d-md-none',
        click: this.handleToggleSidebar
      }];
    },

    rightBtns() {
      // hide share button use sidebar qrcode insteadof it
      //
      // {
      //   icon: 'share-alt',
      //   tip: 'Share Manga',
      //   click: this.handleShareManga
      // }

      let listType;

      if (this.isManga) {
        listType = 'manga'
      } else if (this.isSearch) {
        listType = 'search'
      } else {
        listType = 'file'
      }

      const mangaBtns = [{
        icon: 'level-up-alt',
        tip: 'Back to parent',
        click: this.handleBackToParent
      }];

      const searchBtns = [{
        icon: 'search',
        tip: 'Search',
        className: 'd-inline-block d-md-none',
        click: () => this.handleToggleSidebar('search')
      }];

      const btnsMap = {
        manga: mangaBtns,
        search: searchBtns,
        file: null
      }

      return btnsMap[listType];
    },
    
    qrcodeValue() {
      const { HOST, PORT } = this.$config.api;
      const protocol = this.$platform.isElectron() ? 'http:' : window.location.protocol;
      return `${protocol}//${HOST}:${PORT}/s/${this.shortId}`
    },

    filesShow() {
      return this.files.length;
    }
  },

  watch: {
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

    this.sharing = false;
    this.isManga = this.$route.query.type === 'manga';
    this.isSearch = this.$route.query.search == 1;
    this.addressbarCollapsed = false;
    this.fetchMangas(this.$route);
  },

  beforeRouteUpdate(to, from, next) {
    // check only change activity 
    if (this.appError || (eq(to.params, from.params))) {
      return next();
    }

    const { isBack } = to.meta;
    this.sharing = false;
    this.isManga = to.query.type === 'manga';
    this.isSearch = to.query.search == 1;
    this.addressbarCollapsed = false; // always show addressbar when route update
    this._ignoreScrollEvent = true; // prevent collapse addressbar
    to.meta.resolver = this.fetchMangas(to, isBack);
    next();
  },

  created() {
    this._prevScrollTop;
    this._metaHeight;
    window.addEventListener('scroll', this.handleScroll);
  },

  destroyed() {
    window.removeEventListener('scroll', this.handleScroll);
  },

  methods: {
    fetchMangas(route, isBack) {
      const { params: { path }, query: { kw, search, ver } } = route;
      const { dirId } = this.repo;

      let promise = Promise.resolve();

      if (path !== this.path) {
        promise = promise.then(() => this.$store.dispatch(mangaTypes.FETCH, { 
          isBack, dirId, path, ver, search, keyword: kw,
        }));
      }

      // handle multi versions
      if (ver) {
        promise = promise.then(() => this.$store.dispatch(mangaTypes.TOGGLE_VERSION, {
          dirId, ver
        }));
      }

      return promise;
    },

    toggleAddressbar(scrollTop, prevScrollTop) {
      this.addressbarCollapsed = scrollTop >= 160 ? 
        isUndef(prevScrollTop) || scrollTop > prevScrollTop :
        false;
    },

    readFile(item, type) {
      const { dirId } = this.repo;
      const { fileType, path } = item;

      // handle manga or dir
      if (item.isDir || item.type === 'MANGA') {
        const query = type ? { type } : null;

        this.$router.push({
          name: 'explorer', 
          params:{ dirId, path },
          query
        });

      // handle pdf | mp4 | zip (support later)
      } else if (fileType === 'video') {
        this.$router.push({
          name: 'viewer',
          params: { type: 'video', dirId, path },
        });
      } else if (fileType === 'pdf') {
        // use browser as pdf reader
        const href = this.$service.pdf.makeSrc(path);
        href && window.open(href, 'target', '');
      }
    },

    readVersion(item) {
      const { dirId } = this.repo;

      this.$router.replace({
        name: 'explorer', 
        params: { dirId, path: this.path },
        query: {
          ver: item.versionName,
          type: 'manga'
        }
      });
    },

    // when chapter and gallery click.
    readManga(item, index = 0) {
      const { path } = this.$route.params;
      const { dirId } = this.repo;
      const ch = item.type === 'CHAPTER' ? item.name : undefined;
      
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
      item.type === 'CHAPTER' && (this.activeChapter = item.name)

      // sync state to viewer store
      if (shouldSyncState()) {
        this.$store.dispatch(viewerTypes.LOAD, {
          name: this.name,
          path: this.path,
          images: this.images,
          chapters: this.chapters
        });
      }

      this.$router.push({
        name: 'viewer',
        params: { type: 'manga', dirId, path, ch },
        query: {
          // use a query from start page, prepare for history feature
          start: index + 1
        }
      });
    },

    _shouldShowTopTitle(scrollTop) {
      if (!this.isManga) return

      const metaHeight = this.$refs.metadata.clientHeight - 16;
      this.titleShown = metaHeight > 0 && (scrollTop >= metaHeight);
    },

    // events
    handleToggleSidebar(activity) {
      this.$store.commit(appTypes.TOGGLE_ASIDE);
      if (activity) {
        this.$store.commit(appTypes.TOGGLE_ACTIVITY, { activity });
      }
    },

    handleBack() {
     if (this.$router._routerHistory.length === 1) {
        const { dirId } = this.$router.history.current.params;
        this.$router.push({ name: 'explorer', params: { dirId } })
      } else {
        this.$router.go(-1);
      }
    },

    handleBackToParent() {
      const { dirId } = this.repo;
      const path = this.path.split(PATH_SEP).slice(0, -1).join(PATH_SEP);
      const params = { dirId };
      if (path) params.path = path;
 
      this.$router.navigate({
        name: 'explorer',
        params
      });
    },

    handleBackToTop() {
      animateScrollTo(0);
    },

    handleScroll() {
      const scrollTop = getScrollTop();

      // TODO: optimize
      // not prevent title check !!.
      // handle mange title show or hide
      this._shouldShowTopTitle(scrollTop);

      if (this._ignoreScrollEvent) {
        setTimeout(() => this._ignoreScrollEvent = false);
        return;
      }

      // handle navs show or hide
      if (!this.isManga) {
        this.toggleAddressbar(scrollTop, this._prevScrollTop);
      }

      this._prevScrollTop = scrollTop;
    },

    handleNavigateBack() {
      this.$router.back();
    },

    handleNavigate($event, location) {
      const { path } = location;
      const { dirId } = this.repo;

      if (path === false) return;

      this.$router.navigate({
        name: 'explorer',
        params: { dirId, path }
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
/* active */
@-webkit-keyframes ant-progress-active {
  0% { width: 0; opacity: .1 }
  20% { width: 0; opacity: .5 }
  100% { width: 100%; opacity: 0 }
}

@keyframes ant-progress-active {
  0% { width: 0; opacity: .1 }
  20% { width: 0; opacity: .5 }
  100% { width: 100%; opacity: 0 }
}

@import '../../../assets/style/base';

.addressbar {
  transition-duration: .3s;
  height: 2rem;

  &.collapsed {
    transform: translateY(-100%);
  }
}

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

.area-header {
  margin: .5rem 0;
  font-size: 80%;

  a[href] {
    cursor: pointer;
    &:hover {
      font-weight: bold;
    }
  }

  .actions {
    .svg-icon {
      margin-left: .5rem;
      cursor: pointer;
    }
  }
}


// Area
// ==
.folder-area .list-group,
.chapter-area .list-group,
.manga-area .list-group,
.version-area .list-group {
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

.chapter-area .list-group {
  @include media-breakpoint-up(md) {
    margin: 0 -.2rem;
    flex-direction: row;
    flex-wrap: wrap;
    align-items: flex-start;

    .list-group-item {
      margin: .2rem;
      width: calc(50% - .4rem);
    }
  }

  @include media-breakpoint-up(lg) {
    .list-group-item {
      width: calc(33.3% - .4rem);
    }
  }
}

.version-area .list-group {
  margin: 0 -.2rem;
  
  flex-direction: row;
  flex-wrap: wrap;
  align-items: flex-start;

  .list-group-item {
    margin: .2rem;
    border-width: .5px;
    width: calc(33.3% - .4rem);
  }

  @include media-breakpoint-up(md) {
    .list-group-item {
      width: calc(25% - .4rem);
    }
  }

  @include media-breakpoint-up(lg) {
    .list-group-item {
      width: calc(20% - .4rem);
    }
  }
}

.version-area .list-group-item {
  border-left: 4px solid #ddd !important;

  &.version-active {
    border-left-color: $primary !important;
  }
}

.folder-area,
.manga-area,
.gallery-area {
  .area-item {
    cursor: pointer;
    padding: .5rem;
    margin-bottom: 3rem;
  }

  .cover {
    cursor: pointer;
    padding: 0 0 141.4%; // default size
    text-decoration: none;
    display: block;
    position: relative;

    .cover-inner {
      overflow: hidden;
      position: absolute;
      width: 100%;
      height: 100%;
      z-index: 1;

      &.loading::before {
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        background: #999;
        opacity: 0;
        -webkit-animation: ant-progress-active 2s cubic-bezier(.23, 1, .32, 1) infinite;
        animation: ant-progress-active 2s cubic-bezier(.23, 1, .32, 1) infinite;
        z-index: 2;
        content: '';
      }
    }

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

    .cover-placeholder {
      position: absolute;
      width: 100%;
      height: 100%;
      display: flex;
      z-index: 1; // covered box-shadow
      justify-content: center;
      align-items: center;
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

.gallery-area .cover {
  overflow: hidden;
}

.folder-area {
  .row {
    //padding: 0 .5rem;
    margin-left: -.5rem;
    margin-right: -.5rem;
    // @include media-breakpoint-up(md) {
      
    // }
  }
  
  // 1/8
  // .area-item {    
  //   @include media-breakpoint-up(xl) {
  //     flex: 0 0 12.5%;
  //     max-width: 12.5%;
  //   }
  // }

  .area-item-inner {
    display: block;
    position: relative;
    border-radius: .25rem;
    padding: 0px 0px 100%;

    > div {
      position: absolute;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
  }
}

.manga-area {
  .row {
    margin-left: -.5rem;
    margin-right: -.5rem;
    align-items: flex-end;

    // @include media-breakpoint-up(md) {
      
    // }
  }

  .area-item {
    flex-grow: 1;
  }
  
  .cover-inner {
    cursor: pointer;
    border-radius: .25rem;

    // scale img to fill cover
    &.scale img[lazy="loaded"] {
      height: 100%;
    }

    &.fitW,
    &.fitH {
      img[lazy="loaded"] {
        top: 50%;
        left: 50%;
        transform: translateX(-50%) translateY(-50%);
      }
    }

    &.fitW img[lazy="loaded"] {
      width: 100%;
      height: auto;
    }

    &.fitH img[lazy="loaded"] {
      height: 100%;
      width: auto;
    }
  }

  .caption {
    font-weight: 600;
    text-align: left;
  }

  .tags {
    position: absolute;
    bottom: .5rem;
    right: -3px;
    z-index: 2;

    > ul {
      list-style: none;
      padding: 0px;
      margin: 0px;
      box-shadow: 0px 0px 3px #ddd;   
  
      > li {
        display: block;
        right: 0px;
        color: #fff;
        padding: 3px 16px 5px 13px;
        background-color: #333;
        border-bottom: .5px solid #666;
        font-size: 12px;
        overflow: hidden;

        &::after {
          content:"";
          position: absolute;
          top: 0px;
          right: 0px;
          height: 100%;
          border-right: 3px solid $primary;
        }
      }
    }

    // > ul:hover > li,
    > ul > li:last-child {
      border-bottom: 0;
    }

    > ul > li:hover { 
      background-color: $primary; 
    }
  }
}

.gallery-area {

  .row {
    padding: .5rem .5rem;
    border-width: .5px 0;
    border-style: solid;

    @include media-breakpoint-up(md) {
      margin-left: 0;
      margin-right: 0;
      border-width: .5px;
    }
  }

  .cover {
    cursor: pointer;
    transform: translateY(-50%);
    top: 50%;
  }

  .caption {
    top: 100%;
    text-align: center;
  }
}


// Metadata
// ==
#metadata {

  .metadata-inner {
    display: flex;
    position: relative;
  }

  .metadata-share {
    min-height: calc(100vh - 3rem);
    justify-content: center;
    align-items: center;
    flex-direction: column;

    .metadata-share-inner {
      padding: 1rem 0;
      background: #fff;
      border-radius: .5rem;
      width: 100%;
      max-width: 360px;
    }

    .modal {
      position: relative;
      top: auto;
      right: auto;
      bottom: auto;
      left: auto;
      z-index: 1;
      display: block;
      height: auto;
      overflow: visible;

      .modal-header {
        padding: .5rem 1rem;
      }
      
      .modal-dialog {
        margin-top: 0;
        max-width: 420px;
      }

      p {
        word-wrap: break-word;
        word-break:break-all;     
      }
    }

    .qr-code {
      canvas {
        display: block;
        margin: 0 auto;
      }
    }

    input {
      text-align: center;
    }

    .close-share-btn {
      position: absolute;
      right: 0;
      top: 0;
    }
  }

  .metadata-cover {
    display: block;
    position: relative;
    border-radius: .255rem;
    max-width: 80%;
    //max-height: 60%;
    max-height: 240px;
  }

  .metadata-title {
    margin: 1rem 0 .5rem 0;
    font-size: 1.2rem;
    text-align: center;
    font-weight: 100;
    text-decoration: none;

    span {
      display: none;
    }

    @include media-breakpoint-up(md) {
      font-size: 1.6rem;
    }
  }

  .metadata-footer {
    width: 100%;
    max-width: 300px;
    display: flex;
    justify-items: center;
    font-size: 1rem;
    flex-wrap: wrap;

    > div {
      width: 50%;
      display: flex;
      flex-direction: column;
      text-align: center;
      margin-bottom: 1rem;
    }
  }

  .metadata-btn {
    text-align: center;

    > a {
      width: 3rem;
      height: 3rem;
      border-radius: 100%;
      display: block;
      margin: 0 auto .5rem auto;
      display: flex;
      justify-content: center;
      align-items: center;
      cursor: pointer;
      background: rgba(0,0,0, .1);
    
      .svg-icon {
        width: 28px;
        height: 28px;
      }
    }
  }
}

// Topbar
// ==
.topbar {
  .manga-title-shown {
    color: '';

    .navbar-brand {
      opacity: 1
    }
  }

  .manga-title-hidden {
    background: transparent !important;
    border-bottom-color: transparent;
    box-shadow: none;
    
    .navbar-brand {
      opacity: 0;
    }
  }
}

</style>