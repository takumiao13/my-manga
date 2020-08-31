<template>
  <div id="app.error" class="error-container" v-if="error">
    <div>
      <div class="error-icon">
        <icon :name="error.icon" size="100" />
      </div>

      <h3 class="error-title">{{ error.name }}</h3>

      <p class="error-message">{{ error.message }}</p>

      <p class="error-code">Error Code: {{ error.code }}</p>

      <p>
        <button 
          v-if="error.code === 500"
          class="btn btn-outline-secondary" 
          @click="handleTryRefresh"
        >
          TRY REFRESH
        </button>

        <button
          v-else-if="error.code === 10200"
          class="btn btn-outline-secondary" 
          @click="handleBackLogin"
        >
          BACK LOGIN
        </button>

        <button 
          v-else 
          class="btn btn-outline-secondary" 
          @click="handleBackHome"
        >
          BACK HOME
        </button>
      </p>
    </div>
  </div>
</template>

<script>
import { mapState, mapMutations } from 'vuex';

export default {
  computed: {
    ...mapState('app', ['error'])
  },

  methods: {    
    ...mapMutations('app', ['setError']),

    handleBackHome() {
      this.setError(null);
      this.$router.replace({ name: 'home' });
    },

    handleBackLogin() {
      this.$router.replace({ name: 'login' });
    },

    handleTryRefresh() {
      location.replace('/');
    }
  }
}
</script>

<style lang="scss" scoped>
.error-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 4000;

  > div {
    width: 100%;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translateX(-50%) translateY(-50%);
    text-align: center;
  }

  .error-icon {
    margin-bottom: 2rem;
  }

  .error-title {
    padding: 0 1rem;
    margin: 0;
  }

  .error-message {
    max-width: 480px;
    padding: 1rem;
    margin: 0 auto;
  }
}
</style>