import React from 'react'
import ReactDOM, {render} from 'react-dom'
import TestReactComponent from './TestReactComponent'


require.context('../assets/images/structureless/')
// eslint-disable-next-line no-undef

if (window.Globals === undefined) {
  window.Globals = {}
}

let Globals = window.Globals

console.log(`window.Globals = ${JSON.stringify(window.Globals)}`)

_.merge(window.Globals, {
  Component: {
    Class: {
      TestReactComponent,
    },
    Instance: {},
  },
})
console.log(`window.Globals = ${JSON.stringify(window.Globals)}`)
console.log(`!!window.Globals.Component.TestReactComponent = ${!!window.Globals.Component.TestReactComponent}`)


function renderReactComponents(root = 'body') {
  var components = $(root).find('.react_component').map(function (index) {
    var $this = $(this)
    var ReactComponentClass = Globals.Component.Class[$(this).attr('component_class')]
    var reactComponentProperties = JSON.parse($(this).attr('react_props') || { })
    var contentHtmlHash = { __html: $this.html() }
    return render(<ReactComponentClass {...reactComponentProperties} ><div dangerouslySetInnerHTML={contentHtmlHash} /></ReactComponentClass>, this)
  })
  return components
}
window.renderReactComponents = renderReactComponents
window.ReactDOM = window.ReactDOM || ReactDOM

$(document).ready(function () {
  renderReactComponents()
})

