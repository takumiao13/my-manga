<template>
  <div class="manga-area mb-4" v-show="list.length" :data-view-mode="viewMode">
    <div class="area-header">
      <div class="area-header-inner">
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

        MANGA - {{ list.length }} items
      </div>
    </div>
    <div :class="{ 
      'row': viewMode == 'grid',
      'list-group': viewMode == 'list'
      }"
    >
      <div 
        :class="{  
          'col-4 col-sm-3 col-xl-2': viewMode == 'grid' && item.placeholder == 1,
          'col-12 col-sm-6 col-xl-4': viewMode == 'grid' && item.placeholder == 2,
          'list-group-item list-group-item-action': viewMode == 'list',
          'area-item': viewMode == 'grid',
          active: item.path === activePath,
        }"
        v-for="item in list"
        :key="item.path"
      >
        <MangaItem   
          :active-path="activePath"
          :view-mode="viewMode"
          :item="item"
          @click.native="$emit('item-click', item, 'manga')"
        />
      </div>
    </div>
  </div>  
</template>

<script>
import MangaItem from './MangaItem';

export default {
  components: {
    MangaItem
  },

  props: {
    list: Array,
    viewMode: String,
    activePath: String
  }
}
</script>

<style lang="scss" scoped>
.row {
  margin-left: -.5rem;
  margin-right: -.5rem;
  align-items: flex-end;
}
</style>