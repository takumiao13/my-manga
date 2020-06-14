import config from '@/config';
import store from '@/store';
import { types as appTypes } from '@/store/modules/app';

function fetch$(input, options) {
  input  = config.api.BASE_URL + input;
  options || (options = {});
  options.headers || (options.headers = {});

  //if (input.indexOf('api/auth/check') == -1) {
  const { data: userData } = store.state.settings.user;
  const { data: repoData } = store.state.settings.repo;
  const data = userData || repoData;
    
  if (data) {
    if (input.indexOf('api/settings') == -1) {
      options.headers['X-APP-VERSION'] = data.version;

      // when dev mode use app-start to check version change
      if (process.env.APP_MODE == 'dev') {
        options.headers['X-APP-STARTAT'] = data.startAt;
      }
    }
  }

  // for jwt auth exclude login
  const token = store.state.app.user.token;
  if (input.indexOf('api/login') == -1 && token) {
    // token type is Bearer
    options.headers.Authorization = `Bearer ${token}`;
  }
  
  
  // error handling
  // - code [10000-19999] app error -> to Error page
  // - code [20000-] api error -> just toast it
  // - not 200 > server error
  return fetch(input, options)
    .then(res => res.json())
    .then(res => {
      if (res.code) { 
        throw res;
      } else {
        return res;
      }
    })
    // catch server error
    .catch(err => {
      if (err.name == 'AbortError') {
        //
      } else {
        err = Object.assign({
          name: 'SERVER ERROR',
          code: 500,
          message: 'Unknown Error Occured. Server response not received.'
        }, err);

        const { code } = err;

        if (code === 500 || (code >= 10000 && code < 20000)) {
          store.commit(appTypes.setError, err);
        }
      }

      throw err;
    })
}

export default fetch$;