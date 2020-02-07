import VueI18n from 'vue-i18n';
import zhCN from './lib/zh-CN.json';
import en from './lib/en.json';
import el_en from 'element-ui/lib/locale/lang/en';
import el_zh_CN from 'element-ui/lib/locale/lang/zh-CN';
import elLocale from 'element-ui/lib/locale';

export default function(vue){
  vue.use(VueI18n);
  const zhLang = vue.prototype.$extend(true,{},zhCN,el_zh_CN);
  const enLang = vue.prototype.$extend(true,{},en,el_en);
  const messages = {
    'zh-CN': zhLang,
    'en': enLang
  };
  const i18n = new VueI18n({
    locale : 'zh-CN',
    messages : messages
  });
  elLocale.i18n((key, value) => i18n.t(key, value));

  return i18n;
}
