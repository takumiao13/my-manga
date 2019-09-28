import config from '@/config';
import store from '@/store';
import { types as appTypes } from '@/store/modules/app';

function fetch$(input, options) {
  input  = config.baseURL + input;
  return fetch(input, options)
    .then(res => res.json())
    .then(res => {
      const { code } = res;
      if (code >= 10000 && code < 20000) {
        // replace error view but not change url
        store.dispatch(appTypes.ERROR, res);
        //eventHub.$emit('server.error', res);
      }

      if (code) { 
        throw res;
      } else {
        return res;
      }
    })
}

export default fetch$;