<template>
  <div class="explorer" id="workbench.aside.sidebar.explorer">
    <div class="explorer-header topbar">
      <Navbar :title="title" :right-btns="rightBtns" />
      <div class="explorer-repo-name">
        <div class="float-right">
          <a class="mr-2" @click="handleCollapse" title="Collapse all">
            <icon name="minus-square" size="14"/>
          </a>
          <a @click="handleRefresh" title="Refresh">
            <icon name="refresh" size="14" />
          </a>    
        </div>   
        <span @click="handleBack">{{ repo.name }}</span>
      </div>
    </div>
    
    <DataView 
      class="explorer-body"
      :loading="pending" 
      :empty="empty"
    >
      <div 
        class="explorer-latest"
        title="Latest mangas"
        :class="{ active: activeItem && activeItem.path === $consts.LATEST_PATH }"
        @click="handleLatest"
      >
        <Icon name="rocket-launch" size="14" />Latest
      </div>
      <div 
        class="explorer-rand"
        title="Random mangas"
        :class="{ active: activeItem && activeItem.path === $consts.RANDOM_PATH }"
        @click="handleRandom"
      >
        <Icon name="random" size="14" />Random (50)
      </div>
      <NestedList
        ref="nestedList"
        v-show="success"  
        :props="treeProps"
        :data="folderTree || []"
        :active-item="activeItem"
        @expanded="handleItemExpanded"
        @selected="handleItemSelected" 
      />
    </DataView>
  </div>
</template>

<script>
import { mapState, mapGetters, mapActions, mapMutations } from 'vuex';
import qs from '@/helpers/querystring';

export default {
  data() {
    return {
      title: {
        content: 'Explorer',
        className: 'navbar-brand-xs',
        click: () => this.toggleAside(false)
      },

      activeItem: null,

      treeProps: {
        key: 'path',
        title: 'name',
        children: 'children',
        label: (item) => {
          const { _mangaGroup, name } = item;
          if (_mangaGroup && !name) return '@MANGAS'
          return name;
        },
        className: (item) => item._mangaGroup ? 'manga-group-item' : '',
        isBranch: (item) => item._mangaGroup || (item.type === 'FILE' && item.hasSubfolder)
      }
    }
  },

  computed: {
    ...mapState('app', { appError: 'error' }),

    ...mapState('explorer', [ 'empty' ]),
    
    ...mapGetters('app', [ 'repo' ]),

    ...mapGetters('explorer', [ 'folderTree', 'pending', 'success', 'empty' ]),

    rightBtns() {
      return null
    }
  },

  methods: {
    ...mapMutations('app', [ 'toggleAside' ]),

    ...mapActions('explorer', [ 'fetchFolders', 'fetchLatest', 'fetchVersions' ]),

    reset() {
      const { dirId } = this.repo;
      this.fetchFolders({ dirId });
      this.fetchLatest({ dirId });
      this.fetchVersions({ dirId });
    },

    // events
    handleItemExpanded(item, ctx) {
      const { dirId } = this.repo;
      if (item._mangaGroup) return;
      if (/success|pending/.test(ctx.getStatus())) return;
      
      // maybe use two-way binding later
      // faster then vuex (but we cannot use strict mode)
      ctx.setStatus('pending');
      this.fetchFolders({
        path: item.path,
        dirId
      }).then(() => {
        ctx.setStatus('success');
      }).catch(() => {
        ctx.setStatus('error');
      })
    },

    handleItemSelected(item, ctx) {
      this.activeItem = item;

      if (item._mangaGroup && !item.name) {
        ctx.open = !ctx.open;
        return;
      }

      const { dirId } = this.repo;
      const path = item.path;
   
      this.$router.push({ 
        name: 'explorer', 
        params: { dirId, path: qs.encode(path) },
        query: item.type === 'MANGA' ? { type: 'manga' } : null
      });
      this.toggleAside(false);
    },

    handleGotoRepos() {
      this.$router.push({ name: 'repos' });
    },

    handleBack() {
      if (this.$router.history.current.params.path) {
        const { dirId } = this.repo;
        this.$router.push({ name: 'explorer', params: { dirId }});
      }
      this.toggleAside(false);
    },

    handleLatest() {
      const { dirId } = this.repo;
      const path = this.$consts.LATEST_PATH;

      this.activeItem = { path };
      this.$router.push({ 
        name: 'explorer', 
        params: { dirId, path }
      });
      this.toggleAside(false);
    },

    handleRandom() {
      const { dirId } = this.repo;
      const path = this.$consts.RANDOM_PATH;

      this.activeItem = { path };
      this.$router.push({ 
        name: 'explorer', 
        params: { dirId, path }
      });
      this.toggleAside(false);
    },

    handleRefresh() {
      const { dirId } = this.repo;
      this.$refs.nestedList.reset();

      Promise.all([
        this.fetchFolders({ dirId }),
        this.fetchLatest({ dirId })
      ]).then(() => {
        this.$notify({
          title: 'Refresh Success'
        });
      });
    },

    handleCollapse() {
      this.$refs.nestedList.collapseAll();
    }
  },

   activated() {
    if (
      this.appError || // error
      (this.$route.meta.isBack && this.folderTree) // has loaded 
    ) {
      return;
    }

    this.reset();
  },

  beforeRouteUpdate(to, from, next) {
    if (
      this.appError || 
      to.params.dirId == from.params.dirId // the same route
    ) {
      return;
    }
    this.reset();
    next();
  },
}
</script>

<style lang="scss" scoped>
.explorer-header {

}

.explorer-body {
  padding: 0;
  min-height: calc(100vh - 5rem);
}

.explorer-repo-name {
  cursor: pointer;
  padding: .25rem .8rem;
  position: relative;
  z-index: 1030;
}

.explorer-latest,
.explorer-rand {
  cursor: pointer;
  padding: .5rem 0rem;
  font-size: 80%;

  .svg-icon {
    width: 2rem;
  }
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