$(function () {
  $('form#login_form').on('submit', function (event) {
    event.preventDefault()

    var form = this

    $.ajax({
      method: 'GET',
      url: '/user/session/refresh_token',
    }).done(function (data, status, xhr) {
      var csrfToken = xhr.getResponseHeader('X-CSRF-Token')

      $('meta[name="csrf-token"]').attr('content', csrfToken)
      $.rails.refreshCSRFTokens()

      form.submit()
    })
  })
})
