/*
* timeout-dialog.js v1.0.1, 01-03-2012
*
* @author: Rodrigo Neri (@rigoneri)
*
* (The MIT License)
*
* Permission is hereby granted, free of charge, to any person obtaining a copy
* of this software and associated documentation files (the "Software"), to deal
* in the Software without restriction, including without limitation the rights
* to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
* copies of the Software, and to permit persons to whom the Software is
* furnished to do so, subject to the following conditions:
*
* The above copyright notice and this permission notice shall be included in
* all copies or substantial portions of the Software.
*
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
* IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
* AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
* LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
* OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
* THE SOFTWARE.
*/

/* String formatting, you might want to remove this if you already use it.
* Example:
*
* var location = 'World';
* alert('Hello {0}'.format(location));
*/

require('jquery-ui-bundle/jquery-ui')

String.prototype.format = function () {
  var s = this,
    i = arguments.length

  while (i--) {
    // eslint-disable-next-line security/detect-non-literal-regexp
    s = s.replace(new RegExp('\\{' + i + '\\}', 'gm'), arguments[i])
  }
  return s
}

;(function ($) {
  $.timeoutDialog = function (options) {
    var settings = {
      timeout: 1200,
      countdown: 60,
      title: 'Your session is about to expire!',
      message: 'You will be logged out in {0} seconds.',
      question: 'Do you want to stay signed in?',
      keep_alive_button_text: 'Yes, keep me signed in',
      sign_out_button_text: 'No, sign me out',
      keep_alive_url: '/keep-alive',
      logout_url: null,
      logout_redirect_url: '/',
      session_timeout_url: '/session-timeout',
      restart_on_yes: true,
      dialog_width: 350,
      timer_interval: 1,
    }

    $.extend(settings, options)

    var TimeoutDialog = {
      init: function () {
        this.setupDialogTimer()
      },

      setupDialogTimer: function () {
        var self = this
        var interval = settings.timer_interval * 1000

        var timerEnd = Date.now() + (settings.timeout * 1000)
        var dialogTimerStart = timerEnd - (settings.countdown * 1000)

        var timerWatcher = function () {
          if (timerEnd <= Date.now()) {
            self.refreshSessionTimeout(self.signOut, false)
          } else if (dialogTimerStart <= Date.now()) {
            self.refreshSessionTimeout(self.setupDialog)
          }
        }

        timerWatcher()

        window.clearInterval(this.timerWatcher)
        this.timerWatcher = window.setInterval(timerWatcher, interval)
      },

      // Check back-end session timeout to make sure we still want to show dialog or logout
      refreshSessionTimeout: function (callback, arg) {
        var self = this
        window.clearInterval(self.timerWatcher)

        $.get(settings.session_timeout_url)
          .done(function (data) {
            var newTimeout = Number(data)
            if (newTimeout > settings.countdown) {
              settings.timeout = newTimeout
              self.setupDialogTimer()
            } else {
              callback(self, arg)
            }
          })
          .fail(function () {
            self.setupDialogTimer()
          })
      },

      setupDialog: function (that) {
        var self = that
        window.clearInterval(self.timerWatcher)
        self.destroyDialog()

        // eslint-disable-next-line jquery-unsafe/no-appendTo
        $('<div id="timeout-dialog">' +
        '<p id="timeout-message">' + settings.message.format('<span id="timeout-countdown">' + settings.countdown + '</span>') + '</p>' +
        '<p id="timeout-question">' + settings.question + '</p>' +
        '</div>')
          .appendTo('body')
          .dialog({
            modal: true,
            width: settings.dialog_width,
            minHeight: 'auto',
            zIndex: 10000,
            closeOnEscape: false,
            draggable: false,
            resizable: false,
            dialogClass: 'timeout-dialog',
            title: settings.title,
            buttons: {
              'keep-alive-button': {
                text: settings.keep_alive_button_text,
                id: 'timeout-keep-signin-btn',
                click: function () {
                  self.keepAlive()
                },
              },
              'sign-out-button': {
                text: settings.sign_out_button_text,
                id: 'timeout-sign-out-button',
                click: function () {
                  self.signOut(self, true)
                },
              },
            },
          })

        self.startCountdown()
      },

      destroyDialog: function () {
        if ($('#timeout-dialog').length) {
          $('#timeout-dialog').dialog('close')
          $('#timeout-dialog').remove()
        }
      },

      startCountdown: function () {
        var self = this,
          counter = settings.countdown

        this.countdown = window.setInterval(function () {
          counter -= 1
          // eslint-disable-next-line jquery-unsafe/no-html
          $('#timeout-countdown').html(counter)

          if (counter <= 0) {
            window.clearInterval(self.countdown)
            self.destroyDialog()
            self.refreshSessionTimeout(self.signOut, false)
          }
        }, 1000)
      },

      keepAlive: function () {
        var self = this
        this.destroyDialog()
        window.clearInterval(this.countdown)

        $.get(settings.keep_alive_url, function (data) {
          if (data == 'OK') {
            if (settings.restart_on_yes) {
              self.setupDialogTimer()
            }
          } else {
            self.signOut(false)
          }
        })
      },

      signOut: function (that, is_forced) {
        var self = that

        if (settings.logout_url != null) {
          // If this is an auto-logout, the user might already
          // be logged out at this point meaning this POST would fail
          $.post(settings.logout_url, { _method: 'delete' }, function () {
            self.redirectLogout(is_forced)
          })
        } else {
          self.redirectLogout(is_forced)
        }
      },

      redirectLogout: function (is_forced) {
        var target = settings.logout_redirect_url + '?redirect_url=' + encodeURIComponent(window.location.pathname + window.location.search)
        if (!is_forced) {
          target += '&timeout=t'
        }
        window.location = target
      },
    }

    TimeoutDialog.init()
  }
}(window.jQuery))
