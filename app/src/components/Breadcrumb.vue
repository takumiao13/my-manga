<template>
  <div class="location" ref="breadcrumb">

    <ul v-if="finished && !hasTouch" class="pc-location">
      <li v-for="(nav, index) in navs_" :key="nav.path">
        <div 
          class="text-truncate"
          @click="$emit('navigate', $event, nav)"
        >
          {{ nav.name }}
        </div>
        <div
          class="breadcrumb-separator"
          v-if="index !== navs_.length-1"
        >
          <icon name="chevron-right" size="14" />
        </div>
      </li>
    </ul>

    <ul class="mobile-location" :style="mobileStyle()">
      <li v-for="(nav, index) in navs" :key="nav.path" ref="navs">
        <div 
          class="text-truncate"
          @click="$emit('navigate', $event, nav)"
        >
          {{ nav.name }}
        </div>
        <div
          class="breadcrumb-separator"
          v-if="index !== navs.length-1"
        >
          <icon name="chevron-right" />
        </div>
      </li>
    </ul>
  </div>  
</template>

<script>
const BASIS_WIDTH = 80 + 38 // all + ... width
const HAS_TOUCH = 'ontouchstart' in window;

export default {
  name: 'Breadcrumb',

  props: {
    navs: Array,
    
    separator: {
      type: String,
      default: '>'
    }
  },

  data() {
    return {
      finished: false,
      navs_: [],
      hasTouch: HAS_TOUCH
    }
  },

  watch: {
    navs(newVal, oldVal) {
      this.$nextTick(this.refresh);
    }
  },

  mounted() {
    this.refresh();
  },

  methods: {
    mobileStyle() {
      return { visibility: this.hasTouch ? 'visible': 'hidden' }
    },

    refresh() {
      let nav;
      const navs = [];
      const len = this.$refs.navs.length;
      const maxWidth = this.$refs.breadcrumb.clientWidth - BASIS_WIDTH;
      
      this.finished = false;
      this.$refs.navs.reverse().reduce((p, c, i) => {
        const total = p + c.clientWidth;
        if (total <= maxWidth) navs.unshift(this.navs[len-i-1]);
        return total;
      }, 0);

      const diff = this.navs.length - navs.length;
      if (!this.hasTouch && diff) {
        if (diff > 1) navs.unshift({ name: '...', path: false });
        navs.unshift(this.navs[0]);
      }

      this.navs_ = navs;
      this.finished = true;
    }
  }
}
</script>

<style lang="scss" scoped>
.location {
  overflow: hidden;
  height: 1.8rem;

  > ul {
    display: flex;
    flex-wrap: nowrap;
    white-space: nowrap;
    margin: 0;
    padding: 0;
    overflow-x: auto;
    list-style: none;

    > li {
      font-size: 80%;
      display: flex;
      max-width: 180px;
      cursor: pointer;

      &:last-child {
        padding-right: .25rem;
      }

      > div {
        padding: .25rem 0 .25rem .75rem;
      }
    }

    .breadcrumb-separator {
      padding-left: .25rem;

      .svg-icon {
        vertical-align: -0.2em;
      }
    }
  }
}
</style>
