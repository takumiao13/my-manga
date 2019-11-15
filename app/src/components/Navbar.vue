<template>
  <nav class="navbar">
    <ul v-if="leftBtns_ && leftBtns_.length" class="navbar-nav navbar-nav-left flex-row">
      <component 
        class="nav-item"
        v-for="(btn, index) in leftBtns_"
        :key="`left-${index}`"
        :is="navItemIs(btn)"
        v-bind="navItemProps(btn)"
        v-on="navItemEvents(btn)"
      >
        <component
          :is="btn.dropdown ? 'span' : 'a'"
          :class="[btn.className, { btn: !btn.dropdown }]"
          :title="btn.tip"
          v-on="btn.dropdown ? null: { 
            click: ($event) => {
              $event.stopPropagation();
              btn.click();
            } 
          }"
        >
          <icon v-if="btn.icon" :name="btn.icon" />
          <template v-if="btn.icon && btn.title">&nbsp;</template>
          <span v-html="btn.title"></span>
        </component>
      </component>
    </ul>

    <a class="navbar-brand text-truncate" 
      :class="title_.className"
      v-html="title_.content"
      @click="title_.click" 
    />

    <ul v-if="rightBtns_ && rightBtns_.length" class="navbar-nav navbar-nav-right flex-row ml-md-auto">
      <component 
        class="nav-item"
        v-for="(btn, index) in rightBtns_"
        :is="btn.dropdown ? 'dropdown' : 'li'"
        :key="`right-${index}`"
        :class="btn.className"
        :as="btn.dropdown ? 'li' : null"
        v-bind="btn.dropdown ? btn.dropdown.props : null"
        v-on="btn.dropdown ? btn.dropdown.on : null"
      >
        <component
          :is="btn.dropdown ? 'span' : 'a'"
          :class="{ btn: !btn.dropdown }"
          :title="btn.tip"
          v-on="btn.dropdown ? null: { 
            click: ($event) => {
              $event.stopPropagation();
              btn.click();
            } 
          }"
        >
          <icon v-if="btn.icon" :name="btn.icon" />
          <template v-if="btn.icon && btn.title">&nbsp;</template>
          <span v-html="btn.title"></span>
        </component>
      </component>
    </ul>
  </nav>
</template>

<script>

const DEFAULT_TITLE = {
  className: '',
  click() {}
};

const DEFAULT_BUTTON = {
  click() {}
};

export default {
  name: 'Navbar',
  
  props: {
    title: {
      type: [ String, Object, Function ],
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
      } else if (typeof this.title === 'function') {
        t = this.title();
      } else {
        t = this.title;
      }
      
      return Object.assign({}, DEFAULT_TITLE, t);
    },

    leftBtns_() {
      let buttons = null;
      if (typeof this.leftBtns === 'function') {
        buttons = this.leftBtns();  
      } else {
        buttons = this.leftBtns;
      }

      return buttons && buttons.map(btn => {
        btn = Object.assign({}, DEFAULT_BUTTON, btn);
        if (btn.dropdown && !btn.dropdown.props.alignment) {
          btn.dropdown.props.alignment = 'left';
        }
        return btn;
      });
    },

    rightBtns_() {
      let buttons = null;
      if (typeof this.rightBtns === 'function') {
        buttons = this.rightBtns();  
      } else {
        buttons = this.rightBtns;
      }
      
      return buttons && buttons.map(btn => {
        btn = Object.assign({}, DEFAULT_BUTTON, btn);
        if (btn.dropdown && !btn.dropdown.props.alignment) {
          btn.dropdown.props.alignment = 'right';
        }
        return btn;
      });
    },
  },

  methods: {
    navItemIs(btn) {
      return  btn.dropdown ? 'dropdown': 'li';
    },

    navItemProps(btn) {
      const props = {
        as: btn.dropdown ? 'li' : null
      };

      if (btn.dropdown && btn.dropdown.props) {
        Object.assign(props, btn.dropdown.props);
      }

      return props;
    },

    navItemEvents(btn) {
      return btn.dropdown ? btn.dropdown.on : null;
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

    &.text-center {
      margin: 0 auto;
      position: absolute;
      left: 25%;
      width: 50%;
      text-align: center;
    }
  }

  .navbar-brand-sm {
    font-size: 1rem;
  }

  .navbar-brand-xs {
    font-size: .8rem;
  }

  .navbar-nav {
    &.navbar-nav-left .nav-item {
      margin-right: .25rem;

      // increase gutter between last btn and title
      &:last-child {
        margin-right: -.5rem;
      }
    }

    &.navbar-nav-right .nav-item {
      margin-left: .25rem;
    }
  }

  .btn {
    padding: .375rem;
    min-width: 38px;
  }

  .topbar-left-btn {
    margin-right: -.5rem;
  }

  .dropdown-menu.show {
    position: absolute;
  }
}
</style>