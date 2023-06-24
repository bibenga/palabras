import { boot } from 'quasar/wrappers';
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

import firebaseConfig from './firebase.json';

export default boot(({ app, router }) => {
  try {
    const firebase = initializeApp(firebaseConfig);
    const firestore = getFirestore(firebase);
    const fireauth = getAuth(firebase);
    console.log('firebase', firebase);
    console.log('firestore', firestore);
    console.log('fireauth', fireauth);

    app.config.globalProperties.$firebase = firebase;
    app.config.globalProperties.$firestore = firestore;
    app.config.globalProperties.$fireauth = fireauth;

    app.provide('firebase', firebase);
    app.provide('firestore', firestore);
    app.provide('fireauth', fireauth);
  } catch (e) {
    console.log(e);
    app.provide('firebase', null);
    app.provide('firestore', null);
    app.provide('fireauth', null);
  }
});
