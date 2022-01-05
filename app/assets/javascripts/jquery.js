import jQuery from 'jquery'

export default jQuery

// extend
jQuery.ping = () => {
  $('body').append('<h3>$.ping() called</h3>')
}