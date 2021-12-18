function TextMeasurer() {
  this.canvas = document.createElement('canvas')
  this.supportsCanvas = !!(this.canvas.getContext && this.canvas.getContext('2d'))
  if (this.supportsCanvas) {
    this.context = this.canvas.getContext('2d')
  } else {
    this.context = null // I6-8
  }
}

TextMeasurer.prototype.width = function (text, element) {
  if (this.supportsCanvas) {
    this.context.font = element.css('font-size') + ' ' + element.css('font-family') // 'font' is not working in IE9 at least
    return this.context.measureText(text).width
  } else {
    return (element.outerWidth() * 1.35).round() // I6-8: This should hold the widest truncation without wrapping
  }
}

// eslint-disable-next-line no-unused-vars
window.textMeasurer = new TextMeasurer()
