<template>
  <div class="main-interface">
    <div class="container-fluid">
      <div class="row flex-xl-nowrap">
        <div id="aside" class="col-12 col-md-3 col-xl-4">
          <div class="menubar">
            <a 
              class="menubar-btn" 
              title="Toggle Sidebar"
              @click="toggleSidebar"
            >
              <icon :name="asideOpen ? 'times' : 'bars'" />
            </a>

            <a 
              v-if="canChangeRepos" 
              class="menubar-btn"
              title="Change Repo"
              @click="gotoRepos"
            >
              <icon name="folders" />
            </a>

            <a class="menubar-btn" title="Watch on Mobile">
              <icon name="mobile" />
            </a>

            <!-- support later
            <a class="menubar-btn bottom">
              <icon name="cog" />
            </a> -->
          </div>
          <router-view class="sidebar" name="sidebar">
            <!-- <explorer @selected="handleSelected" /> -->
          </router-view>
        </div>
        <div class="backdrop" @click="closeAside"></div>

        <router-view name="main" id="main" class="col-12 col-md-9 col-xl-8">
        </router-view>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import { types } from '@/store/modules/app';

export default {
  name: 'MainInterface',

  computed: {
    ...mapState('app', [ 'asideOpen' ]),

    ...mapState('settings/user', {
      canChangeRepos: (state) => !!state.data
    }),
  },
  
  methods: {

    closeAside() {
      this.$store.dispatch(types.TOGGLE_ASIDE, { open: false });
    },

    toggleSidebar() {
      // when is small screen
      if (this.asideOpen) {
        this.closeAside();
      } else {
        this.$store.dispatch(types.TOGGLE_SIDEBAR);
      }
    },

    gotoRepos() {
      this.$router.push({ name: 'repos' });
    }
  }  
}
</script>

<style lang="scss">
@import '../../assets/style/base';

#aside {
  width: 320px;
  height: 100vh;
  position: fixed;
  z-index: 1050;
  transform: translateX(-100%);
  overflow-y: auto;
  overflow-y: overlay;
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

  @include media-breakpoint-up(xl) {
    flex: 0 1 360px;
  }

  .menubar {
    width: 48px;
    background: #ddd;
    position: sticky;
    top: 0;
    height: 100vh;

    .menubar-btn {
      width: 100%;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;

      // .svg-icon {
      //   width: 24px;
      //   height: 24px;
      // }

      &:hover {
        background: #ccc;
      }

      &.bottom {
        position: absolute;
        bottom: 0;
      }
    }
  }

  .sidebar {
    flex: 1;
  }
}

#main {
  @include media-breakpoint-up(xl) {
    flex: 0 1 100%;
    max-width: 100%;
    min-width: 0; // fix `white-space: nowrap` breaks flexbox layout when use `text-truncate`
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

.aside-open {
  overflow-y: hidden !important; // hide body scroll
  
  /* fix android oveflow bug */
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

    @include media-breakpoint-up(md) {
      opacity: 0;
      width: 0;
      height: 0;
    }
  }
}

.sidebar-open:not(.aside-open) {
  #aside {
    max-width: 48px;
  }

  .sidebar {
    display: none;
  }
}
</style>