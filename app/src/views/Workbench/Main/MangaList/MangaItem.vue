<template>
  <div class="manga-item">
    <a
      v-show="viewMode == 'grid'"
      class="cover"
      :title="showPath ? item.path : undefined"
      v-bind="$service.image.coverStyle(item)"
      @click="$emit('item-click')"
    >
      <div
        v-if="versionLabelsVisible && item.verNames"
        class="manga-version-labels" 
        :class="{ 'manga-version-labels-lg': !latest && item.placeholder == 2 }"
      >
        <ul>
          <li 
            v-for="ver in filterVers(item.verNames)"
            :key="ver"
          >
            {{ ver | verName }}
          </li>
        </ul>
      </div>

      <div class="cover-inner" :class="{ loading: item.cover }">
        <img 
          v-if="item.cover" 
          class="cover-image" 
          v-lazy="$service.image.makeSrc({
            path: item.cover,
            width: item.width,
            height: item.height,
            thumb: true
          })"
        />
        <div v-else class="cover-placeholder">
          <Icon :name="`file-${item.fileType || 'image'}`" />
        </div>
      </div>

      <div v-if="playLogo" class="play-logo">
        <div class="play-logo-circle">
          <Icon :name="item.fileType === 'video' ? 'play' : 'book-open'" />
        </div>
      </div>
    </a>

    <div 
      v-show="viewMode == 'grid' && caption" 
      class="caption" 
      :class="{ 'with-status': status }"
    >
      <div>{{ item.name | stripVer }}</div>

      <small v-if="completed" class="manga-status">[Completed]</small>
      <small v-if="status && !completed" class="manga-status text-muted">
        Chapter {{ status }}
      </small>
    </div>
    
    <div v-show="viewMode == 'list'" class="manga-row" @click="$emit('item-click')">
      <div v-if="status" class="manga-status"></div>
      <div class="manga-row-left">
        <Icon :name="`file-${item.fileType || 'image'}`" />
      </div>
      <div class="manga-row-main">
        <div class="manga-name">
          <!-- show latest chapter -->
          <small v-if="completed" class="manga-status">
            Completed
          </small>
          <small class="manga-status text-muted" v-if="status && !completed">
            # {{ status }}
          </small>

          <!-- manga name -->
          <span v-if="item.verNames">
            {{ item.name | stripVer }}
          </span>
          <span v-else>
            {{ item.name }}
          </span>
        </div>
        <div class="manga-time text-muted">
          {{ item.birthtime | dateFormat }}
        </div>
        <div class="manga-versons">
          <span
            class="badge"
            v-for="ver in filterVers(item.verNames)"
            :key="ver"
          >{{ ver.toUpperCase() }}</span>
        </div>
        <div class="manga-path" v-show="showPath">
          <small>path : {{ item.path }}</small>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    showPath: {
      type: Boolean,
      dateFormat: false
    },
    item: Object,
    viewMode: {
      type: String,
      default: 'grid'
    },
    activePath: String,
    latest: Boolean,
    versionLabelsVisible: {
      type: Boolean,
      default: true
    },
    caption: {
      type: Boolean,
      default: true
    },
    playLogo: {
      type: Boolean,
      default: true
    }
  },

  computed: {
    status() {
      if (!this.item.metadata) return false;
      return this.item.metadata.status; 
    },

    completed() {
      return this.status && this.status === 'completed';
    }
  },

  methods: {
    filterVers(vers) {
      return vers && vers
        .filter(item => item !== 'default')
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/assets/style/base';
  
.caption {
  text-align: left;
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

// ...
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

  .cover-inner {
    cursor: pointer;
    overflow: hidden;
    position: absolute;
    width: 100%;
    height: 100%;
    z-index: 1;
    border-radius: .25rem;

    &.loading::before {
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      background: #999;
      opacity: 0;
      -webkit-animation: progress-active 2s cubic-bezier(.23, 1, .32, 1) infinite;
      animation: progress-active 2s cubic-bezier(.23, 1, .32, 1) infinite;
      z-index: 4;
      content: '';
    }
  }

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
    width: 100% !important;
    height: auto !important;
  }

  &.fitH img[lazy="loaded"] {
    height: 100% !important;
    width: auto !important;
  }
}


.cover-placeholder,
.play-logo {
  position: absolute;
  width: 100%;
  height: 100%;
  justify-content: center;
  align-items: center;
  display: flex;
}

.play-logo {
  z-index: -1;
  .play-logo-circle {
    width: 25%;
    padding: 0 0 25%;
    background: rgba(#fff, .8);
    border-radius: 100%;
    position: relative;

    .svg-icon {
      color: #666;
      width: 50%;
      height: auto;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translateX(-50%) translateY(-50%);
      text-align: center;
    }
  }
}

.cover-placeholder {
  z-index: 2;
  .svg-icon {
    width: auto;
    height: 35%;
  }
}

.cover:hover {
  .play-logo {
    z-index: 3
  }
}

.manga-status {
  font-weight: normal;
}

.manga-name .manga-status {
  float: right;
  margin-top: .25rem;
}

.manga-version-labels {
  position: absolute;
  bottom: .5rem;
  right: -3px;
  z-index: 2;

  &.manga-version-labels-lg {
    li {
      padding: 3px 13px 5px 10px;
      font-size: 70%;

      &::after {
        border-right-width: 3px;
      }
    } 
  }

  ul {
    list-style: none;
    padding: 0px;
    margin: 0px;
    box-shadow: 0px 0px 2px #ddd;   
  }

  li {
    display: block;
    right: 0px;
    padding: 2px 8px 2px 6px;
    font-size: 60%;
    overflow: hidden;

    &::after {
      content: "";
      position: absolute;
      top: 0px;
      right: 0px;
      height: 100%;
    }
  }

  @include media-breakpoint-up(sm) {
    li {
      padding: 3px 13px 5px 10px;
      font-size: 70%;

      &::after {
        border-right-width: 3px;
      }
    }
  }

  > ul > li:last-child {
    border-bottom: 0;
  }
}

.badge {
  font-size: 60%;
  margin-right: 3px;
  padding: .3em .4em;
  font-weight: 400;
}

.manga-row {
  display: flex;

  > .manga-row-left{
    .svg-icon {
      margin-left: -.25rem;
      margin-top: .5rem;
      width: 24px;
      height: 24px;
    }
  }

  > .manga-row-main {
    display: flex;
    flex-direction: column;
    flex: 0 1 100%;
    max-width: 100%;
    min-width: 0; // !! fix text-truncate expand outer width
    padding-left: .5rem;
  }

  .manga-name,
  .manga-versons,
  .manga-time {
    display: block;
  }

  .manga-name {
    @include text-truncate;
  }

  .manga-time {
    font-size: 80%;
  }

  @include media-breakpoint-up(lg) {
    > .manga-row-left {
      .svg-icon {
        margin-top: .25rem;
        padding-right: 0;
        width: 18px;
        height: 18px;
      }
    }

    > .manga-row-main {
      flex-direction: row;
    }

    .manga-path {
      display: none;
    }

    .manga-name,
    .manga-versons,
    .manga-time {
      display: block;
      padding: 0 .25rem;
    }

    .manga-name {
      flex: 0 1 70%;
      max-width: 70%;
      order: 1;
    }

    // when too many need ...
    .manga-versons {
      flex: 0 1 30%;
      max-width: 30%;
      order: 2;
      @include text-truncate;
    }

    .manga-time {
      text-align: right;
      min-width: 150px;
      font-size: 90%;
      order: 3;
    }
  }
}
</style>