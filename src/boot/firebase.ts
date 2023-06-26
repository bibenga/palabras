import { boot } from 'quasar/wrappers';
import { FirebaseApp, initializeApp } from 'firebase/app';
import { Firestore, getFirestore } from 'firebase/firestore';
import { Auth, getAuth } from 'firebase/auth';
import { inject } from 'vue';
import firebaseConfig from './firebase.json';

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    firebase: FirebaseApp;
    fireauth: Auth;
    firestore: Firestore;
  }
}

export default boot(({ app }) => {
  const firebase = initializeApp(firebaseConfig);
  console.debug('firebase', firebase);

  const fireauth = getAuth(firebase);
  fireauth.useDeviceLanguage();
  console.debug('fireauth', fireauth);

  const firestore = getFirestore(firebase);
  console.debug('firestore', firestore);

  app.config.globalProperties.$firebase = firebase;
  app.config.globalProperties.$firestore = firestore;
  app.config.globalProperties.$fireauth = fireauth;

  app.provide('firebase', firebase);
  app.provide('firestore', firestore);
  app.provide('fireauth', fireauth);
});

const useAuth = (): Auth => {
  const fireauth = inject<Auth>('fireauth');
  if (fireauth == undefined) {
    throw new Error('a fireauth is not defined.');
  }

  // const isAuthenticationReady = ref(false);
  // const isAuthenticated = ref(false);
  // const user = ref<User | null>();
  // onAuthStateChanged(fireauth, (newUser) => {
  //   isAuthenticationReady.value = true;
  //   isAuthenticated.value = newUser != null;
  //   user.value = newUser;
  //   if (newUser) {
  //     console.log('[app.auth] logged in', user);
  //   } else {
  //     console.log('[app.auth] logged out');
  //   }
  // });

  return fireauth;
};

const useFirestore = (): Firestore => {
  const firestore = inject<Firestore>('firestore');
  if (firestore == undefined) {
    throw new Error('a firestore is not defined.');
  }
  return firestore;
};

export { useAuth, useFirestore };
