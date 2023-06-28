import { boot } from 'quasar/wrappers';
import { FirebaseApp, initializeApp } from 'firebase/app';
import { Firestore, getFirestore } from 'firebase/firestore';
import { Auth, User, getAuth } from 'firebase/auth';
import { Ref, inject, ref } from 'vue';
import firebaseConfig from './firebase.json';

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    firebase: FirebaseApp;
    fireauth: Auth;
    firestore: Firestore;
  }
}

export default boot(async ({ app }) => {
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

const useAuth = (): {
  fireauth: Auth;
  isReady: Ref<boolean>;
  isAuthenticated: Ref<boolean>;
  user: Ref<User | null | undefined>;
} => {
  const fireauth = inject<Auth>('fireauth');
  if (fireauth == undefined) {
    throw new Error('the fireauth is not defined.');
  }

  const user = ref<User | null>();
  const isReady = ref(false);
  const isAuthenticated = ref(false);
  fireauth.onAuthStateChanged((authUser) => {
    console.debug('user ->', authUser);
    isReady.value = true;
    isAuthenticated.value = authUser != null;
    user.value = authUser;
  });

  return { fireauth, isReady, isAuthenticated, user };
};

const useFirestore = (): Firestore => {
  const firestore = inject<Firestore>('firestore');
  if (firestore == undefined) {
    throw new Error('a firestore is not defined.');
  }
  return firestore;
};

export { useAuth, useFirestore };
