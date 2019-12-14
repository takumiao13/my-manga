<template>
  <div 
    :class="{ 
      active: item.path === activePath, 
      'col-4 col-sm-3 col-xl-2': viewMode == 'grid' && (!item.cover || !item.width || (item.height > item.width)),
      'col-12 col-sm-6 col-xl-4': viewMode == 'grid' && (item.height <= item.width),
      'area-item': viewMode == 'grid',
      'list-group-item list-group-item-action': viewMode == 'list'
    }"
  >
    <a 
      class="cover"
      v-show="viewMode == 'grid'"
      v-bind="$service.image.coverStyle(item)"
    >
      <div class="cover-placeholder">
        <icon :name="`file-${item.fileType || 'image'}`" size="64" />
      </div>
      <img v-if="item.cover" v-lazy="$service.image.makeSrc(item.cover)" />
    </a>

    <div v-show="viewMode == 'grid'" class="caption">{{ item.name }}</div>

    <div v-show="viewMode == 'list'" class="text-truncate">
      <icon name="file-image" size="18" />
      &nbsp; {{ item.name }} 
    </div>

    <!-- <div style="border: 1px solid red;">{{ item.name }}</div> -->

  </div>
</template>

<script>

export default {
  props: {
    activePath: String,
    item: Object,
    viewMode: String
  },

  methods: {
    isViewMode(type) {
      return this.viewMode === type;
    }
  }
}
</script>

<style>

</style>