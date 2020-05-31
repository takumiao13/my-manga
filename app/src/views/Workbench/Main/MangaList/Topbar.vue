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
      :navs="navs"
      @back="handleNavigateBack"
      @navigate="handleNavigate"
    />
  </div>
</template>

<script>
import { mapState, mapGetters, mapMutations } from 'vuex';
import qs from '@/helpers/querystring';
import animateScrollTo from 'animate-scroll-to.js';

const PATH_SEP = '/';

export default {
  props: {
    title: String,
    navs: Array,
    needAddress: Boolean,
    viewType: {
      type: String,
      default: 'file' // file | manga | search
    }
  },

  computed: {
    ...mapState('manga', [ 'path' ]),

    ...mapGetters('app', [ 'repo' ]),

    leftBtns() {

      const fileBtns = [{
        icon: 'bars',
        className: 'd-inline-block d-md-none',
        click: this.handleToggleSidebar
      }];

      const mangaBtns = [{
        icon: 'arrow-left',
        tip: 'Back',
        click: this.handleBack
      }];

      const searchBtns = [{
        icon: 'arrow-left',
        tip: 'Back',
        click: this.handleBack
      }]

      const buttonMap = {
        manga: mangaBtns,
        search: searchBtns,
        random: fileBtns,
        file: fileBtns
      };

      return buttonMap[this.viewType];
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

      const randomBtns = [{
        icon: 'refresh',
        tip: 'Refresh',
        click: () => this.$emit('refresh')
      }];

      // TODO:
      // when refresh latest mangas will cause problem
      const fileBtns = [{
        icon: 'refresh',
        tip: 'Refresh',
        click: () => this.$emit('refresh')
      }];

      const buttonMap = {
        manga: mangaBtns,
        search: searchBtns,
        random: randomBtns,
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
    ...mapMutations('app', ['toggleAside', 'setActivity']),

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
      if (path) params.path = qs.encode(path);
 
      this.$router.navigate({
        name: 'explorer',
        params
      });
    },

    handleBackToTop() {
      animateScrollTo(0);
    },

    handleToggleSidebar(activity) {
      this.toggleAside();
      if (activity) {
        this.setActivity(activity);
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
        params: { dirId, path: qs.encode(path) }
      });
    }
  }
}
</script>

<style lang="scss" scoped>
// Topbar
// ==
.topbar {
  height: 3rem;

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
}

.addressbar-collapsed {
  .addressbar {
    transform: translateY(-100%);
  }
}
</style>