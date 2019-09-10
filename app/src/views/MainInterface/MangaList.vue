<template>
  <div>
    <div class="main-explorer" :class="{ dark: isDarkerBg }">
      <div class="topbar" v-show="noError" ref="topbar">
        <navbar
          :class="{
            'no-shadow': !isManga && breadcrumb.length > 1,
            'manga-title-shown': isShowTopTitle,
            'manga-title-hidden': isManga && !empty && !isShowTopTitle
          }" 
          :title="title" 
          :left-btns="leftBtns"
          :right-btns="rightBtns"
          @click="handleBackToTop"
        />
        
        <breadcrumb
          v-show="breadcrumb.length > 1 && !isManga" 
          :class="{ collapsed: isCollapsed }"
          :navs="breadcrumb"
          @back="handleNavigateBack"
          @navigate="handleNavigate"
        />
      </div>    
      <data-view 
        class="main-explorer-container" 
        :loading="isPending"
        :empty="empty"
        :error="error"
      >
        <div class="row" v-show="noError">

          <!-- META DATA -->
          <div id="metadata" v-if="isManga && !empty" class="col-12" ref="metadata">
            <div class="metadata-banner" ref="banner"></div>
            
            <div class="metadata-share metadata-inner" v-if="isQrcodeShown">
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
                <a @click="isQrcodeShown = false">
                  <icon name="times" size="36" />
                </a>
                <span>Close</span>
              </div>
            </div>

            <div class="metadata-main metadata-inner" v-show="!isQrcodeShown">
              <img class="metadata-cover mb-3" ref="cover" />
              <h4 class="metadata-title mb-4">
                {{ title }} <br />
                <small v-if="chapters.length">{{ chapters.length }} chapters</small>
                <small v-if="!chapters.length">{{ images.length }} pages</small> 
              </h4>
              <div class="metadata-footer">
                <div class="metadata-btn">
                  <a @click="handleViewManga($event, chapters[0] || images[0], 0)">
                    <icon name="book-open" />
                  </a>
                  <span>Read Now</span>
                </div>
                <div class="metadata-btn">
                  <a @click="handleViewGallery">
                    <icon name="gallery" />
                  </a>
                  <span>Gallery</span>
                </div>
                <div class="metadata-btn">
                  <a @click="handleShareManga">
                    <icon name="share-alt" size="36" />
                  </a>
                  <span>Share</span>
                </div>
              </div>
            </div>
          </div>
          <!-- / META DATA -->

          <div class="col-12 area-container">

            <!-- FOLDER AREA -->
            <div class="folder-area mb-4" v-show="folders.length">
              <p class="area-header">FOLDER</p>
              <div class="list-group">
                <router-link 
                  class="list-group-item list-group-item-action folder-item"
                  :class="{ active: item.path === activePath }"
                  v-for="item in folders" 
                  :key="item.path"
                  :to="{
                    name: 'explorer', 
                    params:{ 
                      dirId: repo.dirId,
                      path: item.path 
                    }
                  }"
                >
                  <icon name="folder" /> &nbsp; {{ item.name }}
                </router-link>
              </div>
            </div>
            <!-- / FOLDER AREA -->

            <!-- MANGA AREA -->
            <div class="manga-area mb-4" v-show="mangas.length">
              <p class="area-header">MANGA - {{ mangas.length }} items</p>
              <div class="row">
                <div 
                  class="col-6 col-sm-4 col-md-3 col-xl-2 area-item"
                  :class="{ active: item.path === activePath }"      
                  v-for="item in mangas" 
                  :key="item.path"
                >

                  <router-link 
                    class="cover"
                    v-bind="$service.image.coverStyle(item)"
                    :to="{
                      name: 'explorer', 
                      params: { 
                        dirId: repo.dirId,
                        path: item.path 
                      },
                      query: {
                        type: 'manga'
                      }
                    }"
                  >
                    <img v-lazy="$service.image.makeSrc(item.cover)" />
                  </router-link>

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
                  :class="{ active: item.name === activeCh}"
                  v-for="(item, index) in chapters" 
                  :key="item.path"
                  @click="handleViewManga($event, item, 0)"
                >

                  <small class="float-right">
                    #{{ index + 1 }}
                  </small>

                  {{ item.name }}
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
                    :style="$service.image.style(item, 240)"
                    @click="handleViewManga($event, item, index)">
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
  </div>
</template>

<script>
import { isUndef, last, debounce, byId, getScrollTop, inElectron } from '@/helpers';
import config from '@/config';
import { types as appTypes } from '@/store/modules/app';
import { types as mangaTypes } from '@/store/modules/manga';
import { types as viewerTypes } from '@/store/modules/viewer';
import { mapState, mapGetters } from 'vuex';
import ColorThief from 'colorthief/dist/color-thief.mjs';

const colorThief = new ColorThief();
const PATH_SEP = '/';

export default {
  data() {
    return {
      activeCh: '',
      isCollapsed: false,
      isShowTopTitle: false,
      isManga: false,
      isDarkerBg: false,
      isQrcodeShown: false,
    }
  },

  computed: {
    ...mapState('app', { appError: 'error' }),

    ...mapState('manga', [
      'inited', 'path', 'list', 'cover', 'folders', 
      'mangas', 'chapters', 'images', 'activePath', 
      'error', 'shortId'
    ]),

    ...mapState('manga', {
      metadata(state) {
        return state.metadata || {}
      }
    }),

    ...mapState('viewer', {
      viewerPath: 'path',
      viewerCh: 'ch'
    }),

    ...mapGetters('app', [ 'repo' ]),

    ...mapGetters('manga', [ 'isPending', 'isSuccess', 'noError', 'empty' ]),

    title() {
      const repoName = this.repo.name;
      const { path } = this.$route.params;
      const title = path ? 
        this.metadata.title || last(path.split(PATH_SEP)) : 
        repoName;
      
      return title;
    },

    breadcrumb() {
      const name = this.repo.name;
      const { path } = this.$route.params;
      const items = [{ name }];

      if (path) {
        const fragments = path.split('/');
        fragments.forEach((item, idx) => {
          // make path (the last ignore click)
          const path = idx < fragments.length - 1 ? 
            fragments.slice(0, idx + 1).join(PATH_SEP) : false;
          const data = { name: item, path };
          items.push(data);
        });
      }
      
      return items;
    },

    leftBtns() {
      return this.isManga ? [{
        icon: 'arrow-left',
        tip: 'back',
        click: this.handleBack
      }] : [{
        icon: 'bars',
        className: 'd-inline-block d-md-none',
        click: this.handleToggleSidebar
      }];
    },

    rightBtns() {
      return this.isManga ? [{
        icon: 'level-up-alt',
        tip: 'back to parent',
        click: this.handleBackToParent
      }] : null;
    },
    
    qrcodeValue() {
      const { host, port } = config;
      const { protocol } = window.location;
      // if (inElectron && process.env.NODE_ENV === 'development') {
      //   const { host, port, baseURL } = config;
      //   // when share the qrcode we need the real ip
  
      //   return href.replace('localhost', host); // replace real ip
      // } else {
      //   return `http://${host}:${port}/manga/share/${this.shortId}`
      // }
      return `${protocol}//${host}:${port}/s/${this.shortId}`
    },
  },

  watch: {
    $route(to, from) {
      if (from.name === 'viewer') {
        this.activeCh = this.viewerCh;
      }
    }
  },

  activated() {
    if (this.appError || (this.$route.meta.isBack && this.inited) || this.$router._reset) return;
    this.isShowTopTitle = false;
    this.isManga = this.$route.query.type === 'manga';
    this.isQrcodeShown = false;
    this.fetchMangas(this.$route.params.path);
  },

  beforeRouteUpdate(to, from, next) {
    const { isBack } = to.meta;
    if (!this.appError) {
      this.isShowTopTitle = false;
      this.isManga = to.query.type === 'manga';
      this.isQrcodeShown = false;
      to.meta.scrollPromise = this.fetchMangas(to.params.path, isBack);
    }
    
    next();
  },

  created() {
    this._prevScrollTop;
    window.addEventListener('scroll', this.handleScroll, false);
  },

  destroyed() {
    window.removeEventListener('scroll', this.handleScroll, false);
  },

  methods: {
    fetchMangas(path = '', isBack, random = false) {
      const { dirId } = this.repo;
      const payload = { path, dirId, isBack }
      return this.$store.dispatch(mangaTypes.LIST, payload).then(() => {
        if (this.isManga && !this.empty) this.changeBanner();
      })
    },

    toggleLocationCollapsed: debounce(function(scrollTop, prevScrollTop) {
      if (isUndef(prevScrollTop) || scrollTop > prevScrollTop) {
        this.isCollapsed = true;
      } else {
        this.isCollapsed = false;
      }
    }, 500, {
      maxWait: 1500,
      leading: true,
      trailing: false
    }),

    // events
    handleToggleSidebar($event) {
      this.$store.dispatch(appTypes.TOGGLE_SIDEBAR);
    },

    handleBack($event) {
     if (this.$router._routerHistory.length === 1) {
        const { dirId } = this.$router.history.current.params;
        this.$router.push({ name: 'explorer', params: { dirId } })
      } else {
        this.$router.go(-1);
      }
    },

    handleBackToParent($event) {
      const { dirId } = this.repo;
      const path = this.path.split(PATH_SEP).slice(0, -1).join(PATH_SEP);

      this.$router.navigate({
        name: 'explorer',
        params: { dirId, path }
      });
    },

    handleBackToTop($event) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    },

    handleBackToParent($event) {
      const { dirId } = this.repo;
      const path = this.path.split(PATH_SEP).slice(0, -1).join(PATH_SEP);

      this.$router.navigate({
        name: 'explorer',
        params: { dirId, path }
      });
    },

    handleBackToTop($event) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    },

    handleScroll($event) {
      const scrollTop = getScrollTop();

      // handle breadcrumb show or hide
      if (!this.isManga) {  
        if (scrollTop < 160) {
          this.isCollapsed = false;
        } else {
          this.toggleLocationCollapsed(scrollTop, this._prevScrollTop);
        }
      // handle mange title show or hide
      } else {
        const metaH = this.$refs.metadata.clientHeight - 48;
        this.isShowTopTitle = scrollTop >= metaH;
      }

      this._prevScrollTop = scrollTop;
    },

    handleNavigateBack($event) {
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

    handleViewManga($event, item, index = 0) {
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
      item.type === 'CHAPTER' && (this.activeCh = item.name)

      // sync state to viewer store
      if (shouldSyncState()) {
        this.$store.dispatch(viewerTypes.LOAD, {
          path: this.path,
          images: this.images,
          chapters: this.chapters
        });
      }
      
      this.$store.dispatch(viewerTypes.GO, { 
        page: index + 1, 
        ch: '' 
      });

      this.$router.push({
        name: 'viewer',
        params: { dirId, path, ch }
      });
    },

    handleViewGallery($event) {
      const y = this.$refs.metadata.clientHeight - 48;
      // fix ios metadata overwrite bug
      this.$refs.topbar.style.zIndex = 1031;
      setTimeout(() => {
        window.scrollTo({
          top: y,
          behavior: 'smooth'
        });
        this.$refs.topbar.style.zIndex = 1030;
      });
    },

    handleShareManga($event) {
      const payload = { url: window.location.href }
      this.$store.dispatch(mangaTypes.SHARE, payload).then(res => {
        this.isQrcodeShown = true;
      });      
    },

    changeBanner() {
      const img = new Image();
      const src = this.$service.image.makeSrc(this.cover);

      const changeCover = (img) => {
        const [ r, g, b ] = colorThief.getColor(img);
        const bg = `rgb(${r},${g},${b})`;
        const grayLevel = r * 0.299 + g * 0.587 + b * 0.114;

        clearTimeout(timer);

        this.$refs.banner.style.backgroundColor = bg;
        this.$refs.cover.src = src;
        this.isDarkerBg = grayLevel < 192;
      }

      const timer = setTimeout(() => {
        this.$refs.banner.style.backgroundColor = '';
        this.$refs.cover.src = '';
        this.isDarkerBg = false;
      }, 200);
      

      img.setAttribute('crossOrigin', '');
      img.src = src;

      if (img.complete) {
        changeCover(img);
      } else {
        img.onload = () => {
          changeCover(img);
        };
      }
    }
  }
}
</script>

<style lang="scss">
@import '../../assets/style/base';

.location {
  transition-duration: .3s;

  &.collapsed {
    transform: translateY(-100%);
  }
}

.main-explorer-container {
  min-height: calc(100vh - 5rem);
}

.area-header {
  margin: .5rem 0;
  font-size: 80%;
}

.folder-area .list-group,
.chapter-area .list-group {
  margin-left: -15px;
  margin-right: -15px;
  
  .list-group-item {
    text-decoration: none;
    border-radius: 0;
    border-width: .5px 0;
    cursor: pointer;

    @include media-breakpoint-up(md) {
      border-width: .5px;
    }
  }

  @include media-breakpoint-up(md) {
    margin-left: 0;
    margin-right: 0;
  }
}

.chapter-area .list-group {
  @include media-breakpoint-up(md) {
    margin: -.2rem;
    flex-direction: row;
    flex-wrap: wrap;
    align-items: flex-start;

    .list-group-item {
      width: 50%;
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
  
  .cover {
    border-radius: .5rem .5rem 0 0;

    &.adjust img[lazy="loaded"] {
      height: 100%;
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
    transform: translateY(-50%);
    top: 50%;
  }

  .caption {
    top: 100%;
  }
}

#metadata {
  height: 100vh;
  margin-top: -3rem;
  display: flex;
  overflow: hidden;
  position: sticky;
  top: 0;

  .metadata-inner {
    padding: 3rem 0;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
  }

  .metadata-banner {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    opacity: .85;
    transition: .2s linear;
  }

  .metadata-share {
    .metadata-share-inner {
      padding: 1rem 0;
      background: #fff;
      border-radius: .5rem;
      width: 100%;
      max-width: 360px;
      margin-bottom: 1rem;
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

      p {
        word-wrap: break-word;
        word-break:break-all;     
      }
    }

    .qr-code {
      //padding: .5rem .5rem .3rem .5rem;
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
    border-radius: .5rem;
    max-width: 50%;
    max-height: 50%;
  }

  .metadata-info {
    color: #999;

    > p {
      margin-bottom: .2rem;
    }

    margin-bottom: .5rem;
  }

  .metadata-title {
    font-size: 1.1rem;
    text-align: center;

    @include media-breakpoint-up(md) {
      font-size: 1.2rem;
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
      width: 33.3%;
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

    @include media-breakpoint-up(md) {
      > a {
        width: 4rem;
        height: 4rem;

        .svg-icon {
          width: 36px;
          height: 36px;
        }
      }
    }
  }
}

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