const state={
  name:''
};
const getters={
  getName(state){ 
    return state.name;
  }
};
const mutations={
  setName(state,val){ 
    state.name = val;
  }
};
const actions={
  setName(context,val){ 
    context.commit('setName',val);
  }
};
export default {
  namespaced:true,//用于在全局引用此文件里的方法时标识这一个的文件名
  state,
  getters,
  mutations,
  actions
};