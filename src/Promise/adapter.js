const Promise = require("./Promise.js")
// import Promise from "./Promise.js"

const resolved = value => Promise.resolve(value)
const rejected = reason => Promise.reject(reason)
const deferred = () => {
  let promise, resolve, reject
  promise = new Promise(($resolve, $reject) => {
    resolve = $resolve
    reject = $reject
  })
  return { promise, resolve, reject }
}

module.exports = { resolved, rejected, deferred }
