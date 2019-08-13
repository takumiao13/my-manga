<template>
  <div class="main-explorer">
    <div class="topbar">
      <navbar :class="{'no-shadow': breadcrumb.length > 1}" :title="title" :left-btns="leftBtns" />
      <breadcrumb
        :class="{ collapsed: isCollapsed }"
        v-show="breadcrumb.length > 1" 
        :navs="breadcrumb" 
        @navigate="handleNavigate" 
      />
    </div>    
    <data-view class="main-explorer-container" :loading="isPending" :empty="empty">
      <div class="row" v-show="isSuccess">

        <!-- META DATA -->
        <div v-if="metadata" id="metadata" class="col-12 col-sm-3">
          <div class="metadata-inner">
            <img class="cover" :src="makeSrc(path, metadata.cover)" />  
            <div class="description">
              {{ metadata.description }}
            </div>
          </div>
        </div>
        <!-- / META DATA -->

        <div class="col-12" :class="{ 'col-sm-9': metadata }">

          <!-- FOLDER AREA -->
          <div class="folder-area mb-4" v-show="folders.length">
            <p class="area-header">FOLDER</p>
            <div class="list-group">
              <router-link 
                class="list-group-item list-group-item-action folder-item" 
                v-for="item in folders" 
                :key="item.path"
                :to="{
                  name: 'explorer', 
                  params:{ path: item.path }
                }"
              >
                <icon name="folder" /> &nbsp; {{ item.name }}
              </router-link>
            </div>
          </div>
          <!-- / FOLDER AREA -->

          <!-- MANGA AREA -->
          <div class="manga-area mb-4" v-show="mangas.length">
            <p class="area-header">MANGA</p>
            <div class="row">
              <div 
                class="col-6 manga-item"
                :class="itemClass"           
                v-for="item in mangas" 
                :key="item.path"
              >

                <router-link 
                  class="cover"
                  :style="coverStyle(item)"
                  :to="{
                    name: 'explorer', 
                    params:{ path: item.path }
                  }"
                >
                  <img v-lazy="makeSrc(item.cover)" />
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
            <p class="area-header">GALLERY</p>
            <div class="row">
              <div class="col-6 gallery-item" 
                :class="itemClass"
                v-for="(item, index) in images" 
                :key="item.path">

                <div class="cover"
                  :style="coverStyle(item)"
                  @click="handleViewManga($event, item, index)">
                  <img v-lazy="makeSrc(item.path)" />
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
import { isUndef, last, debounce } from '@/helpers';
import config from '@/config';
import { types as appTypes } from '@/store/modules/app';
import { types as mangaTypes } from '@/store/modules/manga';
import { types as viewerTypes } from '@/store/modules/viewer';
import { mapState, mapGetters } from 'vuex';

const getScrollTop = () => {
  return window.pageYOffset || 
        document.documentElement.scrollTop || 
        document.body.scrollTop;
}

const PATH_SEP = '/';

export default {
  data() {
    return {
      activeCh: '',
      isCollapsed: false,
      leftBtns: [{
        icon: 'bars',
        className: 'd-inline-block d-md-none',
        click: this.handleToggleSidebar
      }]
    }
  },

  computed: {
    ...mapGetters('manga', [ 'isPending', 'isSuccess', 'empty' ]),

    ...mapGetters('settings/user', [ 'repoName' ]),
    
    ...mapState('manga', [
      'path', 'metadata', 'list', 'folders', 'mangas', 'chapters', 'images'
    ]),

    ...mapState('viewer', {
      viewerPath: 'path',
      viewerCh: 'ch'
    }),

    title() {
      const title = this.repoName;
      const { path } = this.$route.params;
      return path ? last(path.split(PATH_SEP)) : title;
    },

    breadcrumb() {
      const name = this.repoName;
      const { path } = this.$route.params;
      const items = [{ name }];

      if (path) {
        const fragments = path.split('/');
        fragments.forEach((item, idx) => {
          const path = fragments.slice(0, idx + 1).join(PATH_SEP);
          const data = { name: item, path };
          items.push(data);
        });
      }

      return items;
    },

    itemClass() {
      return {
        'col-sm-3 col-xl-2': !this.metadata,
        'col-sm-4 col-xl-3': this.metadata
      }
    }
  },

  watch: {
    $route(to, from) {
      if (from.name === 'viewer') {
        this.activeCh = this.viewerCh;
      }
    }
  },

  activated() {
    if (!this.$route.meta.isBack) {
      this.fetchMangas(this.$route.params.path);
    }
  },

  beforeRouteUpdate(to, from, next) {
    to.meta.scrollPromise = this.fetchMangas(to.params.path);
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
    fetchMangas(path = '') {
      return this.$store.dispatch(mangaTypes.LIST, { path })
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

    coverStyle(item) {
      const ratio = Math.min((item.height / item.width) * 100, 141.4);
      return { padding:'0 0 ' + ratio + '%' }
    },

    makeSrc(...paths) {
      const path = paths.join(PATH_SEP);
      return path && `${config.baseURL}img/${encodeURIComponent(path)}`;
    },

    // events
    handleToggleSidebar($event) {
      this.$store.dispatch(appTypes.TOGGLE_SIDEBAR);
    },

    handleScroll($event) {
      const scrollTop = getScrollTop();
      if (scrollTop < 160) {
        this.isCollapsed = false;
      } else {
        this.toggleLocationCollapsed(scrollTop, this._prevScrollTop);
      }
      this._prevScrollTop = scrollTop;
    },

    handleNavigate($event, location) {
      const { path } = location;
      if (path === false) return;

      this.$router.navigate({
        name: 'explorer',
        params: { path }
      });
    },

    handleViewManga($event, item, index = 0) {
      const { path } = this.$route.params;
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
        params: { path, ch }
      });
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
  min-height: calc(100vh - 4.8rem);
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
    flex-direction: row;
    flex-wrap: wrap;
    align-items: flex-start;

    .list-group-item {
      width: 50%;
      margin-left: -.5px;
    }
  }

  @include media-breakpoint-up(lg) {
    .list-group-item {
      width: 33.3%;
    }
  }
}

.manga-area,
.gallery-area {

  > .row {
    padding: 1rem .5rem;
    border-width: .5px 0;
    border-style: solid;

    @include media-breakpoint-up(md) {
      margin-left: 0;
      margin-right: 0;
      border-width: .5px;
    }
  }
  
  .manga-item,
  .gallery-item {
    padding-left: .5rem;
    padding-right: .5rem;
    margin-bottom: 5rem;
  }

  .cover {
    padding: 0 0 141.4%; // default size
    text-decoration: none;
    display: block;
    position: relative;
    overflow: hidden;
    transform: translateY(-50%);
    top: 50%;

    img {
      position: absolute;
      width: 100%;
      height: 100%;
      display: block;
    }

    img[lazy="loaded"] {
      background: none;
      height: auto;
      border: 0;
    }
  }

  .caption {
    left: 0;
    right: 0;
    top: 100%;
    position: absolute;
    overflow: hidden;
    width: 100%;
    max-height: 3rem;
    padding: .3rem .5rem;
    display: block;
    text-align: center;
    font-size: .85rem;
  }

  .manga-item {
    .caption {
      font-weight: 700;
      text-align: left;
    }
  }
}

#metadata {
  position: relative;
  height: auto;
  top: auto;
  margin-bottom: 0;
  display: flex;

  @include media-breakpoint-up(md) {
    @supports (position: sticky) {
      position: sticky;
      top: 4.8rem;
      height: calc(100vh - 4.8rem);
    }
  }

  .metadata-inner {
    display: flex;
    align-items: flex-start;
    padding-top: 15px;
    padding-bottom: 15px;
    
    @include media-breakpoint-up(md) {
      flex-direction: column;
      align-items: center;
      padding-left: 15px;
      padding-top: 30px;
    }
  } 

  .cover {
    width: 140px;
    display: block;
    border-radius: .25rem;
    margin: 0 1rem 0 0;

    @include media-breakpoint-up(md) {
      width: auto;
      max-width: 100%;
      font-size: 100%;
      margin: 0 0 1rem 0;
    }
  }

  .description {
    font-size: 80%;
    text-indent: 1rem;

    @include media-breakpoint-up(md) {  
      line-height: 1.6;
    }
  }
}

</style>