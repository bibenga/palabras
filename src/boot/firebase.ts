import { boot } from 'quasar/wrappers';
import { FirebaseApp, initializeApp } from 'firebase/app';
import {
  Firestore,
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';
import { Auth, getAuth } from 'firebase/auth';
import firebaseConfig from './firebase.json';
import { VueFire, VueFireAuth, getCurrentUser } from 'vuefire';

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    firebase: FirebaseApp;
    fireauth: Auth;
    firestore: Firestore;
  }
}

export default boot(async ({ app, router }) => {
  const firebase = initializeApp(firebaseConfig);
  console.debug('firebase', firebase);

  const fireauth = getAuth(firebase);
  fireauth.useDeviceLanguage();
  console.debug('fireauth', fireauth);

  initializeFirestore(firebase, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
  });

  const firestore = getFirestore(firebase);
  console.debug('firestore', firestore);

  app.config.globalProperties.$firebase = firebase;
  app.config.globalProperties.$firestore = firestore;
  app.config.globalProperties.$fireauth = fireauth;

  app.provide('firebase', firebase);
  app.provide('firestore', firestore);
  app.provide('fireauth', fireauth);

  app.use(VueFire, {
    firebaseApp: firebase,
    modules: [VueFireAuth()],
  });

  router.beforeEach(async (to) => {
    // routes with `meta: { requiresAuth: true }` will check for the users, others won't
    if (to.meta.requiresAuth) {
      const currentUser = await getCurrentUser();
      // if the user is not logged in, redirect to the login page
      if (!currentUser) {
        return {
          path: '/login',
          query: {
            // we keep the current path in the query so we can redirect to it after login
            // with `router.push(route.query.redirect || '/')`
            redirect: to.fullPath,
          },
        };
      }
    }
  });
});
