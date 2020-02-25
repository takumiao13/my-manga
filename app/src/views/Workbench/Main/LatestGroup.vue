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

export default {
  props: {
    length: Number
  },

  data() {
    return {
      step: 0,
      maxStep: 0
    }
  },

  computed: {
    offsetX() {
      return -100*this.step;
    },
    
    prevBound() {
      return this.step == 0;
    },

    nextBound() {
      return this.step == this.maxStep
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

  created() {
    this._removeListener = this.$service.media.addListener(evt => {
      const lineSize = { 'sm': 3,'md': 4,'lg': 6 }[evt.$active];
      this.maxStep = Math.ceil(this.length / lineSize) - 1;
    });
  },

  destroyed() {
    this._removeListener();
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
  padding: 0 .5rem;
  margin-left: -.5rem;
  margin-right: -.5rem;

  > .row {
    flex-wrap: nowrap;
    transition: transform .8s linear;
  }
}
</style>