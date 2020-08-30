<template>
  <div id="workbench" class="workbench">
    <div class="container-fluid">
      <div class="row flex-nowrap">
        <!-- Aside Part -->
        <Aside id="workbench.aside" />
        
        <!-- Main Part -->
        <div id="workbench.main" class="main">
          <router-view />
        </div>

        <!-- Backdrop -->
        <div id="workbench.backdrop" class="backdrop" @click="toggleAside(false)"></div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapMutations } from 'vuex';
import Aside from './Aside';

export default {
  name: 'Workbench',

  components: {
    Aside
  },

  computed: {
    ...mapState('app', ['asideOpen']),

    ...mapState('settings/user', {
      canChangeRepos: (state) => !!state.data
    }),
  },

  methods: {
    ...mapMutations('app', ['toggleAside', 'setSize', 'setActivity'])
  },

  // when route change should show correct activity
  activated() {
    this.setActivity(this.$route.query.activity);
  },

  beforeRouteUpdate(to, from, next) {
    this.setActivity(to.query.activity);
    next();
  },

  created() {
    this._removeListener = this.$service.media.addListener(evt => {
      this.setSize(evt.$active);
    });
  },

  destroyed() {
    this._removeListener();
  } 
}
</script>

<style lang="scss" scoped>
@import '../../assets/style/base';

.main {
  flex: 0 1 100%;
  max-width: 100%;
  min-width: 0; // fix `white-space: nowrap` breaks flexbox layout when use `text-truncate`
}

.backdrop {
  opacity: 0;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1040;
  background: $black;

  @include transition(opacity .3s);
}
</style>

<style lang="scss">
@import '../../assets/style/base';

.aside-open {
  overflow-y: hidden !important; // hide body scroll
  width: 100%;
  height: 100%;
  position: relative; // fixed will lost `scrollTop`

  .workbench .aside {
    transform: translateX(0);
  }

  .backdrop {
    opacity: .3;
    width: 100vw;
    height: 100vh;
  }
}

.sidebar-collapsed:not(.aside-open) {
  @include media-breakpoint-up(md) {
    .workbench .aside {
      max-width: 48px;
    }

    .workbench .aside .sidebar {
      display: none;
    }
  }
}
</style>