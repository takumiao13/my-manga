import config from '@/config';

class Service {
  constructor({ store, router }) {
    this.$config = config;
    this.$store = store;
    this.$router = router;
  }
}

export default Service;