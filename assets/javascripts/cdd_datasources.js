(function () {
  var addCssPixels = function (first, second) {
    return parseInt(first, 10) + parseInt(second, 10)
  }

  var positionOn = function (source, offset) {
    offset = offset || {}

    var position = source.position()

    if ('top' in offset) { position.top += offset.top }
    if ('left' in offset) { position.left += offset.left }

    this.css(position)
  }

  var toggleSourceListCollapse = function (sourceList) {
    sourceList
      .toggleClass('collapsible-open')
      .toggleClass('collapsible-closed')
  }

  var toggleCollapse = function (sourceListCollapser) {
    toggleSourceListCollapse(
      $(sourceListCollapser).closest('.dataSources-sourceList')
    )
  }

  var hasHoverEl = function (element) {
    return element.find(':hover').length > 0
  }

  $(function () {
    // resize the public data sets scrollBox if present so that it fills the whole sidebar
    if ($('#dataSources-public').length > 0) {
      var publicScrollbox = $('#dataSources-public').find('.dataSources-scrollBox')
      if (publicScrollbox.length > 0) {
        var maxHeight = Math.max(200, publicScrollbox.height() + $('#dataSources').height() - $('#dataSources').find('.drilldown-menu').height())
        publicScrollbox.css({ maxHeight: maxHeight + 'px' })
      }
    }

    // set up "Create a new" link
    if ($('#dataSources-createNew-link')) {
      $('#dataSources-createNew-link').on('click', function (event) {
        event.preventDefault()
        $('#dataSources-createNew').toggleClass('open')
      })
    }

    $('.dataSources-sourceList').each(function (index, _dataSource) {
      var dataSource = $(_dataSource)

      // configure initial state of checkboxes (unchecked/checked/indeterminate)
      window.CDD.DataSourceSelection.updateCheckBoxState(dataSource)
    })

    // show/hide contents of each data source
    $('.collapsible-header .clickable').on('click', function (event) {
      event.stopPropagation()
      toggleCollapse(event.currentTarget)
    })

    // set up each data source
    // Delayed as this can take some time and we do not want to block the rendering on IE.
    setTimeout(function () {
      var clone = null
      var cloneSource = null

      var removeClone = function () {
        if (clone) {
          clone.parents('.dataSources-scrollBox-container').removeClass('dataSources-hoverBox')
          clone.remove()
          clone = null
        }
      }

      var setupCheckbox = function (clone, checkbox) {
        var cloneCheckbox = clone.find('input[type="checkbox"]')
        cloneCheckbox.prop('checked', checkbox.prop('checked')) // Not cloned on IE
        checkbox.on('click', function () {
          cloneCheckbox.prop('checked', checkbox.prop('checked'))
        })
      }

      var createHoverClone = function (source, container, scrollBox, checkbox) {
        clone = source.clone(true)
        cloneSource = source

        container.addClass('dataSources-hoverBox')
        scrollBox.after(clone)

        clone.attr('id', clone.attr('id') + '_clone')
        clone.addClass('dataSources-source-hover')

        var offset = {
          top: addCssPixels(clone.css('border-top-width'), clone.css('padding-top')),
          left: -1 * addCssPixels(clone.css('border-left-width'), clone.css('padding-left')),
        }

        var reposition = positionOn.bind(clone, source, offset)

        clone.css({
          position: 'absolute',
          margin: 0,
          'z-index': 101,
        })

        setupCheckbox(clone, checkbox)

        reposition()
        scrollBox.on('scroll', reposition)

        source.on('mouseleave', removeClone)
      }

      $('.dataSources-source').each(function () {
        var source = $(this)
        var scrollBox = source.parent('.dataSources-scrollBox')
        var container = scrollBox.parent('.dataSources-scrollBox-container')
        var checkbox = source.find('input[type="checkbox"]')

        // set up hovering of data source items
        source.on('mouseover', function (event) {
          if (clone) {
            if (cloneSource === source) { return }
            removeClone()
          }
          if (scrollBox.length > 0) {
            createHoverClone(source, container, scrollBox, checkbox)
          } else {
            source.addClass('dataSources-source-hover')
          }
        })

        source.on('mouseleave', function (event) {
          source.removeClass('dataSources-source-hover')
        })
      })

      $('.dataSources-scrollBox').on('mouseleave', function (event) {
        var parent = $(event.currentTarget).parent()

        if (!hasHoverEl(parent)) {
          removeClone()
        }
      })

      // Select all / none
      $('.dataSources-sourceList > .collapsible-header > .input-checkbox').on('click', function (event) {
        var sourceList = $(event.currentTarget).closest('.dataSources-sourceList')

        sourceList
          .find('.dataSources-scrollBox .dataSources-source .input-checkbox')
          .filter(function () { return this.checked != event.currentTarget.checked })
          .click()
      })
    }, 10)
  })

// End closure
})()

if (typeof window.CDD === 'undefined') {
  window.CDD = {}
}

window.CDD.DataSourceSelection = (function () {
  var ongoingSelectionUpdateCount = 0
  var pageUpdateRequest = null

  function updateCheckBoxState(_dataSource) {
    var dataSource = $(_dataSource)
    var checkBoxes = dataSource.find('.collapsible-inner .input-checkbox').toArray()
    checkBoxes = _.uniqBy(checkBoxes, function (el) { return el.id }) // The clone might be in the list
    var countedCheckedBoxes = checkBoxes.filter(function (el) { return $(el).prop('checked') })
    var dataSourceCheckBox = $(dataSource.find('.collapsible-header .input-checkbox'))
    var sectionCount = $(dataSource.find('.collapsible-header .clickable .sectionCount'))
    sectionCount.text(countedCheckedBoxes.length)

    switch (countedCheckedBoxes.length) {
      case 0:
        dataSourceCheckBox.prop('checked', false).prop('indeterminate', false)
        sectionCount.removeClass('nonZero')
        break
      case checkBoxes.length:
        dataSourceCheckBox.prop('checked', true).prop('indeterminate', false)
        sectionCount.addClass('nonZero')
        break
      default:
        dataSourceCheckBox.prop('checked', false).prop('indeterminate', true)
        sectionCount.addClass('nonZero')
    }
  }

  function updateCallback() {
    return $.ajax(window.CDD.DataSourceSelection.pageUpdateUrl, {
      async: true,
      dataType: 'script',
      method: 'GET',
      headers: {
        'If-Modified-Since': 'Thu, 1 Jan 1970 00:00:00 GMT',
        'Cache-Control': 'no-cache',
      }, // necessary to prevent IE from caching the responses (that it does by default for get requests)
    })
  }

  function updateComplete(event) {
    if (--ongoingSelectionUpdateCount === 0) {
      pageUpdateRequest = window.CDD.DataSourceSelection.updateCallback()
        .then(function () {
          pageUpdateRequest = null
          $('.dataSources-sourceList').each(function (index, dataSource) {
            updateCheckBoxState(dataSource)
          })
        }
        )
    }
  }

  function selectionChanged(update_url, selected) {
    ongoingSelectionUpdateCount++
    if (pageUpdateRequest) {
      if (pageUpdateRequest.abort) {
        // jQuery < v3
        pageUpdateRequest.abort()
      } else if (pageUpdateRequest.reject) {
        // Promise
        pageUpdateRequest.reject()
      }
    }
    if (window.CDD.DataSourceSelection.onSelectionChanged !== null) {
      window.CDD.DataSourceSelection.onSelectionChanged()
    }
    $.ajax(update_url, {
      async: true,
      dataType: 'script',
      method: selected ? 'PUT' : 'DELETE',
      complete: updateComplete,
    })
  }

  return {
    pageUpdateUrl: null,
    onSelectionChanged: null,
    selectionChanged: selectionChanged,
    updateCallback: updateCallback,
    updateComplete: updateComplete,
    updateCheckBoxState: updateCheckBoxState,
  }
}())
