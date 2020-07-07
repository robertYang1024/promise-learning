var  Promise = require("./PromiseTest");

try {

  new Promise(resolve => {resolve(55)})
  .then(onFulfilledValue => {console.log("传进then()的值，onFulfilledValue：", onFulfilledValue + ", this===global:"+ (this === global ))});
}catch(error) {
  console.log(error);
}


// function tmp() {
//   console.log(this === global);
// }

// tmp();