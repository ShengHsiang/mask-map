import vueRouter from 'vue-router';

export default function (vue) {
  vue.use(vueRouter);
  var router = new vueRouter({ routes: routes });

  /*路由守卫*/
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
    name: 'page404',
    path: '/404',
    component: () => import('../../common/compontent/404.vue'),
  }
];
