<template>
  <nav class="navbar">
    <a class="btn topbar-left-btn"
      v-for="(btn, index) in leftBtns_"
      :key="index"
      :class="btn.className"
      @click="btn.click">
      <icon v-if="btn.icon" :name="btn.icon" />
      <span v-html="btn.title"></span>
    </a>

    <a class="navbar-brand text-truncate" 
      :class="title_.className"
      v-html="title_.content"
      @click="title_.click" 
    />

    <a class="btn topbar-right-btn"
      v-for="(btn, index) in rightBtns_"
      :key="index"
      :class="btn.className"
      @click="btn.click"
      :title="btn.tip"
    >
      <icon v-if="btn.icon" :name="btn.icon" />
      {{ btn.title }}
    </a>
  </nav>
</template>

<script>

const DEFAULT_TITLE = {
  className: '',
  click() {}
};

export default {
  name: 'Navbar',
  
  props: {
    title: {
      type: [ String, Object ],
      default: () => ''
    },

    leftBtns: [ Array, Function ],

    rightBtns: [ Array, Function ],
  },

  computed: {
    title_() {
      let t;
      if (typeof this.title === 'string') {
        t = { content: this.title }
      } else {
        t = this.title;
      }
      
      return Object.assign({}, DEFAULT_TITLE, t);
    },

    leftBtns_() {
      if (typeof this.leftBtns === 'function') {
        return this.leftBtns();  
      } else {
        return this.leftBtns;
      }
    },

    rightBtns_() {
      if (typeof this.rightBtns === 'function') {
        return this.rightBtns();  
      } else {
        return this.rightBtns;
      }
    }
  }
}
</script>

<style lang="scss">
.navbar {
  flex-wrap: nowrap;
  padding: .25rem;
  height: 3rem;

  &.fixed-top {
    position: fixed;
    margin-left: 0;
    margin-right: 0;
  }

  .navbar-brand {
    margin-right: auto;
    margin-left: .5rem;
    font-size: 1rem;
    line-height: 1;
  }

  .navbar-brand-sm {
    font-size: 1rem;
  }

  .navbar-brand-xs {
    font-size: .8rem;
  }

  .btn {
    padding: .375rem;
  }

  .topbar-left-btn {
    margin-right: -.5rem;
  }
}
</style>