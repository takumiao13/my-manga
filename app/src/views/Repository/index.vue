<template>
  <div class="repos">
    <navbar class="d-sm-none" :title="title" :left-btns="leftBtns" />
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
          v-for="(repo, index) in repos"
          :key="index"
          @click="handleToggleRepo($event, repo.path)"
        >
          <div class="list-group-item-actions" v-if="inElectron">
            <button class="btn" @click="handleRemoveRepo($event, repo.path)">
              <icon name="trash" />
            </button>
          </div>

          <icon 
            v-if="repo.path === baseDir"
            name="check"
            size="20" 
            class="text-success mr-2"
          />

          <div 
            v-if="repo.path !== baseDir"
            class="svg-icon mr-2"
            style="display: inline-block; width: 20px; height: 20px;"
          />

          <strong>{{ repo.name }}</strong>&nbsp;
          <small>{{ repo.dir }}</small>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { inElectron, eventHub } from '@/helpers';
import settingsAPI from '@/apis/settings';
import { resetStore } from '@/store';
import { types } from '@/store/modules/settings';
import { mapGetters } from 'vuex';

const ipc = inElectron ? window.require('electron').ipcRenderer : null;

export default {
  name: 'Repository',

  data() {
    return {
      inElectron,
      title: 'My Repository',
      leftBtns: [{
        icon: 'back',
        click: this.handleBack
      }]
    }
  },

  computed: {
    ...mapGetters('settings/user', [ 'settings', 'repos', 'baseDir', 'repoName' ])
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
      if (repo === this.baseDir) {
        this.$router.go(-1);
        return;
      }

      const scope = 'user';
      const payload = { key: 'baseDir', value: repo };

      this.$store.dispatch(types[scope].SET, payload)
        .then(() => this.$store.dispatch(types['repo'].INIT))
        .then(() => {
          // we should reset store
          eventHub.$emit('store.reset', { repoName: this.repoName });
          //this.$router.push({ name: 'explorer' });
        });
    },

    handleRemoveRepo($event, repo) {
      $event.stopPropagation();
      const index = this.repos.indexOf(repo);
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
