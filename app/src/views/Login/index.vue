<template>
  <div id="app.login" class="login-container">
    <div class="login-box">
    <icon class="logo-icon" name="logo" size="80" />
    <h3>Please Login</h3>
      <form ref="form">
        <div class="form-group">
          <div class="input-group mb-2">
            <input 
              type="text"
              name="username"
              v-model="form.username"
              class="form-control form-control-lg"
              autocomplete="off"
              placeholder="username"
            />
          </div>
        </div>

        <div class="form-group mb-2">
          <div class="input-group">
            <input
              type="password"
              name="password"
              v-model="form.password"
              class="form-control form-control-lg"
              autocomplete="current-password"
              placeholder="passwod"
            />
          </div>
        </div>
        <div class="invalid-feedback">
          {{ errMsg || '&nbsp;' }}
        </div>

        <button type="submit" @click="handleLogin" class="btn btn-lg btn-primary btn-block mt-3">
          LOGIN
        </button>
      </form>
    </div>
  </div>
</template>
 
<script>
import { mapActions, mapMutations } from 'vuex';
import { types as settingTypes } from '@/store/modules/settings';

export default {
  data () {
    return {
      form: {
        username: '',
        password: ''
      },
      errMsg: '',
      appLogoPath: process.env.APP_LOGO,
    };
  },

  watch: {
    form: {
      handler(val) {
        if (val.username || val.password) {
          this.errMsg = '';
        }
      },
      deep: true
    }
  },
 
  methods: {    
    ...mapActions('app', ['login']),

    ...mapMutations('app', ['setError']),

    handleLogin($event) {
      const $form = this.$refs.form;
      $event.preventDefault();

      if (this.form.username === '' || this.form.password === '') {
        this.errMsg = 'Username or password can not empty.';
      } else {
        if ($form.submitted) {
          return;
        }

        $form.submitted = true;
        this.login(this.form)
          .then(() => {
            return this.$store.dispatch(settingTypes.user.init)
          })
          .then(() => {
            this.setError(null);
            this.$router.push({ name: 'home' });
            $form.submitted = false;
          })
          .catch(err => {
            $form.submitted = false;
            this.errMsg = err.message;
          });
      }
    }
  }
};
</script>

<style lang="scss" scoped>
@import '@/assets/style/base';

.login-container {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
}

.login-box {
  position: absolute;
  top: 45%;
  left: 50%;
  transform: translate(-50%, -50%);

  padding: 0 1rem;
  margin: 0 auto;
  border-radius: .5rem;
  width: 100%;
  
  @include media-breakpoint-up(sm) {
    width: 450px;
    min-height: 500px;
    padding: 48px 40px 64px;
  }
}

.logo-icon {
  display: block;
  margin: 0 auto;
  margin-bottom: 1.5rem;
}

h3 {
  font-weight: 100;
  text-align: center;
  margin-bottom: 1.5rem;
}

.invalid-feedback {
  display: block;
}
</style>