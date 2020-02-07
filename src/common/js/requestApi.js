import axios from 'axios';
import baseConfig from '@/baseConfig';

const statusMsg = {
	'400':'请求错误！',
	'401':'未授权！',
	'403':'拒绝访问！',
	'404':'请求地址出错: ',
	'408':'请求超时！',
	'500':'服务器内部错误！',
	'501':'服务未实现！',
	'502':'网关错误！',
	'503':'服务不可用！',
	'504':'网关超时！',
	'505':'HTTP版本不受支持！'
}

var httpAjax = function(options={}) {
	if (options.ElementUI) {
		this.ElementUI = options.ElementUI;
	}
	this.service = axios.create({
		withCredentials:true,  // 允许请求头带cookie,跨域时需要后端匹配跨域凭证
		timeout: baseConfig.timeout  // 请求超时时间
	});
	this.resetConfigHeaders = function(headers){ return headers;};
	if (options.resetConfigHeaders && (typeof options.resetConfigHeaders == 'function')) {
		this.resetConfigHeaders = options.resetConfigHeaders;
	}
	this.handleEspecialErrCode = function(response){ return response;};
	if (options.handleEspecialErrCode && (typeof options.handleEspecialErrCode == 'function')) {
		this.handleEspecialErrCode = options.handleEspecialErrCode;
	}
	this.resetRequestHeaders = function(headers,method){
		if (method == 'post' || method == 'put') {
			headers['Content-Type'] = 'application/json;charset=UTF-8';
		} else if (method == 'post' || method == 'put') {
			headers['Cache-Control'] = 'no-cache';
		}
		headers = this.resetConfigHeaders(headers);
		return headers;
	}
	
	this.service.interceptors.request.use(config => {
		let auth = config.auth;
		delete config.auth;
		config.url = this.dealUrl(auth.appName,config.url);
		if (!auth.appName) auth.appName = baseConfig.app;
		config.excessParams = auth;
		config.headers = this.resetRequestHeaders(config.headers,config.method);
		return config;
	}, error => {  //请求错误处理
		try{
			if (error.request.config.excessParams.warn && this.ElementUI) {
				this.ElementUI.Message.error(baseConfig.defaultErrMsg);
			}
		}catch(e){ }
	  console.log('beforeSend',JSON.stringify(error));
	  Promise.reject(error)
	});
	
	this.service.interceptors.response.use(response => {  //成功请求到数据
	    if (response.status === 200) {
	      let res = response.data;
	      if (res.code === '0') {
	        return res.data;
	      } else {
	        let err = res.msg;
	        if (!err) {
	          err = baseConfig.defaultErrMsg;
	        }
	        if (response.config.excessParams.warn && this.ElementUI) {
	          this.ElementUI.Message.error(err);
	        }
					this.handleEspecialErrCode.call(window,res);
	        return Promise.reject(res);
	      }
	    } else {
	      let err = response.statusText;
	      if (!err) {
	        err = baseConfig.defaultErrMsg;
	      }
	      if (response.config.excessParams.warn && this.ElementUI) {
	        this.ElementUI.Message.error(err);
	      }
	      return Promise.reject(err);
	    }
	  },
	  error => {  //响应错误处理
	    if (error.response.config.excessParams.warn && this.ElementUI) {
				let msg = null,codeStr='';
				try{
					codeStr=error.response.status.toString();
				}catch(e){}
				if (statusMsg[codeStr]){
					msg = statusMsg[codeStr];
					if (codeStr==='404'){
						msg += error.response.config.url;
					} 
				}
	      if (!msg) {
	        msg = baseConfig.defaultErrMsg
	      }
	      this.ElementUI.Message.error(msg);
	    }
	    console.log(JSON.stringify(error));
	    return Promise.reject(error)
	  }
	);
	
	this.dealUrl = function(appName, url){
		if (!appName) {
		  return baseConfig.apiUrl + url;
		} else {
		  return baseConfig[appName + 'Url'] + url;
		}
	};
	this.dealAjaxOptions = function(opt){
		let res = {};
		if (typeof opt == 'string') {
		  res.appName = opt;
		  res.warn = true;
		} else {
		  try {
		    res.appName = opt.appName;
		    res.warn = opt.warn;
		    if (res.warn !== false) {
		      res.warn = true;
		    }
		  } catch (e) {
		    res.warn = true;
		  }
		}
		return res;
	};
	this.base = function(method, url, data, opt){
		let newOpt = this.dealAjaxOptions(opt);
		let op = {method:method,url:url,auth:newOpt};
		if (method == 'post' || method == 'put') {
			op.data = data;
		} else {
			op.params = data;
		}
		return this.service(op);
	}
};
httpAjax.prototype.get = function(url, data, opt){
	return this.base('get',url, data, opt);
};
httpAjax.prototype.post = function(url, data, opt){
	return this.base('post',url, data, opt);
};
httpAjax.prototype.put = function(url, data, opt){
	return this.base('put',url, data, opt);
};
httpAjax.prototype.delete = function(url, data, opt){
	return this.base('delete',url, data, opt);
};

export default function(options){
	return new httpAjax(options);
};
