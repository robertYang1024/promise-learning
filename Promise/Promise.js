const isFunction = obj => typeof obj === 'function'
const isObject = obj => !!(obj && typeof obj === 'object')
const isThenable = obj => (isFunction(obj) || isObject(obj)) && 'then' in obj
const isPromise = promise => promise instanceof Promise

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
    let callback = { onFulfilled, onRejected, resolve, reject }

    if (this.state === PENDING) {
      this.callbacks.push(callback)
    } else {
      setTimeout(() => handleCallback(callback, this.state, this.result), 0)
    }
  })
}

const handleCallback = (callback, state, result) => {
  let { onFulfilled, onRejected, resolve, reject } = callback
  try {
    if (state === FULFILLED) {
      isFunction(onFulfilled) ? resolve(onFulfilled(result)) : resolve(result)
    } else if (state === REJECTED) {
      isFunction(onRejected) ? resolve(onRejected(result)) : reject(result)
    }
  } catch (error) {
    reject(error)
  }
}

const handleCallbacks = (callbacks, state, result) => {
  while (callbacks.length) handleCallback(callbacks.shift(), state, result)
}

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

new Promise((resolve) => {
  resolve(11);
}).then((res) => {
  console.log(res);
}); 


function Name(params) {
  let a  = () => console.log(this);
}
new Name().a();