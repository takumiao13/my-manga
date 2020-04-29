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

    <!-- TITLE -->
    <div class="metadata-main metadata-inner" v-show="!sharing">

      <p class="metadata-title" href="javascript:void 0;">
        {{ title }}
        <span v-if="isEnd" class="manga-status">[Completed]</span>
      </p>

    </div>

    <!-- VERSION -->
    <div 
      class="version-area mb-2" 
      :class="{ touch: $feature.touch}" 
      v-show="versions.length"
    >
      <div class="area-header">
        <div class="area-header-inner">
          VERSIONS - {{ versions.length }}
        </div>
      </div>

      <div class="list-group pb-2">
        <a 
          class="list-group-item list-group-item-action version-item text-truncate"
          :class="{ 'version-active': item.ver === activeVer }"
          v-for="item in versions" 
          :key="item.path"
          @click="toggleVersion(item)"
        >
          {{ (item.ver || item.name).toUpperCase() }} 
        </a>
      </div>
    </div>
    <!-- / VERSION AREA -->
  </div>  
</template>

<script>
import { mapState, mapGetters } from 'vuex';

export default {
  props: {
    title: String,
    sharing: Boolean
  },

  computed: {
    ...mapGetters('app', [ 'repo' ]),

    ...mapState('manga', [ 'path', 'versions', 'metadata', 'shortId', 'activeVer' ]),

    qrcodeValue() {
      const { HOST, PORT } = this.$config.api;
      const protocol = this.$platform.isElectron() ? 'http:' : window.location.protocol;
      return `${protocol}//${HOST}:${PORT}/s/${this.shortId}`
    },

    isEnd() {
      const m = this.metadata;
      return m && m.status === 'completed'
    }
  },

  methods: {
    toggleVersion(item) {
      const { ver } = item;
      const { dirId } = this.repo;
      
      if (ver === this.activeVer) return;
  
      this.$router.replace({
        name: 'explorer', 
        params: { dirId, path: this.path },
        query: { ver, type: 'manga' }
      });
    },
  }
}
</script>

<style lang="scss" scoped>
@import '../../../../assets/style/base';

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
    max-height: 240px;
  }

  .metadata-title {
    margin: 1rem 0 .5rem 0;
    font-size: 1.2rem;
    text-align: center;
    font-weight: 200;
    text-decoration: none;
    word-break: break-all;

    @include media-breakpoint-up(md) {
      font-size: 1.6rem;
      text-align: left;
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

// TODO: need extract color later
.manga-status {
  color: red;
}
</style>