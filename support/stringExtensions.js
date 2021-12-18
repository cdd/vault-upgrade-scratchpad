String.prototype.titleize = function () {
  return this.split(' ').map(function (term) { return _.capitalize(term) }).join(' ')
}

String.prototype.stripTags = function () {
  return this.replace(/<\w+(\s+("[^"]*"|'[^']*'|[^>])+)?>|<\/\w+>/gi, '') // eslint-disable-line security/detect-unsafe-regex
}

String.prototype.unescapeHTML = function () {
  return this.stripTags().replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
}

String.prototype.escapeHTML = function () {
  return this.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
