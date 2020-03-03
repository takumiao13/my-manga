<template>
  <div class="chapter-area  mb-4" v-show="list.length">
    <div class="area-header">
      CHAPTERS - {{ list.length }} items
      <div class="actions float-right">
        <a @click="sort">
          <icon :name="`sort-by-no-${desc ? 'desc' : 'asc'}`" size="18" />
        </a>
      </div>
    </div>

    <div 
      v-if="metadata && typeof metadata.chapters === 'object' && metadata.chapters.cover"
      class="row"
    >
      <manga-item 
        v-for="item in sortedList"
        :key="item.path"
        :active-path="activeName"
        :item="item"
        @click.native="$emit('item-click', item)"
      />
    </div>

    <div class="list-group" v-else>
      <a class="list-group-item list-group-item-action chapter-item"
        :class="{ active: item.name === activeName}"
        v-for="(item, index) in sortedList" 
        :key="item.path"
        @click="$emit('item-click', item, 0)"
      >

        <small class="text-muted float-right">
          #{{ index + 1 }}
        </small>

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
      flex-direction: row;
      flex-wrap: wrap;
      align-items: flex-start;

      .list-group-item {
        margin: .2rem;
        width: calc(50% - .4rem);
      }
    }

    @include media-breakpoint-up(lg) {
      .list-group-item {
        width: calc(33.3% - .4rem);
      }
    }
  }
}
</style>