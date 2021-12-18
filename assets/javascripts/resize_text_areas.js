// modified from http://tuckey.org/textareasizer/

var TextAreaResizer = {
  MinRows: 6,
  MaxRows: 50,

  // Problem: if you are not using monospaced fonts, you can end up with too few rows. IE seems to need extra space.
  adjustForBrowser: function (numRows) {
    if ($.browser.msie || $.browser.webkit) {
      return numRows * 1.15
    } else {
      return numRows * 1.05
    }
  },

  numRows: function (stringToCount, cols) {
    var rows = 0
    var words = _.words(stringToCount, /(.*)(\n|$)/g)
    _.reject(words, function (s) { return s.trim().length === 0 }).forEach(function (match) {
      var lineRows = Math.ceil(match.length / cols)
      rows += (lineRows === 0) ? 1 : lineRows
    })
    return Math.floor(TextAreaResizer.adjustForBrowser(rows))
  },

  numCols: function (textArea) {
    var calculatedRows = Math.ceil(textArea.outerWidth() / 8)
    if (calculatedRows < 1) {
      // if the textArea is not visible, getWidth can return 0, which will make our other calculations blow up.
      return Math.max(textArea.attr('cols'), 1) // fallback to 1 just in case cols is 0
    }
    return calculatedRows
  },

  adjustTextAreaRows: function () {
    $('textarea.resizable').each(function (index, textArea) {
      textArea = $(textArea)
      var minRows = textArea.attr('min_rows') || TextAreaResizer.MinRows
      var maxRows = textArea.attr('max_rows') || TextAreaResizer.MaxRows
      var numCols = TextAreaResizer.numCols(textArea)
      textArea.attr('rows', Math.min(maxRows, Math.max(minRows, TextAreaResizer.numRows(textArea.val(), numCols))))
    })
    setTimeout(TextAreaResizer.adjustTextAreaRows, 300)
  },
}

$(TextAreaResizer.adjustTextAreaRows)
