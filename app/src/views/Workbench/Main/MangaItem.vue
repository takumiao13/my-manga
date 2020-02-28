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
      <div class="tags" v-if="item.version">
        <ul>
          <li 
            v-for="ver in item.version
              .filter(item => item !== 'default')
              .map(item => {
                const parts = item.split('.');
                return parts[1] || parts[0];
              })" 
            :key="ver"
          >
            {{ ver.toUpperCase() }}
          </li>
        </ul>
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

    <div v-show="viewMode == 'grid'" class="caption">{{ item.name }}</div>

    <div v-show="viewMode == 'list'" class="text-truncate">
      <icon name="file-image" size="18" />
      &nbsp; {{ item.name }} 
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
  }
}
</script>

<style>

</style>