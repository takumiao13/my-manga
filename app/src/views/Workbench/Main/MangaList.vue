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
      class="main-explorer-container container" 
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

            <a class="metadata-title" href="javascript:void 0;" title="Read Now" 
              @click="readManga(chapters[0] || images[0], 0)"
            >
              {{ title }}
              <span>&rarr;</span>
            </a>
          </div>
        </div>
        <!-- / META DATA -->

        <div class="area-container col-12" v-show="!sharing">

          <!-- VERSION AREA -->
          <div class="folder-area mb-4" v-show="versions.length">
            <p class="area-header">VERSIONS - {{ versions.length }} items</p>
            <div class="list-group">
              <a 
                class="list-group-item list-group-item-action folder-item text-truncate"
                :class="{ active: item.path === activePath }"
                v-for="item in versions" 
                :key="item.path"
                @click="readFile(item, 'manga')"                 
              >
                <icon :name="item.fileType ? `file-${item.fileType}` : 'archive'" />
                &nbsp; {{ item.versionName || item.name }} 
              </a>
            </div>
          </div>
          <!-- / VERSION AREA -->

          <!-- FILE AREA -->
          <div class="folder-area mb-4" v-show="filesShow">
            <p class="area-header">FILES - {{ files.length }} items</p>
            <div class="list-group">
              <a 
                class="list-group-item list-group-item-action folder-item text-truncate"
                :class="{ active: item.path === activePath }"
                v-for="item in files" 
                :key="item.path"
                @click="readFile(item)"                 
              >
                <icon name="folder" />
                &nbsp; {{ item.name }} 
              </a>
            </div>
          </div>
          <!-- / FILE AREA -->

          <!-- MANGA AREA -->
          <div class="manga-area mb-4" v-show="mangas.length">
            <p class="area-header">MANGA - {{ mangas.length }} items</p>
            <div class="row">
              <div 
                class="area-item"
                :class="{ 
                  active: item.path === activePath, 
                  'col-6 col-sm-3 col-xl-2': !item.cover || (item.height > item.width),
                  'col-12 col-sm-6 col-xl-4': item.height <= item.width 
                }"
                v-for="item in mangas"
                :key="item.path"
              >

                <a 
                  class="cover"
                  v-bind="$service.image.coverStyle(item)"
                  @click="readFile(item, 'manga')"
                >
                  <img v-if="item.cover" v-lazy="$service.image.makeSrc(item.cover)" />
                  <div v-else class="cover-placeholder">
                    <icon :name="`file-${item.fileType || 'image'}`" size="64" />
                  </div>
                </a>

                <div class="caption">{{ item.name }}</div>
              </div>
            </div>
          </div>
          <!-- / MANGA AREA -->
          
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
                  {{ item.name }}
                </div>                
              </a>
            </div>
          </div>
          <!-- / CHAPTER AREA -->

          <!-- GALLERY AREA -->
          <div class="gallery-area mb-4" v-show="images.length">
            <p class="area-header">GALLERY - {{ images.length }} pages</p>
            <div class="row">
              <div class="col-6 col-sm-3 col-xl-2 area-item" 
                v-for="(item, index) in images" 
                :key="item.path">

                <div class="cover"
                  :style="$service.image.style(item)"
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
import config from '@/config';
import { isUndef, last, get, eq } from '@/helpers/utils';
import { getScrollTop } from '@/helpers/dom';
import platform from '@/helpers/platform';
import { types as appTypes } from '@/store/modules/app';
import { types as mangaTypes } from '@/store/modules/manga';
import { types as viewerTypes } from '@/store/modules/viewer';
import { mapState, mapGetters } from 'vuex';
import animateScrollTo from 'animate-scroll-to.js';

const PATH_SEP = '/';

export default {
  data() {
    return {
      activeChapter: '',
      addressbarCollapsed: false,
      titleShown: false,
      isManga: false,
      sharing: false
    }
  },

  computed: {
    ...mapState('app', { appError: 'error' }),

    ...mapState('manga', [
      'inited', 'path', 'list', 'type', 'cover', 'files', 
      'mangas', 'chapters', 'versions', 'images', 'activePath', 
      'error', 'shortId', 'metadata'
    ]),

    ...mapState('viewer', {
      viewerPath: 'path',
      viewerCh: 'ch'
    }),

    ...mapGetters('app', [ 'repo' ]),

    ...mapGetters('manga', [ 'pending', 'success', 'empty' ]),

    title() {
      const repoName = this.repo.name;
      const path = this.$route.params.path;
      const title = path ? 
        get(this.metadata, 'title') || last(path.split(PATH_SEP)) : 
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
      return this.isManga ? [{
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
      return this.isManga ? [{
        icon: 'level-up-alt',
        tip: 'Back to parent',
        click: this.handleBackToParent
      }] : null;
    },
    
    qrcodeValue() {
      const { host, port } = config;
      const protocol = platform.isElectron() ? 'http:' : window.location.protocol;
      return `${protocol}//${host}:${port}/s/${this.shortId}`
    },

    filesShow() {
      console.log(this.type, this.files.length, this.metadata);
      return this.type === 'FILE' && this.files.length && !this.metadata;
    }
  },

  watch: {
    $route(to, from) {
      if (from.name === 'viewer') {
        this.activeChapter = this.viewerCh;
      }
    }
  },

  activated() {
    if (this.appError || (this.$route.meta.isBack && this.inited) || this.$router._reset) return;
    this.sharing = false;
    this.addressbarCollapsed = false;
    this.isManga = this.$route.query.type === 'manga';
    this.titleShown = false;
    this.fetchMangas(this.$route.params.path);
  },

  beforeRouteUpdate(to, from, next) {
    if (this.appError || eq(to.params, from.params)) {
      return next();
    }
      
    const { isBack } = to.meta;
    this.sharing = false;
    this.isManga = to.query.type === 'manga';
    this.titleShown = false;

    this.addressbarCollapsed = false; // always show addressbar when route update
    this._ignoreScrollEvent = true; // prevent collapse addressbar
    to.meta.scrollPromise = this.fetchMangas(to.params.path, isBack);

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
    fetchMangas(path = '', isBack) {
      const { dirId } = this.repo;
      const payload = { path, dirId, isBack }

      return this.$store.dispatch(mangaTypes.LIST, payload);
    },

    toggleAddressbar(scrollTop, prevScrollTop) {
      this.addressbarCollapsed = scrollTop >= 160 ? 
        isUndef(prevScrollTop) || scrollTop > prevScrollTop :
        false;
    },

    readFile(item, type) {
      const fileType = item.fileType;

      if (!fileType) {
        const query = type ? { type } : null;

        this.$router.push({
          name: 'explorer', 
          params:{ 
            dirId: this.repo.dirId,
            path: item.path 
          },
          query
        });

      // handle pdf | mp4 | zip (support later)
      } else {
        let href;
        if (fileType === 'video') {
          href = this.$service.video.makeSrc(item.path, true);
        } else if (fileType === 'pdf') {
          href = this.$service.pdf.makeSrc(item.path, true)
        }

        href && window.open(href, 'target', '');
      }
    },

    readManga(item, index = 0) {
      const { path } = this.$route.params;
      const { dirId } = this.repo;
      const ch = item.type === 'CHAPTER' ? item.name : undefined;
      
      // sync state to viewer
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
          path: this.path,
          images: this.images,
          chapters: this.chapters
        });
      }

        this.$router.push({
          name: 'viewer',
          params: { dirId, path, ch },
          query: {
            // use a query from start page, prepare for history feature
            start: index + 1
          }
        });


    },

    // events
    handleToggleSidebar() {
      this.$store.dispatch(appTypes.TOGGLE_ASIDE);
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
      if (this._ignoreScrollEvent) {
        setTimeout(() => this._ignoreScrollEvent = false);
        return;
      }

      const scrollTop = getScrollTop();

      // handle navs show or hide
      if (!this.isManga) {  
        this.toggleAddressbar(scrollTop, this._prevScrollTop);

      // handle mange title show or hide
      } else {
        const metaH = this.$refs.metadata.clientHeight - 16;
        this.titleShown = scrollTop >= metaH;
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
      const { host } = config;
      const { hash } = window.location;
      
      const port = process.env.NODE_ENV === 'development' ?
        window.location.port : // user client port
        config.port; // user server port

      const protocol = platform.isElectron() ? 'http:' : window.location.protocol;
      const url = `${protocol}//${host}:${port}/${hash}`;
      
      this.$store.dispatch(mangaTypes.SHARE, { url }).then(() => {
        this.sharing = true;
      }); 
    }
  }
}
</script>

<style lang="scss">
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
}

.area-header {
  margin: .5rem 0;
  font-size: 80%;
}


// Area
// ==
.folder-area .list-group,
.chapter-area .list-group {
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

.manga-area,
.gallery-area {
  .area-item {
    padding: .5rem;
    margin-bottom: 3rem;

    &:hover {
      z-index: 2;

      .caption {
        min-height: 2.8625rem;
        height: auto;
        overflow: visible;
      }
    }
  }

  .cover {
    cursor: pointer;
    padding: 0 0 141.4%; // default size
    text-decoration: none;
    display: block;
    position: relative;
    overflow: hidden;
    
    img {
      position: absolute;
      width: 100%;
      height: 100%;
      display: block;
      z-index: 1; // covered box-shadow
    }

    img[lazy="loaded"] {
      background: none;
      height: auto;
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
    height: 2.8625rem;
    padding: .2rem .4rem;
    display: block;
    font-size: 13px;
    word-wrap: break-word;
    word-break:break-all;
  }
}

.manga-area {
  > .row {
    padding: 0 .5rem;

    @include media-breakpoint-up(md) {
      margin-left: -.5rem;
      margin-right: -.5rem;
      padding: 0;
    }
  }

  .area-item {
    flex-grow: 1;
  }
  
  .cover {
    cursor: pointer;
    border-radius: .5rem .5rem 0 0;

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
    border-radius: 0 0 .5rem .5rem;
    font-weight: 600;
    text-align: left;
  }
}

.gallery-area {

  > .row {
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
    margin: 1rem 0;
    font-size: 1.6rem;
    text-align: center;
    font-weight: 200;
    text-decoration: none;

    span {
      display: none;
    }

    @include media-breakpoint-up(md) {
      font-size: 2rem;
    }

    &:hover {
      span {
        display: inline;
      }
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