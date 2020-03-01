<template>
  <div 
    :class="{ 
      active: item.path === activePath, 
      'col-4 col-sm-3 col-xl-2': viewMode == 'grid' && item.placeholder == 1,
      'col-12 col-sm-6 col-xl-4': !latest && viewMode == 'grid' && item.placeholder == 2,
      'col-8 col-sm-6 col-xl-4': latest && viewMode == 'grid' && item.placeholder == 2,
      'area-item': viewMode == 'grid',
      'area-chapter-item': item.chapterSize,
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

      <div class="chapter-effects" v-if="item.chapterSize">
        <div></div>
        <div></div>
        <div></div>
      </div>

      <div class="cover-inner" 
        :class="{
          loading: item.cover
        }"
      >
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
    viewMode: String,
    activePath: String,
    latest: Boolean
  },

  methods: {
    chapters(size) {
      return new Array(Math.min(size, 5));
    },

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
.badge {
  font-size: 70%;
  margin-left: 3px;
  padding: .3em .4em;
  font-weight: 400;
}

.area-chapter-item {
  perspective: 1200px;

  .cover-inner {
    transform-origin: 0% 100%;
    transform: rotateY(-22deg);
  }
}

.chapter-effects {
  div {
    overflow: hidden;
    position: absolute;
    width: 100%;
    top: 0;
    bottom: 0;
    background: #fff;
    border: .5px solid #ccc;
    border-radius: .25rem;
    transform-origin: left center;

    &:nth-child(3) {
      top: 5px;
      bottom: 5px;
      transform: rotateY(-18deg);
    }

    &:nth-child(2) {
      top: 6px;
      bottom: 6px;
      transform: rotateY(-14deg);
    }

    &:nth-child(1) {
      background: #666;
      border-right-color: #999;
      right: -2px;
    }
  }
}
</style>