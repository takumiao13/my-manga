<template>
  <div id="metadata" ref="root">

    <!-- SHARE (hidden now) -->
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

    <!-- COVER AND INFO -->
    <div class="metadata-main metadata-inner" v-show="!sharing">
      
      <!-- only hide in sm sreen when banner exists -->
      <div :class="['metadata-info', { 'with-banner': banner }]">
        <!-- cover -->
        <div 
          :class="[
            'metadata-cover',
            `cover-size-${placeholder}`
          ]"
        >
          <MangaItem 
            :item="$store.state.manga" 
            :caption="false"
            :tags="false"
          />
        </div>

        <!-- detail -->
        <div class="metadata-detail">
          <p class="title">{{ title }}</p>

          <!-- versions -->
          <div v-if="versions.length" class="text-muted">
            Versions: {{ activeVer }}     
          </div>

          <!-- status -->
          <div v-if="metadata && metadata.status" class="text-muted">
            Status:
            <span v-if="completed" class="manga-status">Completed</span>
            <span v-if="status && !completed"># {{ status }}</span>
          </div>

          <!-- type -->
          <div v-else-if="fileType" class="text-muted">Type: {{ fileType }}</div>
          <div v-else-if="chapters.length" class="text-muted">Chapters: {{ chapters.length }}</div>
          <div v-else class="text-muted">Pages: <span>{{ images.length }}</span></div>

          <!-- update time -->
          <div class="text-muted">Updated at: <small>{{ birthtime | dateFormat('yyyy-mm-dd') }}</small></div>        
        </div>
      </div>
    </div>
    
    <!-- ACTIONS -->
    <div class="metadata-actions row d-flex">
      <a class="col" @click="handleRead">
        <icon :name="fileType === 'video' ? 'play' : 'book-open'" /> 
        Start {{ fileType === 'video' ? 'Watching' : 'Reading' }}
      </a>
    </div>

    <!-- VERSIONS -->
    <div 
      class="metadata-versions mb-2" 
      :class="{ touch: $feature.touch}" 
      v-show="versions.length"
    >
      <div class="area-header">
        <div class="area-header-inner">
          VERSIONS - {{ versions.length }}

          <div class="actions float-right">
            <a @click="toggleAllVersionsVisible">
              <Icon :name="`chevron-${allVersionsVisible ? 'up' : 'down'}`" size="18" />
            </a>
          </div>
        </div>
      </div>

      <div class="list-group" :class="{ collapse: !allVersionsVisible }">
        <a 
          class="list-group-item list-group-item-action version-item text-truncate"
          :class="{ 'version-active': item.ver === activeVer }"
          v-for="item in versions" 
          :key="item.path"
          @click="changeVersion(item)"
        >
          {{ (item.ver || item.name).toUpperCase() }} 
        </a>
      </div>
    </div>
  </div>  
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import qs from '@/helpers/querystring';
import MangaItem from './MangaItem';

export default {

  components: {
    MangaItem
  },

  props: {
    title: String,
    sharing: Boolean
  },

  data() {
    return {
      allVersionsVisible: false
    }
  },

  computed: {
    ...mapGetters('app', [ 'repo' ]),

    ...mapState('manga', [ 
      'path', 'versions', 'metadata', 'shortId', 'fileType', 'placeholder',
      'cover', 'banner', 'birthtime', 'files', 'chapters', 'images', 'activeVer'
    ]),

    status() {
      if (!this.metadata) return false;
      return this.metadata.status; 
    },

    completed() {
      return this.status && this.status === 'completed';
    },

    qrcodeValue() {
      const { HOST, PORT } = this.$config.api;
      const protocol = this.$platform.isElectron() ? 'http:' : window.location.protocol;
      return `${protocol}//${HOST}:${PORT}/s/${this.shortId}`
    }
  },

  methods: {
    changeVersion(item) {
      const { ver } = item;
      const { dirId } = this.repo;
      
      if (ver === this.activeVer) return;
  
      this.$router.replace({
        name: 'explorer', 
        params: { dirId, path: qs.encode(this.path) },
        query: { ver, type: 'manga' }
      });
    },

    toggleAllVersionsVisible() {
      this.allVersionsVisible = !this.allVersionsVisible;
    },

    handleRead() {
      let item;

      if (this.fileType) {
        item = this.files[0];
        this.$emit('read-file', item);
      } else {
        if (this.chapters.length) {
          item = this.chapters[0]
        } else {
          item = this.images[0];
        }
        this.$emit('read-manga', item);
      }
    }
  }
}
</script>

<style lang="scss" scoped>
@import '../../../../assets/style/base';

#metadata {
  margin-left: -15px;
  margin-right: -15px;
  @include media-breakpoint-up(md) {
    margin-left: 0;
    margin-right: 0;
  }
}

.metadata-inner {
  display: flex;
  flex-direction: column;
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

.metadata-info {
  display: flex;
  align-items: center;
  border-bottom: .5px solid #dedede;
  padding: 15px;
  font-size: 14px;
  background: #fff;

  > .metadata-cover {
    width: 40%;
    min-width: 120px;
    max-width: 50%;
    margin-right: 1.2rem;
  }

  > .metadata-detail {

    .title {
      font-size: 1.2rem;
    }

    div {
      margin-bottom: .25rem;
    }
  }

  @include media-breakpoint-up(sm) {
    padding-top: 20px;
    padding-bottom: 20px;

    > .metadata-cover {
      width: 25%;
      max-width: 25%;
      margin-right: 1.5rem;

      &.cover-size-2 {
        width: 35%;
        max-width: 35%;
      }
    }

    > .metadata-detail {

      .title {
        font-size: 1.4rem;
      }

      div {
        margin-bottom: .3rem;
      }
    }
  }

  @include media-breakpoint-up(md) {
    background: none;
    padding-top: 30px;
    padding-bottom: 30px;
    padding-left: 0;
    padding-right: 0;

    > .metadata-cover {
      width: 25%;
      max-width: 25%;
      margin-right: 1.5rem;

      &.cover-size-2 {
        width: 35%;
        max-width: 35%;
      }
    }

    > .metadata-detail {

      .title {
        font-size: 1.4rem;
      }

      div {
        margin-bottom: .3rem;
      }
    }
  }

  @include media-breakpoint-up(lg) {
    padding-top: 40px;
    padding-bottom: 40px;

    > .metadata-cover {
      width: 16.6%;
      max-width: 16.6%;
      margin-right: 2rem;

      &.cover-size-2 {
        width: 25%;
        max-width: 25%;
      }
    }

    > .metadata-detail {
      .title {
        font-size: 1.6rem;
      }

      div {
        margin-bottom: .4rem;
      }
    }
  }
}

.metadata-actions {
  padding: .75rem 15px;
  margin: 0;
  border-bottom: .5px solid #dedede;
  color: #999;
  background: #fff;

  a {
    font-size: 1.1rem;
    text-align: center;
    cursor: pointer;
    padding: 0 .25rem;
  }

  a + a {
    border-left: .5px solid #dedede;
  }

  .svg-icon {
    width: 20px;
    height: 20px;
    vertical-align: -0.15em;
    margin-right: .25rem;
  }

  @include media-breakpoint-up(md) {
    background: none;
  }
}

.metadata-title {
  margin: 1.5rem 0 1rem 0;
  font-size: 1.2rem;
  font-weight: 300;
  text-align: left;
  text-decoration: none;
  word-break: break-all;

  @include media-breakpoint-up(sm) {
    font-size: 1.6rem;
  }

  @include media-breakpoint-up(md) {
    font-size: 1.8rem;
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

// Version
// ==
.metadata-versions {
  margin-top: .4rem;
  padding-left: 15px;
  padding-right: 15px;

  @include media-breakpoint-up(md) {
    padding-left: 0;
    padding-right: 0;
  }
}

// .metadata-versions.touch .list-group {
//   overflow-x: scroll;
//   flex-wrap: nowrap;
// }

.metadata-versions .list-group {
  margin: 0 -.2rem;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: flex-start;

  &.collapse {
    height: 47.38px;
    display: flex !important;
    overflow: hidden;
  }

  .list-group-item {
    margin: .2rem;
    padding: .5rem 1rem;
    border-width: .5px;
    width: calc(33.3% - .4rem);
    flex-shrink: 0;
  }

  @include media-breakpoint-up(lg) {
    .list-group-item {
      width: calc(25% - .4rem);
    }
  }
}

.metadata-versions .list-group-item {
  border-left: 3px solid #ddd !important;

  &:not(.version-active) {
    cursor: pointer;
  }
  
  // TODO:
  &.version-active {
    border-left-color: $primary !important;
    color: $primary !important;
    font-weight: 500;
  }
}
</style>