<template>
  <div 
    :class="{ 
      active: item.path === activePath, 
      'col-4 col-sm-3 col-xl-2': viewMode == 'grid' && item.placeholder == 1,
      'col-12 col-sm-6 col-xl-4': !latest && viewMode == 'grid' && item.placeholder == 2,
      'col-8 col-sm-6 col-xl-4': latest && viewMode == 'grid' && item.placeholder == 2,
      'area-item': viewMode == 'grid',
      'list-group-item list-group-item-action': viewMode == 'list'
    }"
  >
    <a 
      v-show="viewMode == 'grid'"
      class="cover"
      v-bind="$service.image.coverStyle(item)"
    >
      <div v-if="status" class="manga-status">
        End
      </div>

      <div 
        class="tags" 
        :class="{ 'tags-lg': !latest && item.placeholder == 2 }"
        v-if="item.verNames"
      >
        <ul>
          <li 
            v-for="ver in filterVers(item.verNames)"
            :key="ver"
          >
            {{ ver.toUpperCase() }}
          </li>
        </ul>
      </div>

      <div class="cover-inner" :class="{ loading: item.cover }">
        <img v-if="item.cover" class="cover-image" v-lazy="$service.image.makeSrc(item.cover)" />
        <div v-else class="cover-placeholder">
          <icon :name="`file-${item.fileType || 'image'}`" size="64" />
        </div>
      </div>
    </a>

    <div v-show="viewMode == 'grid'" class="caption">
      {{ item.name | stripVer }}
    </div>

    <div v-show="viewMode == 'list'" class="manga-row">
      <div v-if="status" class="manga-status"></div>
      <div class="manga-row-left">
        <icon :name="`file-${item.fileType || 'image'}`" />
      </div>
      <div class="manga-row-main">
        <div class="manga-name">
          {{ item.name | stripVer }}
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
      </div>
    </div>
  </div>
</template>

<script>

import date from '@/helpers/date';

export default {
  props: {
    item: Object,
    viewMode: {
      type: String,
      default: 'grid'
    },
    activePath: String,
    latest: Boolean
  },

  computed: {
    status() {
      if (!this.item.metadata) return false;
      return this.item.metadata.status === 'completed';  
    }
  },

  methods: {
    filterVers(vers) {
      return vers && vers
        .filter(item => item !== 'default')
        .map(item => {
          const parts = item.split('.');
          return parts[1] || parts[0];
        });
    }
  },

  filters: {
    stripVer(value) {
      const striped = value.replace(/(?:\s\[[^\]]*?\]){0,}/g, '');
      return striped
    },

    dateFormat(value) {
      return date.format(new Date(value), 'yyyy-mm-dd HH:MM');
    }
  }
}
</script>

<style lang="scss" scoped>
@import '../../../../assets/style/base';

$status-color: #ffc107;

.area-item {
  flex-grow: 1;
}

.cover-inner {
  cursor: pointer;
  overflow: hidden;
  position: absolute;
  width: 100%;
  height: 100%;
  z-index: 1;
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
    z-index: 1;
    content: '';
  }
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

.caption {
  font-weight: 600;
  text-align: left;
}

// TODO: need extract color later
.manga-status {
  position: absolute;
  top: 6px;
  left: 0;
  z-index: 2;
  background: $status-color;
  padding: 0 6px 0 6px;
  color: #fff;
  font-size: 60%;
  border-radius: 0 .25rem .25rem 0;
  border: 1px solid #fff;
  border-left: 0;

  @include media-breakpoint-up(sm) {
    font-size: 80%;
  }
}

// TODO: should rename `.tags` -> `version-labels` ??
.tags {
  position: absolute;
  bottom: .5rem;
  right: -3px;
  z-index: 2;

  ul {
    list-style: none;
    padding: 0px;
    margin: 0px;
    box-shadow: 0px 0px 2px #ddd;   
  }

  li {
    display: block;
    right: 0px;
    color: #fff;
    padding: 2px 8px 2px 6px;
    font-size: 60%;
    background-color: #333;
    border-bottom: .5px solid #666;
    overflow: hidden;

    &::after {
      content:"";
      position: absolute;
      top: 0px;
      right: 0px;
      height: 100%;
      border-right: 2px solid $primary;
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

  > ul > li:hover { 
    background-color: $primary; 
  }
}

.tags.tags-lg {
  li {
    padding: 3px 13px 5px 10px;
    font-size: 70%;

    &::after {
      border-right-width: 3px;
    }
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

  .manga-status {
    padding: 0;
    width: .25rem;
    top: .5rem;
    bottom: .5rem;
  }

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
      min-width: 140px;
      font-size: 90%;
      order: 3;
    }
  }
}
</style>