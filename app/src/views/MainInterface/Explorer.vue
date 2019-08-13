<template>
  <div class="explorer">
    <div class="topbar">
      <navbar :title="title" :right-btns="rightBtns" />
    </div>
    
    <data-view 
      class="explorer-container"
      :loading="isPending" 
      :empty="empty"
    >
      <div class="repo-name" @click="handleBack">{{ repoName }}</div>
      <nested-list 
        v-show="isSuccess"  
        :props="treeProps"
        :data="folders"
        @on-expanded="handleItemExpanded"
        @on-selected="handleItemSelected" 
      />
    </data-view>
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
        click: this.handleCloseSidebar
      },

      treeProps: {
        key: 'name',
        className: (item) => {
          return item._mangaGroup ? 'manga-group-item' : ''
        },
        label: (item) => {
          if (item._mangaGroup) {
            return `<span class="manga-group-btn">${item.children.length} mangas</span>`;
          } else {
            return item.name;
          }
        },
        title: 'name',
        children: 'children',
        isBranch: (item) => item._mangaGroup || item.type === 'FOLDER' && item.hasChildren
      }
    }
  },

  computed: {
    ...mapState('explorer', [ 'folders', 'empty' ]),
    
    ...mapState('settings/user', {
      allowChangeRepos(state) {
        return !!state.data;
      }
    }),

    ...mapGetters('settings/user', [ 'repoName' ]),

    ...mapGetters('explorer', [ 'isPending', 'isSuccess', 'empty' ]),

    rightBtns() {
      return this.allowChangeRepos ? [{
        icon: 'folders',
        click: this.handleGotoRepos,
        tip: 'change repository'
      }] : null;
    }
  },

  activated() {
    if (!this.$route.meta.isBack) {
      this.fetchFolders();
    }
  },

  methods: {
    fetchFolders() {
      this.$store.dispatch(types.FETCH);
    },

    // events
    handleItemExpanded(item, ctx) {
      if (item._mangaGroup) return;
      if (/success|pending/.test(ctx.getStatus())) return;
      
      // maybe use two-way bingding later
      // faster then vuex (but we cannot use strict mode)
      ctx.setStatus('pending');
      this.$store.dispatch(types.FETCH, {
        path: item.path
      }).then(res => {
        ctx.setStatus('success');
      }).catch(err => {
        ctx.setStatus('error');
      });
    },

    handleItemSelected(item, ctx) {
      if (item._mangaGroup) {
        ctx.isOpen = !ctx.isOpen;
        return;
      };
      this.$emit('selected', item);
    },

    handleGotoRepos() {
      this.$router.push({ name: 'repos' });
    },

    handleCloseSidebar() {
      this.$store.dispatch(appTypes.TOGGLE_SIDEBAR, { open: false });
    },

    handleBack() {
      if (this.$router.history.current.fullPath !== '/manga') {
        this.$router.push({ name: 'explorer' });
      }
      
      this.$store.dispatch(appTypes.TOGGLE_SIDEBAR, { open: false });
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

.repo-name {
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
      background: #fff;
      border-top: .5px solid #ddd;
      border-bottom: .5px solid #ddd;
    }

    .list-nested-label {
      margin-left: 0;
    }
  }

  .manga-group-btn {
    border: 1px solid #999;
    border-radius: 100px;
    padding: .1rem .5rem .2rem;
  }
}
</style>