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
      <div class="tags" v-if="item.verNames">
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

    <div v-show="viewMode == 'grid'" class="caption">{{ item.name | stripVer }}</div>

    <div v-show="viewMode == 'list'" class="text-truncate">
      <icon :name="`file-${item.fileType || 'image'}`" size="18" />
      &nbsp; {{ item.name | stripVer }} 
      <span
        class="badge"
        v-for="ver in filterVers(item.verNames)"
        :key="ver"
      >{{ ver.toUpperCase() }}</span>
    </div>
  </div>
</template>

<script>

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
    }
  }
}
</script>

<style lang="scss" scoped>
@import '../../../../assets/style/base';
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

.badge {
  font-size: 70%;
  margin-left: 3px;
  padding: .3em .4em;
  font-weight: 400;
}
</style>