import Vue from 'vue'
import App from '@/maskMap/Index.vue'
import utils from '@/common/js/utils';
import projectUtils from '@/maskMap/js/utils';
import router from '@/maskMap/js/router';
import store from '@/maskMap/js/store';
import i18n from '@/maskMap/lang'
import ElementUI from 'element-ui';
import api from '@/common/js/requestApi';
import md5 from 'md5';
import map from '@/maskMap/js/map'
import '@/common/js/date-zh-CN.js';
import '@/common/css/reset.css';
import '@/maskMap/css/theme/element-variables.scss';
import '@/common/css/base.css';
import '@/maskMap/css/project.scss';

/*公共资源挂载*/
for (var name in utils) {
  Vue.prototype['$' + name] = utils[name];
}
for (var name1 in projectUtils) {
  Vue.prototype['$' + name1] = projectUtils[name1];
}
Vue.prototype.$md5 = md5;
Vue.prototype.$api = api({'ElementUI':ElementUI});
Vue.prototype.$map = map;
/*全局引入ElementUI*/
Vue.use(ElementUI, { size: 'small' });
/*定义vue对象，挂载根组件*/
new Vue({
  el: '#app',
  i18n: i18n(Vue),
  router: router(Vue),
  store: store(Vue),
  render: h => h(App)
})
