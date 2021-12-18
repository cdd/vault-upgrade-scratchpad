$.fn.focusFirst = function () {
  return this
    .find(':focusable:not(a):not(button):not(object):not(select)')
    .first()
    .focus()
}
