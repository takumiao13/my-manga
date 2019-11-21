<template>
  <div>
    <div class="explorer">
      <div class="topbar">
        <navbar :title="title" :right-btns="rightBtns" />
      </div>
      
      <data-view 
        class="explorer-container"
        :loading="pending" 
        :empty="empty"
      >
        <div class="explorer-repo-name" @click="handleBack">{{ repo.name }}</div>
        <nested-list 
          v-show="success"  
          :props="treeProps"
          :data="folders"
          @expanded="handleItemExpanded"
          @selected="handleItemSelected" 
        />
      </data-view>
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import { types as appTypes } from '@/store/modules/app';
import { types } from '@/store/modules/explorer';

export default {
  data() {
    return {
      title: {
        content: 'Explorer',
        className: 'navbar-brand-xs',
        click: this.closeSidebar
      },

      treeProps: {
        key: 'name',
        label: (item) => item._mangaGroup ? 
          `<span class="manga-group-btn">${item.children.length} mangas</span>` :
          item.name
        ,
        className: (item) => item._mangaGroup ? 'manga-group-item' : '',
        title: 'name',
        children: 'children',
        isBranch: (item) => item._mangaGroup || item.type === 'FILE' && item.hasChildren
      }
    }
  },

  computed: {
    ...mapState('app', { appError: 'error' }),

    ...mapState('explorer', [ 'inited', 'folders', 'empty' ]),
    
    ...mapState('settings/user', {
      canChangeRepos: (state) => !!state.data
    }),

    ...mapGetters('app', [ 'repo' ]),

    ...mapGetters('explorer', [ 'pending', 'success', 'empty' ]),

    rightBtns() {
      return this.canChangeRepos ? [{
        icon: 'folders',
        click: this.handleGotoRepos,
        tip: 'change repository'
      }] : null;
    }
  },

  activated() {
    if (
      this.appError || 
      (this.$route.meta.isBack && this.inited) || 
      this.$router._reset
    ) {
      return;
    }

    this.fetchFolders();
  },

  beforeRouteUpdate(to, from, next) {
    if (!this.appError && to.params.dirId !== from.params.dirId) {
      this.fetchFolders();
    }

    next();
  },

  methods: {
    fetchFolders() {
      const { dirId } = this.repo;
      this.$store.dispatch(types.FETCH, { dirId });
    },

    closeSidebar() {
      this.$store.dispatch(appTypes.TOGGLE_SIDEBAR, { open: false });
    },

    // events
    handleItemExpanded(item, ctx) {
      const { dirId } = this.repo;
      if (item._mangaGroup) return;
      if (/success|pending/.test(ctx.getStatus())) return;
      
      // maybe use two-way binding later
      // faster then vuex (but we cannot use strict mode)
      ctx.setStatus('pending');
      this.$store.dispatch(types.FETCH, {
        path: item.path,
        dirId
      }).then(() => {
        ctx.setStatus('success');
      }).catch(() => {
        ctx.setStatus('error');
      })
    },

    handleItemSelected(item, ctx) {
      if (item._mangaGroup) {
        ctx.open = !ctx.open;
        return;
      }

      const { dirId } = this.repo;
      const path = item.path;
   
      this.$router.push({ 
        name: 'explorer', 
        params: { dirId, path },
        query: item.type === 'MANGA' ? { type: 'manga' } : null
      }).then(() => this.closeSidebar());
    },

    handleGotoRepos() {
      this.$router.push({ name: 'repos' });
    },

    handleBack() {
      if (this.$router.history.current.params.path) {
        const { dirId } = this.repo;
        this.$router.push({ name: 'explorer', params: { dirId }});
      }
      
      this.closeSidebar();
    }
  }
}
</script>

<style lang="scss" scoped>
.explorer {
  margin-left: -15px;
  margin-right: -15px;
}

.explorer-container {
  min-height: calc(100vh - 3rem);
}

.explorer-repo-name {
  padding: .25rem .8rem;
  cursor: pointer;
}
</style>

<style lang="scss">
.list-nested .manga-group-item {
  .list-group {
    .list-group-item {
      padding-left: 2rem !important;
      padding-right: 1rem;
    }

    .list-nested-label {
      margin-left: 0;
    }
  }

  .manga-group-btn {
    border-radius: 1rem;
    padding: .1rem .5rem .2rem;
  }
}
</style>