<template>
  <div class="addressbar" ref="addressbar">
    <!-- pc addressbar -->
    <ul v-if="finished && !$feature.touch" class="addressbar-container">
      <li 
        class="address-item"
        @click="$emit('back', $event)"
      >
        <a class="address-link address-back" title="Back to parent">
          <icon name="arrow-left" />
        </a>
      </li>
      
      <li 
        class="address-item"
        :class="nav.className"
        v-for="(nav, index) in navs_" 
        :key="index"
      >
        <a 
          class="address-link text-truncate"
          @click="$emit('navigate', $event, nav)"
        >
          {{ nav.name }}
        </a>
        <span
          class="address-separator"
          v-if="!isLastNav(index)"
        >
          <icon name="chevron-right" size="14" />
        </span>
      </li>
    </ul>

    <!-- mobile addressbar -->
    <ul ref="mobile" :style="mobileStyle" class="addressbar-container">
      <li v-for="(nav, index) in navs" :key="index" ref="navs" class="address-item">
        <a 
          class="address-link text-truncate"
          @click="$emit('navigate', $event, nav)"
        >
          {{ nav.name }}
        </a>
        <span
          class="address-separator"
          v-if="!isLastNav(index)"
        >
          <icon name="chevron-right" size="14" />
        </span>
      </li>
    </ul>
  </div>  
</template>

<script>
import { debounce } from '@/helpers/utils';

const BASIS_WIDTH = 40 + 38 // back + ... width

// TODO:
// - @back
// - @navigate
export default {
  name: 'Addressbar',

  props: {
    navs: Array
  },

  data() {
    return {
      finished: false,
      navs_: []
    }
  },

  computed: {
    mobileStyle() {
      return { 
        visibility: this.$feature.touch ? 'visible': 'hidden', 
        'overflow-x': 'auto'
      }
    }
  },

  watch: {
    navs() {
      this.$nextTick(this.refresh);
    }
  },

  mounted() {
    this.refresh();
  },

  created() {
    this._handleResize = debounce(this.refresh, 500);
    window.addEventListener('resize', this._handleResize);
  },

  destroyed() {
    window.removeEventListener('resize', this._handleResize);
  },

  methods: {
    isLastNav(index) {
      return index === this.navs_.length - 1;
    },

    refresh() {
      this.finished = false;
      this.navs_ = this._generateNavs()
      this.finished = true;

      // scroll to right
      if (this.$feature.touch) {
        this.$nextTick(() => this.$refs.mobile.scrollLeft = 9999);
      }
    },

    _generateNavs() {
      const { 
        navs: $navs, 
        addressbar: $addressbar
      } = this.$refs;

      const navs = [],
            len = $navs.length,
            firstWidth = $navs[0].clientWidth,
            maxWidth = $addressbar.clientWidth - firstWidth - BASIS_WIDTH;

      $navs.reverse().reduce((p, c, i) => {
        const total = p + c.clientWidth;
        if (total <= maxWidth) navs.unshift(this.navs[len-i-1]);
        return total;
      }, 0);

      const diff = this.navs.length - navs.length;

      if (!this.$feature.touch && diff) {
        if (diff > 1) {
          navs.unshift({ 
            name: '...', 
            path: false, 
            className: 'muted' 
          });
        }

        navs.unshift(this.navs[0]);
      }

      return navs;
    }
  }
}
</script>

<style lang="scss" scoped>
.addressbar {
  display: flex;
  overflow-x: hidden;
}

.addressbar-container {
  display: flex;
  flex-wrap: nowrap;
  white-space: nowrap;
  margin: 0;
  padding: 0;
  overflow: hidden;
  list-style: none;
  min-width: 100%;

  &:hover::-webkit-scrollbar {
    width: auto;
    height: auto;
  }
}

.address-item {
  display: flex;
  align-items: center;
  font-size: 80%;
  max-width: 180px;

  .svg-icon {
    vertical-align: -0.2em;
  }

  &:last-child {
    padding-right: .25rem;
  }

  &:first-child {
    .address-link {
      padding-left: 1rem;
    }
  }
}

.address-link {
  display: block;
  padding: .25rem .25rem .25rem .5rem;
  cursor: pointer;

  &.address-back {
    padding: 0 .625rem;
  }
}

.address-separator {
  display: inline-block;
  padding-right: .25rem;
}
</style>
