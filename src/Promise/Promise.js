const isFunction = obj => typeof obj === 'function'
const isObject = obj => !!(obj && typeof obj === 'object')
const isThenable = obj => (isFunction(obj) || isObject(obj)) && 'then' in obj
const isPromise = promise => promise instanceof Promise

/**
 * 总体思路：
 * promise(callbacks) <-- promise(callbacks) <-- promise(callbacks) ...
 * 前一个promise里存放后一个promise的任务，后一个promise存放后后一个promise的任务，promise状态为fulfilled时任务取出来执行
 */

const PENDING = 'pending'
const FULFILLED = 'fulfilled'
const REJECTED = 'rejected'

function Promise(f) {
  this.result = null
  this.state = PENDING
  this.callbacks = []

  let transitionResolve = value => transition(this, FULFILLED, value)
  let transitionReject = reason => transition(this, REJECTED, reason)

  let ignore = false

  let resolve = value => {
    if (ignore) return
    ignore = true
    
    // resolvePromise(this, value, transitionResolve, transitionReject)
    if (value === this) {
        let reason = new TypeError('Can not fufill promise with itself')
        return transitionReject(reason)
      }
    
    if (isPromise(value)) {
        return value.then(transitionResolve, transitionReject)
    }

    if (isThenable(value)) {
        try {
            let then = value.then
            if (isFunction(then)) {
            return new Promise(then.bind(value)).then(transitionResolve, transitionReject)
            }
        } catch (error) {
            return transitionReject(error)
        }
    }

    transitionResolve(value)
  }

  let reject = reason => {
    if (ignore) return
    ignore = true
    transitionReject(reason)
  }

  try {
    f(resolve, reject)
  } catch (error) {
    reject(error)
  }
}

Promise.prototype.then = function(onFulfilled, onRejected) {
  return new Promise((resolve, reject) => {
    
    let callback = { onFulfilled, onRejected, resolve, reject }  // callback里的resolve, reject是新new出来的promise的resolve, reject，这点很重要

    if (this.state === PENDING) {   // 这个this是当前的this，不是new出来的promise的this，这个也很重要

      this.callbacks.push(callback);      // 把then的参数和new prommise的resolve、reject封装成对象，放进当前promise（this）的callbacks里面
                                          // 当前promise的状态变为fulfilled后，就会把callbacks里面的任务取出来执行
    } else {
      setTimeout(() => handleCallback(callback, this.state, this.result), 0)
    }
  })
}

/** 这个函数也很关键，会执行callback里的任务 */
const handleCallback = (callback, state, result) => {
  
  // 这里的onFulfilled、onRejected是then方法的入参；resolve, reject是new promise的，即then方法返回的promise
  let { onFulfilled, onRejected, resolve, reject } = callback
  
  try {
    if (state === FULFILLED) {

      // 注意这里，如果onFulfilled是函数，resolve的是onFulfilled返回的值，也就是then返回的promise的值(this.result) --> 由入参onFulfilled返回的值决定
      // 比如：then(() => void); onFulfilled返回的是undefined，那么then返回的promise的值就是undefined，下一个then的onFulfilled的入参就是undefined
      
      // .then(() => void)
      // .then((res) => console.log(res)); 
      // 第二个then打印的就是undefined，因为第一个then的入参() => void没有返回值
      
      // 如果onFulfilled不是函数，会用当前promise的值resolve

      isFunction(onFulfilled) ? resolve(onFulfilled(result)) : resolve(result)
   
    } else if (state === REJECTED) {

      isFunction(onRejected) ? resolve(onRejected(result)) : reject(result)

    }
  } catch (error) {
    reject(error)
  }
}

/** 遍历执行callbacks里的任务 */
const handleCallbacks = (callbacks, state, result) => {
  while (callbacks.length) handleCallback(callbacks.shift(), state, result)
}

/**
 *  resolve --> transition --> handleCallback --> resolve
 * 这个有点循环了，不过还好是setTimeout执行的
 */
const transition = (promise, state, result) => {
  if (promise.state !== PENDING) return
  promise.state = state
  promise.result = result
  setTimeout(() => handleCallbacks(promise.callbacks, state, result), 0)
}

const resolvePromise = (promise, result, transitionResolve, transitionReject) => {
  if (result === promise) {
    let reason = new TypeError('Can not fufill promise with itself')
    return transitionReject(reason)
  }

  if (isPromise(result)) {
    return result.then(transitionResolve, transitionReject)
  }

  if (isThenable(result)) {
    try {
      let then = result.then
      if (isFunction(then)) {
        return new Promise(then.bind(result)).then(transitionResolve, transitionReject)
      }
    } catch (error) {
      return transitionReject(error)
    }
  }

  transitionResolve(result)
}
// module.exports = Promise

// new Promise((resolve) => {
//   resolve(11);
// }).then((res) => {
//   console.log('第一次then：',res);
// }).then((res) => {
//   // 结果为undefined，因为上一个then的入参返回值是 void
//   console.log('第二次then：',res);
// }); 


// function Name(params) {
//   let a  = () => console.log(this);
// }
// new Name().a();