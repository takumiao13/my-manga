<template>
  <div class="aside">
    <Menubar />
    <div class="sidebar" id="workbench.aside.sidebar">
      <Explorer v-show="!activity || activity === ActivityTypes.EXPLORER" />
      <Search v-show="activity === ActivityTypes.SEARCH" />
      <WatchOnMobile v-show="activity === ActivityTypes.MOBILE" />
    </div>
  </div>  
</template>

<script>
import { mapState } from 'vuex';
import Menubar from './Menubar';
import Explorer from './Sidebar/Explorer';
import Search from './Sidebar/Search';
import WatchOnMobile from './Sidebar/WatchOnMobile';

const ActivityTypes = {
  EXPLORER: 'explorer',
  MOBILE: 'mobile',
  SEARCH: 'search'
}

export default {
  components: {
    Menubar,
    Explorer,
    Search,
    WatchOnMobile
  },

  data() {
    return {
      ActivityTypes
    }
  },

  computed: {
    ...mapState('app', [ 'activity' ]),
  }
}
</script>

<style lang="scss" scoped>
@import '@/assets/style/base';

.aside {
  width: 320px;
  height: 100vh;
  position: fixed;
  z-index: 1050;
  transform: translateX(-100%);
  padding: 0;
  display: flex;

  @include transition(transform .3s ease-out);

  @include media-breakpoint-up(md) {
    @supports (position: sticky) {
      position: sticky;
      top: 0;
      height: 100vh;
    }
    transform: translateX(0);
    //border-right: 1px solid rgba(0, 0, 0, .1);  
  }

  @include media-breakpoint-up(md) {
    flex: 0 1 360px;
  }

  @include media-breakpoint-up(xl) {
    flex: 0 1 420px;
  }

  .sidebar {
    flex: 1;
    overflow-y: auto;
    overflow-y: overlay;
  }
}
</style>