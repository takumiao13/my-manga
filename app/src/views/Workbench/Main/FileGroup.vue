<template>
  <div class="folder-area mb-4">
    <div class="area-header">
      <div class="actions float-right">
      <icon 
        v-if="viewMode == 'grid'"
        name="th"
        size="18"
        @click.native="$emit('viewModeChange', 'list')"
      />
      <icon 
        v-else-if="viewMode == 'list'"
        name="th-list"
        size="18" 
        @click.native="$emit('viewModeChange', 'grid')"
      />
    </div>
      
      FILES - {{ list.length }} items
    </div>

    <div :class="{ 
      'row': viewMode == 'grid',
      'list-group': viewMode == 'list'
      }"
    >
      <slot />
    </div>
  </div> 
</template>

<script>
export default {
  props: {
    list: Array,
    viewMode: String
  }
}
</script>

<style>

</style>