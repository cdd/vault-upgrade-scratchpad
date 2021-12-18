function collectDetailRowIds() {
  return $.makeArray($('#readoutRows').children()).map(function (element) {
    return element.id.match(/\d+$/)[0]
  }).join()
}
window.collectDetailRowIds = collectDetailRowIds

function collectDetailRowIdsForSubmit(detailRow) {
  detailRow.val(collectDetailRowIds())
}

$(document).on('ajax:before', '.readout-row-edit', function () {
  collectDetailRowIdsForSubmit($(this).find('.visible-detail-row-ids'))
})

$(document).on('ajax:before', '#new_readout_row', function () {
  collectDetailRowIdsForSubmit($('#visible_detail_row_ids'))
})

$(document).one('click', '#run-detailsLink', function () {
  setTimeout(function () {
    if ($('#linked-eln-entries-show span').length) {
      var offset = $('#linked-eln-entries-show span').first().offset().left
      $('#linked-eln-entries-show span').each(function (i, span) { if ($(span).offset().left === offset) { $(span).addClass('first') } })
    }
  }, 0)
})
