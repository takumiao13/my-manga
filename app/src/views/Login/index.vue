<template>
  <div class="login-container">
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

        <button type="submit" @click="login" class="btn btn-lg btn-primary btn-block mt-3">
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
    ...mapActions('app', ['setUser']),

    ...mapMutations('app', ['setError']),

    login($event) {
      const $form = this.$refs.form;
      $event.preventDefault();

      if (this.form.username === '' || this.form.password === '') {
        this.errMsg = 'Username or password can not empty.';
      } else {
        if ($form.submitted) {
          return;
        }

        $form.submitted = true;
        this.setUser(this.form)
          .then(() => Promise.all([
            this.$store.dispatch(settingTypes.user.INIT),
            this.$store.dispatch(settingTypes.repo.INIT)
          ]))
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
@import '../../assets/style/base';

.login-container {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
}

.login-box {
  position: absolute;
  top: 40%;
  left: 50%;
  transform: translate(-50%, -50%);

  padding: 0 1rem;
  margin: 0 auto;
  border-radius: .5rem;
  width: 100%;
  
  @include media-breakpoint-up(sm) {
    width: 450px;
    min-height: 500px;
    border: 1px solid #ddd;
    padding: 48px 40px 64px;
    background: #fff;
  }
}

.logo-icon {
  display: block;
  margin: 0 auto;
  margin-bottom: 1.5rem;
  color: $primary;
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