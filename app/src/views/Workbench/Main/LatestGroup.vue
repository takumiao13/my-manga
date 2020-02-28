<template>
<div class="manga-area mb-4">
  <div class="area-header">
    <div class="actions float-right" v-if="!$feature.touch">
      <a @click="prev" :class="{ 'hidden': prevBound }">
        <icon name="chevron-left" size="18" />
      </a>
      <a @click="next" :class="{ 'hidden': nextBound }">
        <icon name="chevron-right" size="18"/>
      </a>
    </div>

    <a @click="$emit('more')" title="View more" href="javascript:void 0;">
      LATEST MANGA &rarr;
    </a>
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
      <slot/>
    </div>
  </div>
</div>
</template>

<script>
import { mapState } from 'vuex';

export default {
  props: {
    list: Array
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
      console.log('maxStep', this.appSize)
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
  padding: 0 2px; 
  margin-left: -2px; // don't hidden version border
  margin-right: -2px;

  > .row {
    flex-wrap: nowrap;
    transition: transform .8s linear;
  }
}
</style>