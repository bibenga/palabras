import { boot } from 'quasar/wrappers';
import axios, { AxiosInstance } from 'axios';
import { inject } from 'vue';

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $api: AxiosInstance;
    $axios: AxiosInstance;
  }
}

export default boot(({ app }) => {
  const api = axios.create({ baseURL: '' });

  app.config.globalProperties.$api = api;
  app.config.globalProperties.$axios = axios;

  app.provide('$api', api);
  app.provide('$axios', axios);
});

const useApi = (): AxiosInstance => {
  const api = inject<AxiosInstance>('$api');
  if (api == undefined) {
    throw new Error('an api is not defined');
  }
  return api;
};

export { useApi };
