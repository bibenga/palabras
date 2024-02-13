import { boot } from 'quasar/wrappers';
import { FirebaseApp, initializeApp } from 'firebase/app';
import {
  Firestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';
import { Auth, getAuth } from 'firebase/auth';
import firebaseConfig from './firebase.json';

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $firebase: FirebaseApp;
    $fireauth: Auth;
    $firestore: Firestore;
  }
}

export default boot(async ({ app, router }) => {
  const firebase = initializeApp(firebaseConfig);
  console.debug('firebase', firebase);

  const fireauth = getAuth(firebase);
  fireauth.useDeviceLanguage();
  console.debug('fireauth', fireauth);

  const firestore = initializeFirestore(firebase, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
  });
  // const firestore = getFirestore(firebase);
  console.debug('firestore', firestore);

  app.config.globalProperties.$firebase = firebase;
  app.config.globalProperties.$firestore = firestore;
  app.config.globalProperties.$fireauth = fireauth;

  app.provide('firebase', firebase);
  app.provide('firestore', firestore);
  app.provide('fireauth', fireauth);

  router.beforeEach(async (to) => {
    // routes with `meta: { requiresAuth: true }` will check for the users, others won't
    await fireauth.authStateReady();
    console.log(`[firebase.beforeEach]: to=${to.path}`);
    const authUser = fireauth.currentUser;
    if (authUser) {
      const loginRoutes = ['/login', '/register'];
      if (loginRoutes.includes(to.path)) {
        return { path: '/dashboard' };
      }
    } else {
      if (to.meta.requiresAuth) {
        return { path: '/login', query: { redirect: to.fullPath } };
      }
    }
  });
});
