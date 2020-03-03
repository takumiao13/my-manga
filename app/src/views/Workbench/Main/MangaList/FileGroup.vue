<template>
  <div class="file-area mb-4" v-show="list.length">
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
      <div 
        :class="{ 
          active: item.path === activePath, 
          'col-4 col-sm-3 col-lg-2 area-item': viewMode == 'grid',
          'list-group-item list-group-item-action': viewMode == 'list'
        }"

        v-for="item in list"
        :key="item.path"
        @click="$emit('item-click', item)"
      >
        <div v-show="viewMode == 'grid'" class="area-item-inner">
          <div>
            <icon :name="icon(item)" size="64" style="color: #bbb;" />
          </div>
        </div>
        
        <div v-show="viewMode == 'grid'" class="caption">
          {{ item.name }}
        </div>

        <div v-show="viewMode == 'list'" class="text-truncate">
          <icon :name="icon(item)" size="18" />
          &nbsp; {{ item.name }} 
        </div>
      </div>
    </div>
  </div> 
</template>

<script>
export default {
  props: {
    list: Array,
    activePath: String,
    viewMode: String
  },

  methods: {
    icon(item) {
      return item.fileType ? `file-${item.fileType}` : 'folder';
    }
  }
}
</script>

<style lang="scss" scoped>
@import '../../../../assets/style/base';
.file-area {
  .row {
    margin-left: -.5rem;
    margin-right: -.5rem;
  }
  
  // 1/8
  .area-item {    
    @include media-breakpoint-up(xl) {
      flex: 0 0 12.5%;
      max-width: 12.5%;
    }
  }

  .area-item-inner {
    display: block;
    position: relative;
    border-radius: .25rem;
    padding: 0px 0px 100%;

    > div {
      position: absolute;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
  }
}
</style>