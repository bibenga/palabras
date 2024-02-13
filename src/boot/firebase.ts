import { boot } from 'quasar/wrappers';
import { initializeApp } from 'firebase/app';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import firebaseConfig from './firebase.json';
import { VueFire, VueFireAuth, getCurrentUser } from 'vuefire';

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

  app.use(VueFire, {
    firebaseApp: firebase,
    modules: [VueFireAuth()],
  });

  router.beforeEach(async (to) => {
    // routes with `meta: { requiresAuth: true }` will check for the users, others won't
    const authUser = await getCurrentUser();
    console.log(`[firebase.beforeEach]: to=${to.path}, user=${authUser?.uid}`);
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
