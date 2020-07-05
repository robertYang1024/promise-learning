var  Promise = require("./PromiseTest");

new Promise(resolve => {resolve(55)})
.then(onFulfilledValue => {console.log("传进then()的值，onFulfilledValue：",onFulfilledValue+", id:"+this.id)});