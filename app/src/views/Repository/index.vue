<template>
  <div class="repos">
    <div class="topbar">
      <navbar class="d-sm-none" :title="title" :left-btns="leftBtns" />
    </div>
    
    <div class="container">

      <div class="d-none d-sm-block" style="overflow: hidden;">
        <h1 class="page-header">
          {{ title }}
        </h1>

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
          :title="!repo.accessed ? 'Repo is unaccessed' : repo.name"
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
          <icon 
            v-else-if="!repo.accessed"
            name="ban"
            class="mr-3"
          />
          <div 
            v-else
            class="svg-icon mr-3 icon-placeholder"
          />

          <strong>
            {{ repo.name }}
          </strong>
          &nbsp;
        </div>
      </div>
      
      <!--
      <div class="row">
        <div 
          class="col-12 col-md-6 mb-3"
          v-for="(repo, index) in repos"
          :key="index"
          @click="handleToggleRepo($event, repo)"
        >
          <div class="repo-item">
            <div class="repo-item-inner">
              <div 
                class="repo-item-cover"
                v-for="src in latestCovers(repo)"
                :key="src"  
              >
                <img :src="src" />
              </div>
            </div>
          </div>
          <div class="repo-item-caption">
            {{ repo.name }}
          </div>
        </div>
      </div>
      -->
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

    latestCovers(repo) {
      const { latest, dirId } = repo;
      return latest
        .filter(item => item.cover)
        .map(item => {
          return this.$service.image.makeSrc(item.cover, false, dirId)
        })
        .slice(0, 3);
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
      if (repo.dirId === this.repoId) {
        // when come from repo click
        if (this.$router.canGoBack()) {
          console.log('repo back');
          this.$router.go(-1);
          return;

        // when come from browser back
        } else if (this.$router.delta()) {
          console.log('repo forward');
          this.$router.go(1);
          return;
        }
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
  font-weight: 100;
  text-align: center;
}

.list-group {
  margin-left: -15px;
  margin-right: -15px;
  
  .list-group-item {
    text-decoration: none;
    border-radius: 0;
    border-width: .5px 0;
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

  .list-group-item + .list-group-item {
    border-top-width: 0;
  }

  @include media-breakpoint-up(sm) {
    margin-left: 0;
    margin-right: 0;
  }
}

.icon-placeholder {
  display: inline-block;
  width: 16px;
  height: 16px;
}

.repo-item {
  position: relative;
  background: #ddd;
  padding: 0px 0px 48%;
  margin-bottom: .25rem;
  border-radius: .25rem;
  overflow: hidden;
}

.repo-item-inner {
  font-size: 1.5rem;
  cursor: pointer;

  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;

  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}

.repo-item-cover {
  height: 100%;
  width: 33.3%;
  overflow: hidden;

  > img {
    max-height: 100%;
  }
}
</style>
