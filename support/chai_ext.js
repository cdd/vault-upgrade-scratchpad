// chai matchers
chai.Assertion.addMethod('color', function (rOrName, g, b) {
  var actual = this._obj,
    color = actual.css('color')

  if (typeof (rOrName) === 'string') {
    actual.css('color', rOrName)
  } else {
    actual.css('color', 'rgb(' + rOrName + ', ' + g + ', ' + b + ')')
  }

  this.assert(
    color === actual.css('color'),
    'expected #{this} to have color #{exp} but got #{act}',
    'expected #{this} to not have color #{exp} but got #{act}',
    actual.css('color'),
    color
  )
})

chai.Assertion.addMethod('selectedIndex', function (selectedIndex) {
  var actual = this._obj.prop('selectedIndex')
  this.assert(
    actual === selectedIndex,
    'expected #{this} to have selectedIndex #{exp} but got #{act}',
    'expected #{this} to not have selectedIndex #{exp} but got #{act}',
    selectedIndex,
    actual
  )
})

chai.Assertion.addMethod('allClassNames', function (classNames) {
  var classes = function (classString) {
    return (classString ? classString.replace(/\s+/, ' ').split(' ') : []).sort()
  }

  var actual = this._obj.attr('class')
  this.assert(
    JSON.stringify(classes(actual)) === JSON.stringify(classes(classNames)),
    'expected #{this} to include class names #{exp}',
    'expected #{this} to not include class names #{exp}',
    classNames,
    actual
  )
})
