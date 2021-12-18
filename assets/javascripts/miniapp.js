// When the dom loads, set up miniApp automatic and dragger resizing
$(document).ready(function () {
  var miniApp = $('#miniApp')
  var resizer = $('#miniApp-panels-resize')
  var panels = $('#miniApp-panels')
  var content = $('#miniApp-content')
  var sidebar = $('#miniApp-panels-sidebar')
  var main = $('#miniApp-panels-main')
  var fade = $('#miniApp-panels-sidebar-fade')

  function startResizing() {
    resizer.css({ 'left': (resizer.position().left) + 'px' })
  }

  function resizeColumns() {
    var offset = resizer.position().left // offset in px
    var miniAppWidth = panels.width()
    if (panels.hasClass('sidebar-left')) {
      sidebar.css({ 'width': offset + 'px' })
      main.css({ 'left': offset + 'px', 'width': (miniAppWidth - offset) + 'px' })
      fade.css({ 'left': offset + 'px' })
    } else if (panels.hasClass('sidebar-right')) {
      sidebar.css({ 'left': offset + 'px', 'width': (miniAppWidth - offset) + 'px' })
      main.css({ 'width': offset + 'px' })
    }
  }

  function doneResizing() {
    if (panels.hasClass('sidebar-left')) {
      resizer.css({ 'left': sidebar.css('width') })
    } else if (panels.hasClass('sidebar-right')) {
      resizer.css({ 'left': main.css('width') })
    }

    miniApp.trigger('miniApp::resize')
  }

  function resizeMiniApp() {
    content.css({ height: ($(window).height() - content.position().top) + 'px' })
    resizeColumns()
    doneResizing()
    // When the window is below a certain width, media queries cause the sidebar to be hidden, and
    // the sidebar stays hidden even when the window is resized to be large enough to show it.
    // So when resizing the window, show the sidebar at its minimum width if the window is large
    // enough to show it. https://www.pivotaltracker.com/n/projects/200/stories/175623352
    if (panels.hasClass('sidebar-left')) {
      if (window.innerWidth > 700 && resizer.position().left < 220) {
        resizer.css({ 'left': (220) + 'px' })
      }
    }
    miniApp.trigger('miniApp::resize')
  }

  if (miniApp !== undefined) {
    resizeMiniApp()
    $(window).on('resize', function () {
      resizeMiniApp()
    })

    // this classy little hack forces IE6 to redraw
    // (otherwise, it loads a blank page until you resize)
    miniApp.className = miniApp.className
  }

  if (fade !== undefined) {
    var fadeVisible = true
    // every 0.2 seconds ...
    var periodicalExecuter = function () {
      // if the sidebar has a vertical scrollbar, hide the overflow fader
      if (sidebar.get(0).scrollHeight > sidebar.height() && fadeVisible) {
        $(fade).hide()
        fadeVisible = false
      } else if (sidebar.get(0).scrollHeight <= sidebar.height() && !fadeVisible) {
        $(fade).show()
        fadeVisible = true
      }
    }
    setInterval(periodicalExecuter, 200)
  }

  if (resizer !== undefined) {
    $(resizer).draggable({
      axis: 'x',
      start: startResizing,
      drag: resizeColumns,
      stop: doneResizing,
    })
  }
})
