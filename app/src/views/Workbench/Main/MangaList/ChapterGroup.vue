<template>
  <div
    v-show="list.length"
    class="chapter-area mb-4"
    :data-view-mode="showCover ? 'grid' : 'list'"
  >
    <div class="area-header">
      <div class="area-header-inner">
        CHAPTERS
        <div class="actions float-right">
          <a @click="sort">
            <Icon :name="`sort-by-no-${desc ? 'desc' : 'asc'}`" size="18" />
          </a>
        </div>
      </div>
    </div>

    <div v-if="showCover" class="row">
      <div 
        :class="{  
          'col-4 col-sm-3 col-xl-2': item.placeholder == 1,
          'col-12 col-sm-6 col-xl-4': item.placeholder == 2,
          'area-item': true,
          active: item.name === activeName,
        }"
        v-for="item in sortedList"
        :key="item.path"
        :active-path="activeName"
      >
        <MangaItem 
          :item="item"
          @click.native="$emit('item-click', item)"
        />
      </div>
    </div>

    <div v-else class="list-group">
      <a class="list-group-item list-group-item-action chapter-item"
        :class="{ active: item.name === activeName}"
        v-for="item in sortedList" 
        :key="item.path"
        @click="$emit('item-click', item, 0)"
      >

        <div class="text-truncate pr-2">
          {{ item.chapterName || item.name }}
        </div>                
      </a>
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
    activeName: String,
    metadata: Object
  },

  data() {
    return {
      desc: true
    }
  },

  computed: {
    showCover() {
      const m = this.metadata;
      return m && 
             typeof m.chapters === 'object' && 
             m.chapters.cover
    },

    sortedList() {
      return this.desc ? 
        this.list.slice().reverse() :
        this.list;
    }
  },

  methods: {
    sort() {
      this.desc = !this.desc;
    }
  }
}
</script>

<style lang="scss" scoped>
@import '../../../../assets/style/base';
.chapter-area {

  .row {
    margin-left: -.5rem;
    margin-right: -.5rem;
    align-items: flex-end;
  }

  .list-group {
    @include media-breakpoint-up(sm) {
      margin: 0 -.2rem;
      margin-top: .2rem;
      flex-direction: row;
      flex-wrap: wrap;
      align-items: flex-start;

      .list-group-item {
        margin: .2rem;
        width: calc(50% - .4rem);
        border-top-width: .5px !important;
      }
    }

    @include media-breakpoint-up(md) {
      .list-group-item {
        width: calc(33.3% - .4rem);
      }
    }

    @include media-breakpoint-up(lg) {
      .list-group-item {
        width: calc(25% - .4rem);
      }
    }
  }
}
</style>