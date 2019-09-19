<template>
  <div class="repos">
    <div class="topbar">
      <navbar class="d-sm-none" :title="title" :left-btns="leftBtns" />
    </div>
    
    <div class="container">

      <div class="d-none d-sm-block" style="overflow: hidden;">
        <h1 class="page-header">{{ title }}</h1>

        <div>
          <button class="btn" v-if="inElectron" @click="handleSelectRepo">
            <icon name="plus" />
            New Repository
          </button>
        </div>
        
      </div>

      <div class="list-group mt-3">
        <div class="list-group-item text-truncate"
          :class="{ disabled: !repo.accessed }"
          v-for="(repo, index) in repos"
          :key="index"
          @click="handleToggleRepo($event, repo)"
        >
          <div class="list-group-item-actions" v-if="inElectron">
            <button class="btn" @click="handleRemoveRepo($event, repo)">
              <icon name="trash" />
            </button>
          </div>

          <icon 
            v-if="repo.dirId === repoId"
            name="check"
            size="20" 
            class="text-success mr-2"
          />

          <div 
            v-if="repo.dirId !== repoId"
            class="svg-icon mr-2"
            style="display: inline-block; width: 20px; height: 20px;"
          />

          <strong>{{ repo.name }}</strong>&nbsp;
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { inElectron, eventHub } from '@/helpers';
import settingsAPI from '@/apis/settings';
import { resetStore } from '@/store';
import { types as appTypes } from '@/store/modules/app';
import { types } from '@/store/modules/settings';
import { mapGetters, mapState } from 'vuex';

const ipc = inElectron ? window.require('electron').ipcRenderer : null;

export default {
  name: 'Repository',

  data() {
    return {
      inElectron,
      title: 'Manga Repository',
      leftBtns: [{
        icon: 'back',
        click: this.handleBack
      }]
    }
  },

  computed: {
    ...mapState('app', [ 'repoId' ]),
    
    ...mapGetters('settings/user', [ 'settings', 'repos' ])
  },

  created() {
    inElectron && ipc.on('selected-file', this.handleAddRepo);
  },

  destroyed() {
    inElectron && ipc.removeListener('selected-file', this.handleAddRepo);
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

    handleSelectRepo($event) {
      inElectron && ipc.send('open-file-dialog');
    },

    handleToggleRepo($event, repo) {      
      // 1.not from error page
      // 2.repo is not changed 
      // 3.can go back
      // then we just back it
      debugger;
      if (repo.dirId === this.repoId && this.$router.canGoBack()) {
        this.$router.go(-1);
        return;
      }
    
      // we should reset store to change repo 
      eventHub.$emit('store.reset', repo);
    },

    handleRemoveRepo($event, repo) {
      $event.stopPropagation();
      const index = this.repos.map(item => item.path).indexOf(repo);
      const scope = 'user';
      const payload = { key: `repos[${index}]` };

      if (index > -1) {
        this.$store.dispatch(types[scope].SET, payload)
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
  margin: 2rem 0 1rem 0;
  font-size: 2rem;
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
