<template>
  <div class="main-interface">
    <div class="container-fluid">
      <div class="row flex-xl-nowrap">
        <div id="sidebar" class="col-12 col-md-3 col-xl-4">
          <explorer @selected="handleSelected" />
        </div>

        <div class="backdrop" @click="toggle"></div>

        <router-view id="main" class="col-12 col-md-9 col-xl-8">
        </router-view>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import { types } from '@/store/modules/app';
import Explorer from './Explorer';

export default {
  name: 'MainInterface',

  components: {
    Explorer
  },

  computed: {
    ...mapState('app', [ 'isSidebarOpen' ])
  },
  
  methods: {
    toggle() {
      this.$store.dispatch(types.TOGGLE_SIDEBAR);
    },
    
    handleSelected(item) {
      const path = item.path;
      this.$store.dispatch(types.TOGGLE_SIDEBAR, { open: false });
      this.$router.push({ name: 'explorer', params: { path }})
    }
  }  
}
</script>

<style lang="scss">
@import '../../assets/style/base';

#sidebar {
  width: 320px;
  height: 100vh;
  position: fixed;
  z-index: 1050;
  transform: translateX(-100%);
  overflow: auto;

  @include transition(transform .3s ease-out);

  @include media-breakpoint-up(md) {
    @supports (position: sticky) {
      position: sticky;
      top: 0;
      height: 100vh;
    }
    transform: translateX(0);
    border-right: 1px solid rgba(0, 0, 0, .1);  
  }

  @include media-breakpoint-up(xl) {
    flex: 0 1 360px;
  }
}

#main {
  @include media-breakpoint-up(xl) {
    flex: 0 1 100%;
    max-width: 100%;
  }

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

  @include transition(opacity .3s,);
}

.sidebar-open {
  overflow: hidden !important; // hide body scroll
  
  /* fix android oveflow bug */
  width: 100%;
  height: 100%;
  position: relative;

  #sidebar {
    transform: translateX(0);
  }

  .backdrop {
    opacity: .3;
    width: 100vw;
    height: 100vh;

    @include media-breakpoint-up(md) {
      opacity: 0;
      width: 0;
      height: 0;
    }
  }
}
</style>