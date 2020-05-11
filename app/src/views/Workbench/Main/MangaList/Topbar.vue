<template>
  <div class="topbar">
    <navbar
      :title="title"
      :class="{'no-shadow': needAddress }" 
      :left-btns="leftBtns"
      :right-btns="rightBtns"
      @click.native="handleBackToTop"
    />
    
    <addressbar
      v-if="needAddress" 
      :class="{ collapsed: !showAddress }"
      :navs="navs"
      @back="handleNavigateBack"
      @navigate="handleNavigate"
    />
  </div>
</template>

<script>
import { types as appTypes } from '@/store/modules/app';
import { mapState, mapGetters } from 'vuex';
import animateScrollTo from 'animate-scroll-to.js';

const PATH_SEP = '/';

export default {
  props: {
    title: String,
    showAddress: Boolean,
    viewType: {
      type: String,
      default: 'file' // file | manga | search
    }
  },

  computed: {
    ...mapState('manga', [ 'path' ]),

    ...mapGetters('app', [ 'repo' ]),

    needAddress() {
      return this.viewType !== 'manga' && this.navs.length;
    },

    navs() {
      const { path } = this.$route.params;
      const items = [];

      if (path) {
        const fragments = path.split('/');
        const { name } = this.repo;
        items.push({ name });
        
        fragments.pop(); // remove curr path
        fragments.length && fragments.forEach((item, idx) => {
          const path = fragments.slice(0, idx + 1).join(PATH_SEP);
          const data = { name: item, path };
          items.push(data);
        });
      }
      
      return items;
    },

    leftBtns() {
      return (this.viewType === 'file') ? [{
        icon: 'bars',
        className: 'd-inline-block d-md-none',
        click: this.handleToggleSidebar
      }] : [{
        icon: 'arrow-left',
        tip: 'Back',
        click: this.handleBack
      }]
    },

    rightBtns() {
      const mangaBtns = [{
        icon: 'level-up-alt',
        tip: 'Back to parent',
        click: this.handleBackToParent
      }];

      const searchBtns = [{
        icon: 'search',
        tip: 'Search',
        className: 'd-inline-block d-md-none',
        click: () => this.handleToggleSidebar('search')
      }];

      // support later
      // when refresh latest mangas will cause problem
      const fileBtns = [{
        icon: 'refresh',
        tip: 'Refresh',
        click: () => this.$emit('refresh')
      }];

      const buttonMap = {
        manga: mangaBtns,
        search: searchBtns,
        file: null, // fileBtns
      };

      return buttonMap[this.viewType];

      // hide share button use sidebar qrcode insteadof it
      //
      // {
      //   icon: 'share-alt',
      //   tip: 'Share Manga',
      //   click: this.handleShareManga
      // }
    },
  },

  methods: {
    handleBack() {
     if (this.$router._routerHistory.length === 1) {
        const { dirId } = this.$router.history.current.params;
        this.$router.push({ name: 'explorer', params: { dirId } })
      } else {
        this.$router.go(-1);
      }
    },

    handleBackToParent() {
      const { dirId } = this.repo;
      const path = this.path.split(PATH_SEP).slice(0, -1).join(PATH_SEP);
      const params = { dirId };
      if (path) params.path = path;
 
      this.$router.navigate({
        name: 'explorer',
        params
      });
    },

    handleBackToTop() {
      animateScrollTo(0);
    },

    handleToggleSidebar(activity) {
      this.$store.commit(appTypes.TOGGLE_ASIDE);
      if (activity) {
        this.$store.commit(appTypes.TOGGLE_ACTIVITY, { activity });
      }
    },

    handleNavigateBack() {
      this.$router.back();
    },

    handleNavigate($event, location) {
      const { path } = location;
      const { dirId } = this.repo;

      if (path === false) return;

      this.$router.navigate({
        name: 'explorer',
        params: { dirId, path }
      });
    }
  }
}
</script>

<style lang="scss" scoped>
// Topbar
// ==
.topbar {
  .manga-title-shown {
    color: '';

    .navbar-brand {
      opacity: 1
    }
  }

  .manga-title-hidden {
    background: transparent !important;
    border-bottom-color: transparent;
    box-shadow: none;
    
    .navbar-brand {
      opacity: 0;
    }
  }
}

// Addressbar
// ==
.addressbar {
  transition-duration: .3s;
  height: 2rem;

  &.collapsed {
    transform: translateY(-100%);
  }
}
</style>