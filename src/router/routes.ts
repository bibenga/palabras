import { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/IndexPage.vue') },
      { path: 'login', component: () => import('pages/LoginPage.vue') },
      {
        path: 'register',
        component: () => import('pages/RegisterPage.vue'),
      },
      {
        path: 'word',
        component: () => import('pages/WordListPage.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'word/:id',
        props: true,
        component: () => import('pages/WordEditPage.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'learn/translation',
        component: () => import('pages/WordLearnTranslationPage.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'learn/choice',
        component: () => import('pages/WordLearnChoice.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'progress',
        component: () => import('pages/WordProgressPage.vue'),
        meta: { requiresAuth: true },
      },
    ],
  },

  // {
  //   path: '/login',
  //   component: () => import('pages/LoginPage.vue'),
  // },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
