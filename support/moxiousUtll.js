import moxios from 'moxios'

/**
 * waitForMoxiosRequest - wait for a specified request, with an optional response
 * @param {*} filter a string (matches if the request url starts with filter), or function test
 * @param {*} response an optional response if the request is satisfied
 * @returns a promise resolved when the request has been received
 */
export const waitForMoxiosRequest = (filter, response) => {
  return new Promise((resolve, reject) => {
    const handleResponse = () => {
      for (let i = 0; i < moxios.requests.count(); i++) {
        const request = moxios.requests.at(i)
        if (request && request.url) {
          if ((typeof filter === 'string' && request.url.startsWith(filter)) ||
            (typeof filter === 'function' && filter(request))) {
            if (response !== undefined) {
              request.respondWith({
                status: 200,
                response: response,
              })
            }
            setTimeout(resolve)
            break
          }
        }
      }
    }
    moxios.wait(handleResponse)
  })
}
