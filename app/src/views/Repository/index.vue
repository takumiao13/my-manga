<template>
  <div class="repos">
    <div class="topbar">
      <navbar class="d-sm-none" :title="title" :left-btns="leftBtns" />
    </div>
    
    <div class="container">

      <div class="d-none d-sm-block" style="overflow: hidden;">
        <h1 class="page-header">{{ title }}</h1>

        <div>
          <button 
            v-if="isElectron"
            class="btn"
            @click="handleSelectRepo"
          >
            <icon name="plus" />
            Add Repository
          </button>
        </div>
        
      </div>

      <p class="my-3 text-muted" style="font-size: 80%;">
        REPOS - {{ repos.length }} items
      </p>

      <div class="list-group">
        <div 
          :class="['list-group-item', 'text-truncate', { disabled: !repo.accessed }]"
          v-for="(repo, index) in repos"
          :key="index"
          @click="handleToggleRepo($event, repo)"
        >
          <div class="list-group-item-actions" v-if="isElectron">
            <button 
              class="btn" 
              @click="handleRemoveRepo($event, repo)"
            >
              <icon name="trash" />
            </button>
          </div>

          <icon 
            v-if="repo.dirId === repoId"
            name="check"
            class="mr-3"
          />
          <div 
            v-else
            class="svg-icon mr-3"
            style="display: inline-block; width: 16px; height: 16px;"
          />

          <strong>{{ repo.name }}</strong>&nbsp;
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import EventEmitter from '@/helpers/eventemitter';
import platform from '@/helpers/platform';
import { types } from '@/store/modules/settings';
import { mapGetters, mapState } from 'vuex';

const isElectron = platform.isElectron();
const ipc = isElectron ? window.require('electron').ipcRenderer : null;

export default {
  name: 'Repository',

  data() {
    return {
      isElectron,
      title: 'Repository'
    }
  },

  computed: {
    ...mapState('app', [ 'repoId' ]),
    
    ...mapGetters('settings/user', [ 'settings', 'repos' ]),

    leftBtns() {
      return this.$router.canGoBack() ? [{
        icon: 'arrow-left',
        click: this.handleBack
      }] : null;
    }
  },

  created() {
    isElectron && ipc.on('selected-file', this.handleAddRepo);
  },

  destroyed() {
    isElectron && ipc.removeListener('selected-file', this.handleAddRepo);
  },

  methods: {
    repoItem(repo) {
      return repo
    },

    handleAddRepo(event, paths) {
      const path = paths[0];
      const scope = 'user';
      const index = this.repos.length;
      const payload = { key: `repos[${index}]`, value: path };

      // sync to settings
      this.$store.dispatch(types[scope].SET, payload)
        .then(() => {
          // create done
        })
    },

    handleSelectRepo() {
      isElectron && ipc.send('open-file-dialog');
    },

    handleToggleRepo($event, repo) {
      if (!repo.accessed) return;

      // 1.not from error page
      // 2.repo is not changed 
      // 3.can go back
      // then we just back it
      if (repo.dirId === this.repoId && this.$router.canGoBack()) {
        this.$router.go(-1);
        return;
      }
    
      // we should reset store to change repo 
      EventEmitter.$emit('store.reset', repo);
    },

    handleRemoveRepo($event, repo) {
      $event.stopPropagation();
      const index = this.repos.map(item => item.dirId).indexOf(repo.dirId);
      const scope = 'user';
      const payload = { key: `repos[${index}]` };

      if (index > -1) {
        this.$store.dispatch(types[scope].UNSET, payload)
          .then(() => {
            // remove done; tip later
          })
      }
    },

    handleBack() {
      this.$router.go(-1);
    }
  }
}
</script>

<style lang="scss" scoped>
@import '../../assets/style/base';

.page-header {
  margin: 3rem 0 2rem 0;
  font-size: 3rem;
  font-weight: 100;
  text-align: center;
}

.list-group {
  margin-left: -15px;
  margin-right: -15px;
  
  .list-group-item {
    text-decoration: none;
    border-radius: 0;
    border-width: 1px 0;
    padding-left: 1rem;
    padding-right: 3rem;
    cursor: pointer;

    // fixed allow remove repo when it is unaccessed.
    &.disabled {
      pointer-events: auto;
    }

    @include media-breakpoint-up(sm) {
      border-width: 1px;
    }

    .list-group-item-actions {
      position: absolute;
      right: .5rem;
      top: 0;
      padding: .3rem 0;
    }
  }

  @include media-breakpoint-up(sm) {
    margin-left: 0;
    margin-right: 0;
  }
}
</style>
