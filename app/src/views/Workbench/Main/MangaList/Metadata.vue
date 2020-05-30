<template>
  <div id="metadata" ref="root">

    <!-- SHARE -->
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
      <div class="metadata-info" 
        :class="{ 'with-banner': banner }"
      >
        <img v-if="cover" :src="$service.image.makeSrc(cover)" />
        <div>
          <p class="title">{{ title }}</p>
          <div v-if="versions.length" class="text-muted">
            Versions: 
            <select v-model="activeVer">
              <option 
                v-for="item in versions" 
                :key="item.path"
                :value="item.ver"
              >
                {{ (item.ver || item.name).toUpperCase() }}
              </option>
            </select>
          </div>
          <div v-if="metadata && metadata.status" class="text-muted">
            Status:
            <span v-if="completed" class="manga-status">Completed</span>
            <span v-if="status && !completed">
              # {{ status }}
            </span>
          </div>
          <div v-else-if="fileType" class="text-muted">Type: {{ fileType }}</div>
          <div v-else-if="chapters.length" class="text-muted">Chapters: {{ chapters.length }}</div>
          <div v-else class="text-muted">Pages: <span>{{ images.length }}</span></div>
          <div class="text-muted">Updated at: <small>{{ birthtime | dateFormat('yyyy-mm-dd') }}</small></div>        
        </div>
      </div>
    </div>
    
    <div class="metadata-actions row d-flex">      
      <a class="col" @click="handleRead">
        <icon :name="fileType === 'video' ? 'play' : 'book-open'" /> 
        Start {{ fileType === 'video' ? 'Watching' : 'Reading' }}
      </a>
    </div>
  </div>  
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import qs from '@/helpers/querystring';

export default {
  props: {
    title: String,
    sharing: Boolean
  },

  computed: {
    ...mapGetters('app', [ 'repo' ]),

    ...mapState('manga', [ 
      'path', 'versions', 'metadata', 'shortId', 'fileType',
      'cover', 'banner', 'birthtime', 'files', 'chapters', 'images',
    ]),

    activeVer: {
      set(value) {
        this.toggleVersion({ ver: value });
        //this.$store.dispatch('updateMessage', value);
      },
      get() {
        return this.$store.state.manga.activeVer
      }
    },

    qrcodeValue() {
      const { HOST, PORT } = this.$config.api;
      const protocol = this.$platform.isElectron() ? 'http:' : window.location.protocol;
      return `${protocol}//${HOST}:${PORT}/s/${this.shortId}`
    },

    status() {
      if (!this.metadata) return false;
      return this.metadata.status; 
    },

    completed() {
      return this.status && this.status === 'completed';
    }
  },

  methods: {
    toggleVersion(item) {
      const { ver } = item;
      const { dirId } = this.repo;
      
      if (ver === this.activeVer) return;
  
      this.$router.replace({
        name: 'explorer', 
        params: { dirId, path: qs.encode(this.path) },
        query: { ver, type: 'manga' }
      });
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
    height: 220px;
    align-items: center;
    border-bottom: .5px solid #dedede;
    padding-left: 15px;
    padding-right: 15px;
    font-size: 14px;
    background: #fff;

    img {
      width: auto !important;
      height: auto !important;
      max-width: 50%;
      max-height: 180px;
      margin-right: 1rem;
    }

    > div {
      flex: 1;

      .title {
        font-size: 1.2rem;
      }

      div {
        margin-bottom: .25rem;
      }
    }

    @include media-breakpoint-up(sm) {
      height: 280px;

      img {
        max-height: 240px;
        margin-right: 1.5rem;
      }

      > div {

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
      height: 320px;

      img {
        max-height: 280px;
        margin-right: 1.5rem;
      }

      > div {

        .title {
          font-size: 1.4rem;
        }

        div {
          margin-bottom: .3rem;
        }
      }
    }

    @include media-breakpoint-up(lg) {
      height: 340px;

      img {
        max-height: 280px;
        margin-right: 2rem;
      }

      > div {
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
}

// Version
// ==
.version-area.touch .list-group {
  overflow-x: scroll;
  flex-wrap: nowrap;
}

.version-area .list-group {
  margin: 0 -.2rem;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: flex-start;

  .list-group-item {
    margin: .2rem;
    padding: .5rem 1rem;
    border-width: .5px;
    width: calc(33.3% - .4rem);
    flex-shrink: 0;
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
  border-left: 4px solid #eee !important;

  &:not(.version-active) {
    cursor: pointer;
  }
  
  &.version-active {
    border-left-color: $primary !important;
  }
}
</style>