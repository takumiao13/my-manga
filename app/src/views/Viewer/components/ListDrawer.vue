<template>
  <div 
    class="viewer-chapter-list" 
    :class="{ open: visible }" 
    ref="container"
  >
    <header class="topbar">
      <Navbar 
        title="Chapters" 
        :right-btns="[{
          icon: 'times',
          click: () => $emit('close' )
        }]" 
      />
      <div class="viewer-chapter-list-actions">
        <div class="float-right">
          <a class="mr-2" @click="locate">
            <Icon name="map-marker-alt" />
          </a>
          <a @click="sort">
            <Icon :name="`sort-by-no-${desc ? 'desc' : 'asc'}`" />
          </a> 
        </div>

        {{ list.length }} items
      </div>
    </header>
    
    <section>
      <div class="list-group">
        <div 
          class="list-group-item"
          :class="{ active: item.name === activeName }"
          v-for="item in sortedList"
          :key="item.path"
          @click.stop="$emit('change', item)"
        >
          <Icon v-if="item.name === activeName" name="map-marker-alt" />
          {{ item.name }}
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import animateScrollTo from 'animate-scroll-to.js';

export default {
  props: {
    visible: Boolean,
    list: Array,
    activeName: String
  },

  data() {
    return {
      desc: true,
    }
  },

  computed: {
    sortedList() {
      return this.desc ? this.list.slice().reverse() : this.list;
    }
  },

  methods: {
    sort() {
      this.desc = !this.desc;
    },

    locate() {
      const targetEl = this.$refs.container.querySelector('.list-group-item.active');
      const target = targetEl.offsetTop - 90; // header height
      animateScrollTo(target, { container: this.$refs.container });
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/assets/style/base';

.viewer-chapter-list {
  position: fixed;
  z-index: 1400;
  top: 0;
  bottom: 0;
  right: 0;
  overflow: auto;
  width: 320px;
  transform: translateX(100%);
  @include transition(transform .3s ease-out);

  @include media-breakpoint-up(md) {
    width: 360px;
  }

  &.open {
    display: block;
    transform: translateX(0);
  }

  .viewer-chapter-list-actions {
    padding: .25rem .8rem;
    position: relative;

    a {
      cursor: pointer;
    }
  }
  
  > section {
    .list-group-item {
      padding: .5rem .5rem .5rem 2rem;
      font-size: 14px;
      cursor: pointer;
      position: relative;
      border-left: 0;
      border-right: 0;

      .svg-icon {
        position: absolute;
        left: .5rem;
        top: .5rem;
      }
    }
  }
}

</style>