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

  let ignore = false; // 只调用一次

/** 这个还必须要抽出来，因为resolve的时候，第2点，要传改变状态的函数进去 */
const changeToResolve = result => {    
  this.state = FULFILLED;
  this.result = result;
  handleCallbacks(this.callbacks, this);
}

const changeToReject = reason => {
  this.state = REJECTED;
  this.result = reason;
  handleCallbacks(this.callbacks, this);
}

  resolve = (result) => {
    if(ignore) return;
    ignore = true;

    // 1, 如果value是自身，则报错
    if (result === this) {
      let  reason = new TypeError('Can not fulfill promise with itself');
      // 这里不能直接调reject，因为ignore已经改了
      return changeToReject(reason);
    }
    // 2, 如果是另一个 promise，那么沿用它的 state 和 result 状态。
    if (isPromise(result)) {
      return result.then(changeToResolve, changeToReject);
    }
    // 3, 如果 result 是一个 thenable 对象。先取 then 函数，再 call then 函数
    if (isThenable(result)) {
      try {
        let then = result.then;
        if (isFunction(then)) {
          return new Promise(then.bind(result)).then(changeToResolve, changeToReject);
        }
      } catch (error) {
        return changeToReject(error);
      }
    }

    this.state = FULFILLED;
    this.result = result;

    handleCallbacks(this.callbacks, this);
  };

  reject = (reason) => {
    if(ignore) return;
    ignore = true;

    this.state = REJECTED;
    this.result = reason;

    handleCallbacks(this.callbacks, this);
  };

  try {
    fn(resolve, reject);
  } catch (error) {
    // 这里也要做判断
    if(ignore) return;
    ignore = true;

    this.state = REJECTED;
    this.result = error;

    handleCallbacks(this.callbacks, this);
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
        try {
          // resolve是箭头函数，this是其定义位置上下文的this值；如果不用箭头函数，那就要用中间变量了
          isFunction(onFulfilled)? resolve(onFulfilled(that.result)) : resolve(that.result);
          
        } catch (error) {
          reject(error);
        }
      }, 0);
      
    }else if (that.state === REJECTED) {
      setTimeout(() => {
        try {
          // 注意： onRejected是function的话，是resolve     
          isFunction(onRejected)? resolve(onRejected(that.result)) : reject(that.result);
        } catch (error) {
          reject(error);
        }
      }, 0);
    }
   
  });
  
}

const handleCallbacks = (callbacks, that) => {
  while (callbacks.length > 0) {
    let callback = callbacks.shift();
    
    // state变为 fulfilled/rejected 才会执行 handleCallbacks，这里就不再重复判断了
    
    const {onFulfilled, onRejected, resolve, reject} = callback;

      switch (that.state) {
        case FULFILLED:
          // 需要放到timeout里，不然通不过单元测试  resolve是在当前同步代码之后执行的
          setTimeout(() => {
            try {

              isFunction(onFulfilled) 
                            ? resolve(onFulfilled(that.result))
                            : resolve(that.result);
            } catch (error) {
              reject(error);
            }
          }, 0);
            break;
        case REJECTED:
          setTimeout(() => {
            try {
              
              isFunction(onRejected) 
                            ? resolve(onRejected(that.result))
                            : reject(that.result);
            } catch (error) {
              reject(error);
            }
          }, 0);
            break;
      }
  }
}

Promise.resolve = value => new Promise(resolve => resolve(value));
Promise.reject = reason => new Promise((_, reject) => reject(reason));

module.exports = Promise
// export default Promise;