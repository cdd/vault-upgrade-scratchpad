window.showContainerTab = function (id, plateMapContainerId) {
  // Keep the window from jumping around
  $('#' + id)[0].scrollIntoView()
  // Set the active tab, link, etc
  $('#' + id).closest('.container').find('.container-tab').removeClass('container-tab-active')
  $('#' + id).addClass('container-tab-active')

  $('#' + id).closest('.container').find('.container-tabs a').removeClass('active')
  $('#' + id).closest('.container').find('.container-tabs div.tab').removeClass('active')
  $('#' + id + 'Link').closest('div.tab').addClass('active')
  $('#' + id + 'Link').addClass('active')

  $('#' + id).find(':focusable:first').focus()
}

// makes the column and row headers stay in place when scrolling a big data table
// also makes the upper left corner look nicer if desired
window.setupBigDataTable = function (containerId, options) {
  var original, cells, columnHeaders, columnHeadersTable, borderSpacingStyle, rowHeaders, rowHeadersTable, cornerTable, corner
  function updateCellsHeight() {
    // only clip the height if the table is tall enough to need it
    var threshold = window.innerHeight
    if (original.height() > threshold) {
      cells.css({ height: threshold + 'px' })
    } else {
      cells.css({ height: 'auto' })
    }
  }

  function getBorderSpacing(table) {
    if (columnHeadersTable.css('border-collapse') == 'separate') {
      borderSpacingStyle = $(table).css('border-spacing')
      if (borderSpacingStyle) {
        return borderSpacingStyle.match(/\d+/)[0] * 2
      }
    }
    return 0
  }

  function fixedRowHeadersWidth() {
    var width = getBorderSpacing(rowHeadersTable)
    var rows = rowHeadersTable[0].getElementsByTagName('tbody')[0].getElementsByTagName('tr')
    if (rows.length === 0) {
      return
    }

    var elements = $(rows[0]).children() // Way faster than down('tbody tr')
    for (var i = options.fixedRowHeaderCount - 1; i >= 0; i--) {
      width += elements[i].offsetWidth
    }
    return width
  }

  function updateHeadersSizes() {
    var clientWidth = cells[0].clientWidth
    var clientHeight = cells[0].clientHeight
    var rowHeaderWidth = fixedRowHeadersWidth()

    columnHeaders.css({
      height: columnHeadersTable.find('thead')[0].offsetHeight + getBorderSpacing(columnHeadersTable) + 'px',
      width: clientWidth + 'px',
    })

    if (rowHeaders.length > 0) {
      rowHeaders.css({
        height: clientHeight + 'px',
        width: rowHeaderWidth + 'px',
      })
      rowHeadersTable.css({ width: clientWidth + 'px' })
    }

    if (corner.length > 0) {
      var height, width
      if (options.emptyCorner === true) {
        var th = cells.find('th')[0]
        height = th.clientHeight
        width = th.clientWidth
      } else {
        height = cornerTable.find('thead')[0].offsetHeight + getBorderSpacing(cornerTable)
        width = rowHeaderWidth
      }

      corner.css({
        height: height + 'px',
        width: width + 'px',
      })

      if (cornerTable !== undefined) {
        cornerTable.css({ width: clientWidth + 'px' })
      }
    }
  }

  // helper function to update attributes
  function updateAttributes() {
    if (columnHeaders.length > 0) {
      updateCellsHeight()
    }
    updateHeadersSizes()
  }

  options = $.extend({
    fixedColumnHeaders: true,
    fixedRowHeaders: false,
    fixedRowHeaderCount: 1,
    emptyCorner: false,
  }, options || {})

  // get container
  var container = $('#' + containerId)
  if (container.length > 0) {
    // get the original table
    original = container.find('table')
    if (original.length > 0) {
      // set up structure
      // #containerId.bigTable
      //   .cells
      //     table
      //   .columnHeaders
      //     table
      //   .rowHeaders
      //     table
      //   .corner
      //     table
      cells = $('<div></div>')
      container.append(cells)
      cells.append(original[0].cloneNode(true))
      cells.addClass('cells') // add class name only after the element is inserted or styling is not applied correctly (in IE8)

      if (options.fixedColumnHeaders === true) {
        columnHeaders = $('<div></div>')
        container.append(columnHeaders)
        columnHeadersTable = $(original[0].cloneNode(true))
        columnHeadersTable.attr('id', original.attr('id') + '-cloneForColumnHeaders')
        columnHeaders.append(columnHeadersTable)
        columnHeaders.addClass('columnHeaders')
      }

      if (options.fixedRowHeaders === true) {
        rowHeaders = $('<div></div>')
        container.append(rowHeaders)
        rowHeadersTable = $(original[0].cloneNode(true))
        rowHeadersTable.attr('id', original.attr('id') + '-cloneForRowHeaders')
        rowHeaders.append(rowHeadersTable)
        rowHeaders.addClass('rowHeaders')
      }

      if ((options.fixedRowHeaders === true && options.fixedColumnHeaders === true) || options.emptyCorner === true) {
        corner = $('<div></div>')
        container.append(corner)

        if (options.emptyCorner === false) {
          cornerTable = $(original[0].cloneNode(true))
          cornerTable.attr('id', original.attr('id') + '-cloneCornerCell')
          corner.append(cornerTable)
        }
        corner.addClass('corner')
      }

      original.remove() // We're done cloning this table and we don't want it around anymore

      // update attributes when the window is resized
      $(window).on('resize', function () {
        updateAttributes()
      })

      // scroll the headers horizontally with the data
      cells.on('scroll', function () {
        updateHeadersSizes() // <- hack (columnHeaders width sometimes gets calculated using an old value of cells.clientWidth, so update it here)
        if (columnHeadersTable !== undefined && columnHeadersTable.length > 0) {
          columnHeadersTable.css({ left: '-' + cells.scrollLeft() + 'px' })
        }
        if (rowHeadersTable !== undefined && rowHeadersTable.length > 0) {
          rowHeadersTable.css({ top: '-' + cells.scrollTop() + 'px' })
        }
      })

      // calculate and apply attributes
      setTimeout(updateAttributes, 1) // better to wait for the rest of the page to be painted before doing that... huge performance gain on IE
    }
  }
}

window.rebuildBigDataTable = function (containerId, options) {
  var container = $('#' + containerId)
  if (container.length > 0) {
    // get the containers
    var original = container.find('table')
    container.append(original)

    container.find('.cells').remove()
    container.find('.columnHeaders').remove()
    container.find('.rowHeaders').remove()
    container.find('.corner').remove()

    setupBigDataTable(containerId, options)
  }
}
