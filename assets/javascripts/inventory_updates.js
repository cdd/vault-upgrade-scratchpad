// Place all the behaviors and hooks related to the matching controller here.
// All this logic will automatically be available in application.js.
$(document).ready(function () {
  $(document).on('ajax:success', '.new_inventory_update', function (e, data, status, xhr) {
    $(e.target).closest('.inventory-wrapper').replaceWith(xhr.responseText)
  }).on('ajax:error', '.new_inventory_update', function (e, xhr) {
    // TODO: nicer error handling?
    var errors = xhr.responseJSON
    var target = $(e.target)
    target.parent().find('.errorMessage').remove()
    var list = $('<ul>')
    _.forEach(errors, function (messages, field) {
      _.forEach(messages, function (message) {
        list.append($('<li>', { text: _.capitalize(field).escapeHTML() + ' ' + message.escapeHTML() }))
      })
    })
    // eslint-disable-next-line jquery-unsafe/no-append
    target.append($('<div>', { 'class': 'errorMessage' }).append(list))
  })

  function updateInventory(e) { // Show update inventory form
    var thisInventory = $(e).closest('.inventory-state')
    thisInventory.children('.current').hide(0, function () {
      $(this).find('.current-location, .current-amount').removeClass('slide-in-left')
    })
    thisInventory.children('.update').show(0, '', function () {
      $(this).find('.cancel-update, .new-location, .debit-amount').addClass('slide-in-right')
      $(this).find('#inventory_update_debit').focus()
    })
  }

  function cancelUpdate(e) { // Cancel update Inventory
    var thisInventory = $(e).closest('.inventory-state')
    thisInventory.children('.update').hide(0, function () {
      $(this).find('.cancel-update, .new-location, .debit-amount').removeClass('slide-in-right')
    })
    thisInventory.children('.current').show(0, '', function () {
      $(this).find('.current-location, .current-amount').addClass('slide-in-left')
    })
  }

  $(document).on('click', '.update-inventory', function () {
    updateInventory(this)
  }).on('click', '.cancel-update', function () {
    cancelUpdate(this)
  }).on('keyup', function (evt) { // Cancel Update on hitting Escape
    if (evt.keyCode == 27) {
      cancelUpdate($('#inventory_update_debit:focus'))
      cancelUpdate($('#inventory_update_location:focus'))
    }
  })
})
