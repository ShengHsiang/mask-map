import vueRouter from 'vue-router';

export default function (vue) {
  vue.use(vueRouter);
  var router = new vueRouter({ routes: routes });

  /* 路由守衛 */
  router.beforeEach(function (to, from, next) {
    next();
  });

  return router;
}

const routes = [
  {
    path: '/',
    component: () => import('../pages/Map.vue')
  },
  {
    path: '/triple',
    component: () => import('../pages/tripleStimulusVouchers.vue')
  },
  {
    name: 'page404',
    path: '/404',
    component: () => import('../../common/compontent/404.vue'),
  }
];
