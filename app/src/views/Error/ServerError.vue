<template>
  <div id="app-error">
    <div>
      <div class="error-icon">
        <icon :name="error_.icon" size="100" />
      </div>

      <h3 class="error-title">{{ error_.name }}</h3>

      <p class="error-message">{{ error_.message }}</p>

      <p class="error-code">Error Code: {{ error_.code }}</p>

      <p>
        <button class="btn btn-primary" @click="handleBackHome">BACK HOME</button>
      </p>
    </div>
  </div>
</template>

<script>
const DEFAULT_ERROR = {
  name: 'THAT\'S AN ERROR',
  icon: 'exclamation-triangle',
  message: 'An error has occurred and we\'re working to fix the problem.'
};

export default {
  name: 'ServerError',

  props: {
    error: Object
  },

  computed: {
    error_() {
      return Object.assign({}, DEFAULT_ERROR, this.error || {});
    }
  },

  methods: {
    handleBackHome() {
      this.$router.push({ name: 'home' });
    }
  }
}
</script>

<style lang="scss" scoped>
#app-error {
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
    color: #999;
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

  .error-code {
    color: #999;
  }
}
</style>