<template>
  <div class="menubar" id="workbench.aside.menubar">
    <a
      class="menubar-btn" 
      :title="asideOpen ? 'Close Aside' : 'Toggle Sidebar'"
      @click="toggleSidebar"
    >
      <Icon :name="asideOpen ? 'times' : 'bars'" />
    </a>

    <a
      v-if="canChangeRepos"
      class="menubar-btn"
      title="Repository"
      @click="gotoRepos"
    >
      <Icon name="warehouse" />
    </a>

    <a
      title="Explorer"
      :class="['menubar-btn', { active: isActive('explorer') }]" 
      @click="toggleActivity('explorer')"
    >
      <Icon name="folders" />
    </a>

    <a
      title="Search"
      :class="['menubar-btn', { active: isActive('search') }]" 
      @click="toggleActivity('search')"
    >
      <Icon name="search" />
    </a>

    <a
      title="Watch on Mobile"
      :class="['menubar-btn', { active: isActive('mobile') }]"
      @click="toggleActivity('mobile')"
    >
      <Icon name="mobile" />
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
        this.$store.commit(types.TOGGLE_ASIDE, { open: false });
      } else {
        this.$store.commit(types.TOGGLE_SIDEBAR);
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

      this.$store.commit(types.TOGGLE_SIDEBAR, { open: true });
      this.$store.commit(types.TOGGLE_ACTIVITY, { activity });
    },

    isActive(activity) {
      return activity === this.activity
    }
  }  
}
</script>

<style lang="scss" scoped>
.menubar {
  min-width: 48px;
  background: #ddd;
  position: sticky;
  top: 0;
  height: 100vh;

  .menubar-btn {
    position: relative;
    width: 100%;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;

    &::after {
      width: 3px;
      height: 100%;
      background: transparent;
      position: absolute;
      left: 0;
      content: '';
    }
    
    .svg-icon {
      width: 18px;
      height: 18px;
    }

    &:not(.active) {
      cursor: pointer;
    }

    &.bottom {
      position: absolute;
      bottom: 0;
    }
  }
}
</style>