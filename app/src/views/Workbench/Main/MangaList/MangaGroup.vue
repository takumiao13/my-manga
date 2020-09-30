<template>
  <div class="manga-area mb-4" v-show="list.length" :data-view-mode="viewMode">
    <div class="area-header">
      <div class="area-header-inner">
        <div class="actions float-right">
          <icon 
            v-if="viewMode == 'grid'"
            name="th"
            size="18"
            @click.native="$emit('view-mode-change', 'list')"
          />
          <icon 
            v-else-if="viewMode == 'list'"
            name="th-list"
            size="18" 
            @click.native="$emit('view-mode-change', 'grid')"
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
          'col-4 col-sm-3 col-lg-2': viewMode == 'grid' && item.placeholder == 1,
          'col-12 col-sm-6 col-lg-4': viewMode == 'grid' && item.placeholder == 2,
          'list-group-item list-group-item-action': viewMode == 'list',
          'area-item': viewMode == 'grid',
          'area-item-2x': viewMode == 'grid' && item.placeholder == 2,
          active: item.path === activePath,
        }"
        v-for="item in list"
        :key="item.path"
      >
        <MangaItem
          :show-path="showPath"
          :active-path="activePath"
          :view-mode="viewMode"
          :item="item"
          @item-click="$emit('item-click', item)"
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
    activePath: String,
    showPath: Boolean,
  }
}
</script>

<style lang="scss" scoped>
@import '@/assets/style/base';

.row {
  margin-left: -.5rem;
  margin-right: -.5rem;
  align-items: flex-end;
}

// 1/8
.area-item {    
  border-radius: .3rem;

  @include media-breakpoint-up(xl) {
    flex: 0 0 12.5%;
    max-width: 12.5%;
  }
}

.area-item-2x {    
  @include media-breakpoint-up(xl) {
    flex: 0 0 25%;
    max-width: 25%;
  }
}
</style>