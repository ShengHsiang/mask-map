const commonObj = {
	/*
	*	用于JSON数据的深拷贝
	*	参数：obj 原JSON数据对象
	*	范例：let newObj = deepCopy(oldObj)
	*	可挂载到vue下，则根据挂载使用
	*/
	deepCopy: function (obj) {
		if(typeof obj == "object" && Object.prototype.toString.call(obj).toLowerCase() == "[object object]" && !obj.length){
            let res = {};
            for (var key in obj) {
              if (obj[key] === undefined || obj[key] === null) {
                /*回避掉空数据*/
              } else {
                res[key] = commonObj.deepCopy(obj[key]);
              }
            }
            return res;
        } else {
            return obj;
        }
	},
	/*
	*	将数字或数字型字符串进行千分位显示
	*	参数：num 数字，可以是number或string类型
	*         symbol 千分位分隔符，默认半角,
	*	范例：let numberStr = thousandNum(5684953.25)   输出 5,684,953.25
	*         let numberStr = thousandNum(5684953.25,'#')   输出 5#684#953.25
	*	可挂载到vue下，则根据挂载使用
	*/
	thousandNum: function (num, symbol) {
		if (symbol == undefined) symbol = ',';
		if (typeof (num) == 'number') {
			num = num.toString();
		}
		if (typeof (num) == 'string') {
			var pos_decimal = num.indexOf('.');
			var decimalStr = '', intStr = '';
			if (pos_decimal < 0) {
				intStr = num;
				decimalStr = '';
			} else {
				intStr = num.substring(0, pos_decimal);
				try {
					decimalStr = num.substring(pos_decimal+1);
				} catch (e) {
					decimalStr = '';
				}
			}
			var preIntStr = intStr;
			if (preIntStr != '') {
				intStr = '';
				var c = 0;
				for (var i = preIntStr.length-1; i >= 0; i--) {
					if ((c + 1) % 3 == 0) {
						if (i == 0) {
							intStr = preIntStr[i] + intStr;
						} else {
							intStr = symbol + preIntStr[i] + intStr;
						}
					} else {
						intStr = preIntStr[i] + intStr;
					}
					c++;
				}
			}
			if (decimalStr == '') {
				return intStr;
			} else {
				return intStr + '.' + decimalStr;
			}
		} else {
			return num;
		}
	},
	/*
	*	JSON数据的深度合并
	*	用法：同jQuery的extend方法
	*	可挂载到vue下，则根据挂载使用
	*/
	extend: function () {
	  let deep = arguments[0], res = {}, index = 0;
	  if (deep === undefined) {
		/*无参数，返回false*/
		return false;
	  }
	  if (typeof deep != 'boolean') {
		/*第1参数不是boolean类型，不进行深合并，将第1参数作为源数据，合并参数的起始索引是第2个*/
		res = deep;
		deep = false;
		index = 1;
	  } else {
		/*第1参数是boolean类型*/
		res = arguments[1];
		if (res === undefined) {
		  /*但无第2参数，直接返回第1参数*/
		  return deep;
		} else {
		  /*有第2参数，将第2参数作为源数据，合并参数的起始索引是第3个*/
		  index = 2;
		}
	  }

	  function checkJSONObj(obj) {
		if (typeof obj == "object" && Object.prototype.toString.call(obj).toLowerCase() == "[object object]" && !obj.length){
		  return true;
		} else {
		  return false;
		}
	  }

	  /*如果源数据不是JSON对象，直接返回源数据*/
	  if (!checkJSONObj(res)) return res;

	  /*合并起始索引之后的数据*/
	  while (arguments[index] !== undefined){
		/*只有被合并数据是JSON数据的时候,才被合并*/
		if (typeof arguments[index] == "object" && Object.prototype.toString.call(arguments[index]).toLowerCase() == "[object object]" && !arguments[index].length){
		  for (let key in arguments[index]) {
			if (arguments[index][key] === undefined || arguments[index][key] === null) {
			  /*回避掉空数据*/
			} else if (checkJSONObj(arguments[index][key])){
			  /*如果被合并的字段是JSON数据*/
			  if (!deep) {
				/*非深入合并*/
				res[key] = arguments[index][key];
			  } else {
				/*深入合并，继续合并*/
				let source = res[key];
				if (!checkJSONObj(res[key])) {
				  source = {}
				}
				res[key] = commonObj.extend(deep,source,arguments[index][key]);
			  }
			} else {
			  /*如果被合并的字段不是JSON数据*/
			  res[key] = arguments[index][key];
			}
		  }
		}
		index++;
	  }
	  return res;
	},
	/*正则验证*/
	regularCheck:{
		/*验证手机号码*/
		'phone':function(val){
			return /^1(3|4|5|6|7|8|9)\d{9}$/.test(val);
		},
		/*
		*	验证小数的有效位数
		*	参数：str 需要验证的字符串或数字，可以是number或string类型
		*         n 有效位数，默认2位数
		*	范例：let flag = positiveDecimal(5684953.254)   输出 false
		*         let flag = positiveDecimal(5684953.254，4)   输出 true
		*	可挂载到vue下，则根据挂载使用
		*/
		positiveDecimal: function (str, n) {
			if (typeof str == 'number') str = str.toString();
			if (n == undefined) n = 2;
			var regStr = '';
			if (n < 1) {
				regStr = '^\\d+$';
			} else {
				regStr = '^(([1-9]{1}\\d*)|(0{1}))(\\.\\d{1,' + n + '})?$';
			}
			var reg = new RegExp(regStr, 'g');
			var res = reg.test(str);
			return res;
		}
	},
	/*
	*	获取数据在数组中的位置
	*	参数：val 需要求位置的数据的值
	*         arr 被查询位置的数组
	*         name 查询时的被查询位置的数组的查询字段名称
	*         mul 是否会查询多个数据
	*         valName 查询时的查询数据数组的查询字段名称
	*	范例：let n = getArrIndex('2',['1','2'])   输出 1
	*         let n = getArrIndex('2',[{value:'1'},{value:'2'}],'value')   输出 1
	*         let n = getArrIndex([{id:'2'},{id:'3'}],[{value:'1'},{value:'2'},{value:'3'}],'value',true,'id')   输出 [1,2]
	*	可挂载到vue下，则根据挂载使用
	*/
	getArrIndex(val,arr,name=null,mul=false,valName=null){
		if (!mul) {
			return arr.findIndex((currentValue)=>{
				if (name===null){
					return currentValue === val;
				} else {
					return currentValue[name] === val;
				}
			});
		} else {
			let resArr = [];
			val.forEach((currentValueA,indexA)=>{
				let objA = currentValueA;
				if (valName!==null) {
					objA = currentValueA[valName];
				}
				let f = false;
				for (let i=0;i<arr.length;i++){
					let objB = arr[i];
					if (name!==null){
						objB = arr[i][name];
					}
					if (objB === objA) {
						resArr.push(i);
						f = true;
						break;
					}
				}
				if (!f) {
					resArr.push(-1);
				}
			});
			return resArr;
		}
	}
};

export default commonObj;