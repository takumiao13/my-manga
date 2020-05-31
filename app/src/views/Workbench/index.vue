<template>
  <div id="workbench">
    <div class="container-fluid">
      <div class="row flex-nowrap">
        <!-- Aside Part -->
        <Aside class="col-12" />
        
        <!-- Main Part -->
        <div id="main" class="col-12">
          <router-view />
        </div>

        <!-- Backdrop -->
        <div class="backdrop" @click="toggleAside(false)"></div>
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

<style lang="scss">
@import '../../assets/style/base';

#main {
  //@include media-breakpoint-up(xl) {
    flex: 0 1 100%;
    max-width: 100%;
    min-width: 0; // fix `white-space: nowrap` breaks flexbox layout when use `text-truncate`
  //}

  .topbar {
    margin-left: -15px;
    margin-right: -15px;
  }
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

.aside-open {
  overflow-y: hidden !important; // hide body scroll
  width: 100%;
  height: 100%;
  position: relative; // fixed will lost `scrollTop`

  #aside {
    transform: translateX(0);
  }

  .backdrop {
    opacity: .3;
    width: 100vw;
    height: 100vh;
  }
}
</style>