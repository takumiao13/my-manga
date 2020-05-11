<template>
  <div id="workbench.aside.sidebar.search">
    <div class="topbar">
      <navbar :title="title" />
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
              required
            />
            <!-- <div class="input-group-append">
              <button
                type="button"
                class="btn btn-outline-secondary"
                @click="handleChangeSearchScope"
              >

              </button>
            </div> -->
          </div>
          <small class="form-text text-muted">
            Search in current repo. 
            <!-- Search in current folder with sub folders. -->
          </small>
        </div>


        <button type="submit" class="btn btn-outline-secondary btn-block search-btn">
          SEARCH
        </button>
      </form>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import { types } from '@/store/modules/app';

export default {
  data() {
    return {
      keyword: '',
      title: {
        content: 'Search',
        className: 'navbar-brand-xs'
      }
    }
  },

  computed: {
    ...mapGetters('app', [ 'repo' ]),
  },

  methods: {

    handleChangeSearchScope() {
      
    },

    handleSearch($event) {
      $event.preventDefault();

      const { dirId } = this.repo;
      //this.$store.dispatch(types.SEARCH, { dirId, keyword: this.keyword });
      this.$router.push({
        name: 'explorer', 
        params: { dirId },
        query: { search: 1, kw: this.keyword }
      });

      this.$store.commit(types.TOGGLE_ASIDE, { open: false });
    }

  }
}
</script>

<style lang="scss" scoped>

</style>