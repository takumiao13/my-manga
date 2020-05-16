<template>
  <div id="workbench.aside.sidebar.search">
    <div class="topbar">
      <Navbar :title="title" />
    </div>
    <div class="p-3">
      <form @submit="handleSearch">
        <div class="form-group">
          <div class="input-group">
            <input 
              type="text" 
              class="form-control" 
              placeholder="Search words"
              v-model="keyword"
            />
            <!-- <div class="input-group-append">
              <button
                type="button"
                class="btn btn-outline-secondary"
                :class="{ disabled: disableToggleScope }"
                @click="handleToggleSearchScope"
              >
                <icon :name="inRepoScope ? 'warehouse' : 'folder'" />
              </button>
            </div> -->
          </div>
          <small class="form-text text-muted">
            search in current 
            <span v-if="inRepoScope">repo</span>
            <span v-else>folder with sub folders</span>
          </small>
        </div>

        <div class="form-group">
          <select class="custom-select" v-model="ver">
            <option selected value="">Please select version</option>
            <option 
              v-for="name in versions"
              :key="name"
              :value="name"
            >
              {{ name.toUpperCase() }}
            </option>
          </select>
          <small class="form-text text-muted">
            verions of manga
          </small>
        </div>

        <hr />

        <button type="submit" class="btn btn-outline-secondary btn-block search-btn">
          SEARCH
        </button>

        <button
          type="button" 
          class="btn btn-link btn-block reset-btn"
          @click="handleReset"
        >
          RESET
        </button>
      </form>
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import { types } from '@/store/modules/explorer';
import { types as appTypes } from '@/store/modules/app';

export default {
  data() {
    return {
      keyword: '',
      ver: '',
      searchInRepo: true,
      title: {
        content: 'Search',
        className: 'navbar-brand-xs'
      }
    }
  },

  computed: {
    ...mapState('explorer', [ 'versions' ]),

    ...mapGetters('app', [ 'repo' ]),

    disableToggleScope() {
      // when in root or in manga type
      // we cannot toggle search scope.
      const { params: { path }, query: { type }} = this.$route;
      return !path || type === 'manga';
    },

    inRepoScope() {
      return this.searchInRepo || this.disableToggleScope;
    }
  },

  methods: {

    handleToggleSearchScope() {
      if (this.disableToggleScope) return;
      // toggle search scope
      this.searchInRepo = !this.searchInRepo;
    },

    handleSearch($event) {
      $event.preventDefault();

      const { dirId } = this.repo;
      const { path } = this.$route.params;
      
      this.$router.push({
        name: 'explorer', 
        params: { dirId, path },
        query: { 
          search: 1,
          kw: this.keyword,
          // repo: this.searchInRepo ? 1 : 0,
          ver: this.ver
        }
      });

      this.$store.commit(appTypes.TOGGLE_ASIDE, { open: false });
    },

    handleReset() {
      const { keyword, searchInRepo, ver } = this.$options.data();
      this.keyword = keyword;
      this.ver = ver;
      this.searchInRepo = searchInRepo;
    }

  }
}
</script>

<style lang="scss" scoped>

</style>