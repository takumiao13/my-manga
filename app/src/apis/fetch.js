import config from '@/config'; 

function fetch$(input, options) {
  input  = config.baseURL + input;
  return fetch(input, options).then(res => res.json());
}

export default fetch$;