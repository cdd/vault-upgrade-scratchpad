/*
 * Provides a replacement for the Rails 2 link_to helper's "popup" option, which
 * was removed in Rails 3.
 *
 * To use, add an attribute named "data-popup=true" to the anchor that you want
 * to have open in a new window. With link_to, you'd do it like this:
 *
 *    link_to "Special Details", special_details_path, "data-popup" => true
 */

window.CDD.openPopupFromLink = function (clickEvent) {
  var anchor = $(clickEvent.target)
  window.open(anchor.attr('href'))
  return false
}

$(document).on('click', 'a[data-popup=true]', CDD.openPopupFromLink)
