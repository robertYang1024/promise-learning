const isFunction = (f) => typeof f === 'function';
const isPromise = (value) =>  value instanceof Promise;
const isObject = obj => !!(obj && typeof obj === 'object')
const isThenable = obj => (isFunction(obj) || isObject(obj)) && 'then' in obj

const PENDING = 'pending';
const FULFILLED = 'fulfilled';
const REJECTED  = 'rejected';

function Promise (fn) {

  this.state = PENDING;
  this.result = null;
  this.callbacks = [];

  resolve = (result) => {
    // 1, 如果value是自身，则报错
    if (result === this) {
      let  reason = new TypeError('Can not fulfill promise with itself');
      return reject(reason);
    }
    // 2, 如果是另一个 promise，那么沿用它的 state 和 result 状态。
    if (isPromise(result)) {
      return result.then(resolve, reject);
    }
    // 3, 如果 result 是一个 thenable 对象。先取 then 函数，再 call then 函数
    if (isThenable(result)) {
      try {
        let then = result.then;
        if (isFunction(then)) {
          return new Promise(then.bind(result)).then(resolve, reject);
        }
      } catch (error) {
        return reject(error);
      }
    }

    this.state = FULFILLED;
    this.result = result;

    handleCallbacks(this.callbacks, this);
  };

  reject = (reason) => {
    this.state = REJECTED;
    this.result = reason;

    handleCallbacks(this.callbacks, this);
  };

  try {
    fn(resolve, reject);
  } catch (error) {
    this.state = REJECTED;
    this.result = error;
  }

}

Promise.prototype.then = function(onFulfilled, onRejected) {

  let that = this;
  
  return new Promise((resolve, reject) => {
    if (that.state === PENDING) {
      let callback = {onFulfilled, onRejected, resolve, reject}
      
      that.callbacks.push(callback);

    }else if (that.state === FULFILLED) {
      setTimeout(() => {
        // resolve是箭头函数，this是其定义位置上下文的this值；如果不用箭头函数，那就要用中间变量了
        isFunction(onFulfilled)? resolve(onFulfilled(that.result)) : resolve(that.result);
      }, 0);
      
    }else if (that.state === REJECTED) {
      setTimeout(() => {
        isFunction(onRejected)? reject(onRejected(that.result)) : reject(that.result);
      }, 0);
    }
  });
  
}

handleCallbacks = (callbacks, that) => {
  while (callbacks.length > 0) {
    let callback = callbacks.shift();
    
    // state变为 fulfilled/rejected 才会执行 handleCallbacks，这里就不再重复判断了
    
    const {onFulfilled, onRejected, resolve, reject} = callback;

    switch (that.state) {
      case FULFILLED:
        // 需要放到timeout里，不然通不过单元测试
        setTimeout(() => {
          isFunction(onFulfilled) 
                        ? resolve(onFulfilled(that.result))
                        : resolve(that.result);
        }, 0);
          break;
      case REJECTED:
        setTimeout(() => {
          isFunction(onRejected) 
                        ? reject(onRejected(that.result))
                        : reject(that.result);
        }, 0);
          break;
    }
  }
}

Promise.resolve = value => new Promise(resolve => resolve(value));
Promise.reject = reason => new Promise((_, reject) => reject(reason));

module.exports = Promise

// let t1 = new Promise((resolve) => {
//   resolve(11);
// })

// let t2 = t1.then((res) => {
//   console.log('第一次then：',res);
// })

// let t3 = t2.then((res) => {
//   // 结果为undefined，因为上一个then的入参返回值是 void
//   console.log('第二次then：',res);
// }); 
// console.log(t1);
// console.log(t2);
// console.log(t3);
