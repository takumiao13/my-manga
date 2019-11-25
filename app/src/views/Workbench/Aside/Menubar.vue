<template>
  <div class="menubar">
    <a
      class="menubar-btn" 
      :title="asideOpen ? 'Close Aside' : 'Toggle Sidebar'"
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
      <icon name="warehouse" />
    </a>

    <a
      title="Explorer"
      :class="['menubar-btn', { active: isActive('explorer') }]" 
      @click="toggleActivity('explorer')"
    >
      <icon name="folders" />
    </a>

    <a
      title="Watch on Mobile"
      :class="['menubar-btn', { active: isActive('mobile') }]"
      @click="toggleActivity('mobile')"
    >
      <icon name="mobile" />
    </a>

    <!-- support later
    <a class="menubar-btn bottom">
      <icon name="cog" />
    </a> -->
  </div> 
</template>

<script>
import { mapState } from 'vuex';
import { types } from '@/store/modules/app';
import { pick } from '@/helpers/utils';

export default {
  computed: {
    ...mapState('app', [ 'asideOpen', 'activity' ]),

    ...mapState('settings/user', {
      canChangeRepos: (state) => !!state.data
    }),
  },
  
  methods: {
    toggleSidebar() {
      // when is small screen
      if (this.asideOpen) {
        this.$store.dispatch(types.TOGGLE_ASIDE, { open: false });
      } else {
        this.$store.dispatch(types.TOGGLE_SIDEBAR);
      }
    },

    gotoRepos() {
      this.$router.push({ name: 'repos' });
    },

    toggleActivity(activity) {
      if (this.isActive(activity)) return;
      
      const to = pick(this.$route, ['name', 'params', 'query']);
      to.query = { ...to.query, activity };
      this.$router.replace(to);

      this.$store.dispatch(types.TOGGLE_SIDEBAR, { open: true });
      this.$store.dispatch(types.TOGGLE_ACTIVITY, { activity });
    },

    isActive(activity) {
      return activity === this.activity
    }
  }  
}
</script>

<style lang="scss" scoped>
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
    
    .svg-icon {
      width: 18px;
      height: 18px;
    }

    &:not(.active) {
      cursor: pointer;
    }

    &:hover,
    &.active {
      background: #ccc;
    }

    &.bottom {
      position: absolute;
      bottom: 0;
    }
  }
}
</style>