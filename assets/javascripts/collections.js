if (CDD === undefined) { CDD = {} }

(function () {
  var handleCollectionChange = function (event) {
    var addToExistingCollectionLink = $('#addToExistingCollection-form_submit')
    var projectPlaceholder = $('#addToExistingCollection-project')
    var collectionPathTemplate = $(this).data('collection-path-template')
    var that = this

    if (addToExistingCollectionLink.data('onClickHandler') === undefined) {
      CDD.makeDisableable(addToExistingCollectionLink, function () {
        if (that.value === '') { return false }
        var additionalParams = CDD.SearchResultSelection ? CDD.SearchResultSelection.toQueryString() : ''

        CDD.disable(addToExistingCollectionLink)
        $.ajax(collectionPathTemplate.replace('COLLECTION_ID', that.value), {
          async: true,
          dataType: 'script',
          method: 'PUT',
          data: additionalParams,
        })
        return false
      }, false)
    }

    if (this.value) {
      CDD.enable(addToExistingCollectionLink)
      var selectedOption = $(this.options[this.options.selectedIndex]) // not auto-wrapped on IE7
      var project = selectedOption.data().project
      projectPlaceholder.html(project ? project.escapeHTML() : "<span class='muted'>private collection</span>")
    } else {
      CDD.disable(addToExistingCollectionLink)
      projectPlaceholder.empty()
    }
  }

  $(function () {
    $(document).on('change', '#addToExistingCollection-collection', handleCollectionChange)
  })
})()

CDD.moleculeSelectionSaveNotice = function (message) {
  var collectionNotice = $('<div class=\'successMessage addToCollection-notice\' id=\'addToCollection-notice\'><p>' + message + '</p></div>') // message is already escaped
  if ($('#addToCollection-notice').length > 0) {
    $('#addToCollection-notice').replaceWith(collectionNotice)
  } else {
    // eslint-disable-next-line jquery-unsafe/no-before
    $('#search_results_table-dialogs').before(collectionNotice)
  }
  $('#addToCollection-notice').effect('highlight')
  return false
}
