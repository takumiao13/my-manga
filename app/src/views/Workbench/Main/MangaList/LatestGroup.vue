<template>
  <div class="manga-area mb-4">
    <div class="area-header">
      <div class="area-header-inner">
        <div class="actions float-right" v-if="!$feature.touch">
          <a @click="prev" :class="{ 'hidden': prevBound }">
            <icon name="chevron-left" size="18" />
          </a>
          <a @click="next" :class="{ 'hidden': nextBound }">
            <icon name="chevron-right" size="18"/>
          </a>
        </div>

        <a  
          title="View more" 
          href="javascript:void 0;"
          @click="$emit('more', { isDir: true, path: $consts.LATEST_PATH })" 
        >
          LATEST MANGA &rarr;
        </a>
      </div>
    </div>
    <div 
      class="latest-container" 
      :style="{ 'overflow-x': $feature.touch ? 'scroll' : 'hidden' }"
    >
      <div 
        ref="row" 
        class="row" 
        :style="{ 'transform': `translate(${offsetX}%, 0px)`}"
      >
        <manga-item
          latest
          v-for="item in list"
          :key="item.path"
          :active-path="activePath"
          :item="item"
          @click.native="$emit('item-click', item, 'manga')"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import MangaItem from './MangaItem';

export default {
  components: {
    MangaItem
  },

  props: {
    list: Array,
    activePath: String
  },

  data() {
    return {
      step: 0
    }
  },

  computed: {

    ...mapState('app', { 
      appSize: 'size'
    }),

    offsetX() {
      return -100*this.step;
    },
    
    prevBound() {
      return this.step == 0;
    },

    nextBound() {
      return this.step == this.maxStep
    },

    length() {
      return this.list.reduce((sum,item) => sum += item.placeholder, 0);
    },

    maxStep() {
      const lineCount = this.$consts.MANGA_GRID_SIZE[this.appSize];
      return Math.ceil(this.length / lineCount) - 1;
    }
  },

  watch: {
    maxStep(val) {
      // when change size, should reset step if need.
      if (this.step > val) {
        this.step = val;
      }
    }
  },

  methods: {
    prev() {
      if (this.prevBound) return;
      this.step -= 1;
    },

    next() {
      if (this.nextBound) return;
      this.step += 1;
    }
  }
}
</script>

<style lang="scss" scoped>
.latest-container {
  padding: 0 12px;
  margin: 0 -12px;
}

.row {
  flex-wrap: nowrap;
  margin-left: -.5rem;
  margin-right: -.5rem;
  align-items: flex-end;
  transition: transform .8s linear;
}
</style>