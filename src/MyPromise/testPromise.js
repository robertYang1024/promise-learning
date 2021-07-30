
// let t1 = new Promise((resolve) => {
//   resolve(11);
// })

// let t2 = t1.then((res) => {
//   console.log('第一次then：',res);
//   return res;
// })

// let t3 = t2.then((res) => {
//   // 结果为undefined，因为上一个then的入参返回值是 void
//   console.log('第二次then：',res);
//   throw new TypeError("测试error");
// }); 

// let t4 = t3.then((res) => {
//   // 结果为undefined，因为上一个then的入参返回值是 void
//   console.log('第三次then：',res);
// }); 
// console.log(t1);
// console.log(t2);
// console.log(t3);
// console.log(t4);

let rej = Promise.reject();

let rej2 = rej.then(null, (res) => {
  console.log('then 1，', res);
  return 111;
});

let rej3 = rej2.then((res) => {
  console.log('then 2，', res);
});
console.log(rej);
console.log(rej2);
console.log(rej3);