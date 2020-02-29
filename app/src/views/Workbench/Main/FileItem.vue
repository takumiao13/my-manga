<template>
  <div 
    :class="{ 
      active: item.path === activePath, 
      'col-4 col-sm-3 col-lg-2 area-item': viewMode == 'grid',
      'list-group-item list-group-item-action': viewMode == 'list'
    }"
  >
    <div v-show="viewMode == 'grid'" class="area-item-inner">
      <div>
        <icon :name="icon" size="64" style="color: #bbb;" />
      </div>
    </div>
    
    <div v-show="viewMode == 'grid'" class="caption">
      {{ item.name }}
    </div>

    <div v-show="viewMode == 'list'" class="text-truncate">
      <icon :name="icon" size="18" />
      &nbsp; {{ item.name }} 
    </div>
  </div>
</template>

<script>
export default {
  props: {
    activePath: String,
    item: Object,
    viewMode: String
  },

  computed: {
    icon() {
      return this.item.fileType ? `file-${this.item.fileType}` : 'folder';
    }
  }
}
</script>

<style>

</style>