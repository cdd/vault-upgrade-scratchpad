const { $, _ } = window

function utilityMessage() {
  return ($.ping) ? 'jQuery was monkey-patched' : 'jQuery was NOT monkey-patched'
}

$(document).ready(function() {
  $('#utilityMessage').text(utilityMessage())
});