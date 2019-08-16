<template>
  <div class="location" ref="breadcrumb">

    <ul v-if="finished && !hasTouch" class="pc-location">
      <li @click="$emit('back', $event)" class="back">
        <icon name="arrow-left" />
      </li>
      <li v-for="(nav, index) in navs_" :key="index" :class="nav.className">
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
      <li v-for="(nav, index) in navs" :key="index" ref="navs">
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
const BASIS_WIDTH = 40 + 38 // back + ... width
const HAS_TOUCH = 'ontouchstart' in window;

export default {
  name: 'Breadcrumb',

  props: {
    navs: Array
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
      const navs = [];

      const {
        navs: $navs,
        breadcrumb: $breadcrumb
      } = this.$refs

      const len = $navs.length;
      const firstWidth = $navs[0].clientWidth;
      const maxWidth = $breadcrumb.clientWidth - firstWidth - BASIS_WIDTH;

      this.finished = false;
      $navs.reverse().reduce((p, c, i) => {
        const total = p + c.clientWidth;
        if (total <= maxWidth) navs.unshift(this.navs[len-i-1]);
        return total;
      }, 0);

      const diff = this.navs.length - navs.length;

      if (!this.hasTouch && diff) {
        if (diff > 1) navs.unshift({ name: '...', path: false, className: 'muted' });
        navs.unshift(this.navs[0]);
      }

      this.navs_ = navs;
      this.finished = true;

      if (this.hasTouch) {
        const $mobBreadcrumb = $breadcrumb.querySelector('.mobile-location');
        this.$nextTick(() => $mobBreadcrumb.scrollLeft = 9999);
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.location {
  overflow: hidden;
  height: 2rem;

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

      > div {
        padding: 0 .25rem 0 .5rem;
        line-height: 2rem;

        &:last-child {
          padding-right: .25rem;
        }
      }

      &.back {
        padding: .5rem .75rem;
      }
    }

    .breadcrumb-separator {
      padding-left: .25rem;
    }

    .svg-icon {
      vertical-align: -0.2em;
    }
  }
}
</style>
