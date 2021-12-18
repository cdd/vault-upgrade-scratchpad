if (window.CDD === undefined) {
  window.CDD = {}
}

/*
 * We're hanging this off of 'window' because this will replace functionality will current is in window.CDD.Helpers
 *
 * This is basically jQuery.ajaxMultiQueue - https://github.com/GeReV/jQuery.ajaxMultiQueue - with minor alterations
 *      and furnishings.
 *  (c) 2013 Amir Grozki Dual licensed under the MIT and GPL licenses.
 *
 * Which itself is based on jQuery.ajaxQueue
 *  (c) 2011 Corey Frang
 *
 * Requires jQuery 1.5+
 */
window.CDD.ConnectionPool = (function () {
  const createConnectionPool = function (poolSize) {
    const queues = new Array(poolSize)
    let current = 0

    for (let i = 0; i < poolSize; i++) {
      // jQuery on an empty object, we are going to use this as our Queue
      queues[i] = $({})
    }

    function queue(ajaxOpts) {
      let jqXHR
      const dfd = $.Deferred()
      const promise = dfd.promise()

      // queue our ajax request
      queues[current].queue(doRequest)

      current = (current + 1) % poolSize

      // add the abort method
      promise.abort = function (statusText) {
        // proxy abort to the jqXHR if it is active
        if (jqXHR) {
          return jqXHR.abort(statusText)
        }

        let queue
        let index = 0

        // if there wasn't already a jqXHR we need to remove from queue
        for (let i = 0; (i < poolSize) || (index < 0); i++) {
          queue = queues[current].queue()
          index = $.inArray(doRequest, queue)
        }

        if (index > -1) {
          queue.splice(index, 1)
        }

        // and then reject the deferred
        dfd.rejectWith(ajaxOpts.context || ajaxOpts, [promise, statusText, ''])

        return promise
      }

      // run the actual query
      function doRequest(next) {
        jqXHR = $.ajax(ajaxOpts)
          .done(dfd.resolve)
          .fail(dfd.reject)
          .then(next, next)
      }

      return promise
    }

    return {
      queue: queue,
    }
  }

  const pool = createConnectionPool(3)

  const enqueue = function (ajaxOpts) {
    pool.queue(ajaxOpts)
  }

  return {
    enqueue: enqueue,
  }
})()
