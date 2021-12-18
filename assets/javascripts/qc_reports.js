// eslint-disable-next-line no-unused-vars
window.toggleWarningDetails = function (warningId) {
  var hideDetails = $('#warningRow' + warningId).hasClass('active')

  $('#warningEventsViewer tr.active').removeClass('active')

  if (hideDetails) {
    $('#warningEventsViewer').removeClass('showDetails')
  } else {
    $('#warningEventsViewer .importEventsViewer-details').removeClass('importEventsViewer-details').addClass('importEventsViewer-details-inactive')
    $('#warningRow' + warningId).addClass('active')

    $('#warningDetails' + warningId).addClass('importEventsViewer-details').removeClass('importEventsViewer-details-inactive')
    $('#warningEventsViewer').addClass('showDetails')

    $('#warningDetails' + warningId + '-subcontainer')
  }
}
