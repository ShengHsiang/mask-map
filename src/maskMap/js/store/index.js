import Vuex from 'vuex';
import user from './modules/user'

export default function(vue){
  vue.use(Vuex);
  return new Vuex.Store({
    modules:{
     user
    }
  });
};
