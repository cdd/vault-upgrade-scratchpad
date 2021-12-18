window.makeSearchTableLinksDisableable = function () {
  CDD.makeDisableable($('#exportOptions-link'), function () {
    $('#exportOptions-dialog').show()
    return false
  }, true)

  CDD.makeDisableable($('#addToCollection-link'), function () {
    showDialog('addToCollection-dialog')
    $('#addToCollection-light-box').removeClass('hidden')
    $('#collection-name').focus()
    return false
  }, true)

  CDD.makeDisableable($('#buildModel-link'), function () {
    showDialog('buildModel-dialog')
    $('#buildModel-light-box').removeClass('hidden')
    CDD.SearchResultSelection.updateSearchResultsActionsHeader()
    $('#protocol_name').focus()
    return false
  }, true)

  CDD.makeDisableable($('#cdd_vision_link'), function () {
    var path = $(this).data('search-result-molecule-selections-path')
    CDD.launchVision(path)
  }, true)

  CDD.makeDisableable($('#plot_results_link'), function () {
    var path = $(this).data('search-result-molecule-selections-path')
    CDD.plotMoleculeSelection(path)
  }, true)
}

$(window.makeSearchTableLinksDisableable)

CDD.setupSearchResultsLoader()
