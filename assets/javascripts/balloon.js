/*
 balloon.js -- a DHTML library for balloon tooltips

 CDD changes: Use Prototype rather than Yahoo library, additional features, bug fixes, and general clean up.

 $Id: balloon.js,v 1.23 2008/06/19 00:05:30 sheldon_mckay Exp $

 See http://www.gmod.org/wiki/index.php/Popup_Balloons
 for documentation.

 Copyright (c) 2007 Sheldon McKay, Cold Spring Harbor Laboratory

 This balloon tooltip package and associated files not otherwise copyrighted are
 distributed under the MIT-style license:

 http://opensource.org/licenses/mit-license.php

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.

 If publications result from research using this SOFTWARE, we ask that
 CSHL and the author be acknowledged as scientifically appropriate.

*/

// These global variables are necessary to avoid losing scope when
// setting the balloon timeout and for inter-object communication
/// ////////////////////////////////////////////////
// Constructor for Balloon class                 //
// Balloon configuration                         //
// Reset these values for custom balloon designs //
/// ////////////////////////////////////////////////
import closeGif from '../images/cdd30/layout/balloons/close.gif'

var currentBalloonClass
var balloonIsVisible
var balloonIsSticky
var balloonInvisibleSelects
var balloonIsSuppressed
var tooltipIsSuppressed

var Balloon = function () {
  // Location of optional ajax handler that returns tooltip contents
  // this.helpUrl = '/cgi-bin/help.pl';

  // ID of element to which balloon should be added
  // default = none (document.body is used)
  // This option may be required for mediawiki or other
  // implementations with complex stylesheets
  this.parentID = null

  // color of the font contained in basic balloons (default black)
  this.fontColor = '#593216'

  // maximum allowed balloon width (px)
  this.minWidth = 150

  // minimum allowed balloon width (px)
  this.maxWidth = 600

  // Default tooltip text size
  this.balloonTextSize = '100%'

  // Delay before balloon is displayed (msec)
  this.delayTime = 500

  // If fade-in/out is allowed
  this.allowFade = false

  // time interval for fade-in (msec)
  this.fadeIn = 300

  // time interval for fade-out (msec)
  this.fadeOut = 300

  // Vertical Distance from cursor location (px)
  this.vOffset = 25

  // text-padding within the balloon (px)
  this.padding = 25

  // How long to display mousover balloons (msec)
  // false = 'always on'
  this.displayTime = false

  // width of shadow (space aroung whole balloon; px)
  // This can be zero if there is no shadow and the
  // edges of the balloon are also the edges of the image
  this.shadow = 0

  // whether the balloon should have a stem
  this.stem = false

  // The height (px) of the stem and the extent to which the
  // stem image should overlaps the balloon image.
  this.stemHeight = 32
  this.stemOverlap = 3

  // A close button for sticky balloons
  this.closeButton = closeGif
  this.closeButtonWidth = 16

  // scrolling aborts unsticky balloons
  document.onscroll = Balloon.prototype.hideTooltip

  // make balloons go away if the page is unloading or waiting
  // to unload.
  window.onbeforeunload = function () {
    Balloon.prototype.hideTooltip(1)
    balloonIsSuppressed = true
  }

  if (this.isIE()) {
    this.suppress = true
  }
}

// use this to enable toggling the balloon by clicking on a link
Balloon.prototype.toggleTooltip = function (evt, caption, sticky, width) {
  if (balloonIsVisible) {
    var el = this.getEventTarget(evt)
    if (this.isSameElement(el, this.firingElement)) {
      this.hideTooltip(1)
      return
    }
  }
  this.showTooltip(evt, caption, sticky, width)
}

/// ///////////////////////////////////////////////////////////////////////
// This is the function that is called on mouseover.  It has a built-in //
// delay time to avoid balloons popping up on rapid mouseover events     //
/// ///////////////////////////////////////////////////////////////////////
Balloon.prototype.showTooltip = function (evt, caption, sticky, width) {
  // Awful IE bug, page load aborts if the balloon is fired
  // before the page is fully loaded.
  if (this.isIE() && document.readyState.match(/complete/i)) {
    this.suppress = false
  }

  // All balloons have been suppressed, go no further
  if (this.suppress || balloonIsSuppressed) {
    return false
  }

  // Non-sticky balloons suppressed
  if (tooltipIsSuppressed && !sticky) {
    return false
  }

  // Sorry Konqueror, no fade-in for you!
  if (this.isKonqueror()) this.allowFade = false

  // Check for mouseover (vs. mousedown or click)
  var mouseOver = evt.type.match('mouseover', 'i')

  // if the firing event is a click, fade-in and a non-sticky balloon make no sense
  if (!mouseOver) {
    sticky = true
    this.fadeOK = false
  } else {
    this.fadeOK = this.allowFade
  }

  // Don't fire on mouseover if a non-sticky balloon is visible
  if (balloonIsVisible && !balloonIsSticky && mouseOver) return false

  // Don't start a non-sticky balloon if a sticky one is visible
  if (balloonIsVisible && balloonIsSticky && !sticky) return false

  // Ignore repeated firing of mouseover->mouseout events on
  // the same element (Safari)
  var el = this.getEventTarget(evt)
  if (sticky && mouseOver && this.isSameElement(el, this.currentElement)) return false
  this.firingElement = el

  // A new sticky balloon can erase an old one
  if (sticky) this.hideTooltip(1)

  // attach a mouseout event handler to the target element
  var closeBalloon = function () {
    var override = balloonIsSticky && !balloonIsVisible
    Balloon.prototype.hideTooltip(override)
  }
  if (!mouseOver) el.onmouseup = function () { return false }
  else el.onmouseout = closeBalloon

  balloonIsSticky = sticky

  // force balloon width and/or height if requested
  this.width = width

  this.hideTooltip()

  // if this is IE < 7 use an alternative image id provided
  if (this.isOldIE() && this.ieImage) {
    this.ieImage = null
  }

  // look for a url in the balloon contents
  if (caption.match(/^url:/)) {
    var urlArray = caption.split(':')
    caption = ''
    this.activeUrl = urlArray[1]

  // or if the contents are to be retrieved from an element
  } else if (caption.match(/^load:/)) {
    var load = caption.split(':')
    if (!document.getElementById(load[1])) alert('problem locating element ' + load[1])
    caption = document.getElementById(load[1]).innerHTML
    this.loadedFromElement = true

  // or if the text is a bare hyperlink
  } else if (caption.match(/^(https?:|\/|ftp:)\S+$/i)) {
    this.activeUrl = caption
    caption = ''
  }

  // request the contents synchronously (ie wait for result)
  this.currentHelpText = this.getContents(caption)
  this.loadedFromElement = false

  // Put the balloon contents and images into a visible (but offscreen)
  // element so they will be preloaded and have a layout to
  // calculate the balloon dimensions
  if (!this.container) {
    this.container = document.createElement('div')
    document.body.appendChild(this.container)
    this.setStyle(this.container, 'position', 'absolute')
    this.setStyle(this.container, 'top', -8888)
    this.setStyle(this.container, 'display', 'none')
  } else {
    this.setStyle(this.container, 'display', 'none')
  } // eslint-disable-line no-unsafe-innerhtml/no-unsafe-innerhtml

  this.container.innerHTML = this.currentHelpText // eslint-disable-line no-unsafe-innerhtml/no-unsafe-innerhtml

  currentBalloonClass = this

  this.setActiveCoordinates(evt)

  // make delay time short for onmousedown
  var delay = mouseOver ? this.delayTime : 1
  this.timeoutTooltip = window.setTimeout(this.doShowTooltip, delay)
}

/// //////////////////////////////////////////////////////////////////
// Tooltip rendering function
/// //////////////////////////////////////////////////////////////////
Balloon.prototype.doShowTooltip = function () {
  var self = currentBalloonClass

  // Stop firing if a balloon is already being displayed
  if (balloonIsVisible) return false

  if (!self.parent) {
    if (self.parentID) {
      self.parent = document.getElementById(self.parentID)
    } else {
      self.parent = document.body
    }
    self.xOffset = self.getRegion(self.parent).left
    self.yOffset = self.getRegion(self.parent).top
  }

  // a short delay time might cause some intereference
  // with fade-out
  window.clearTimeout(self.timeoutFade)
  self.setStyle('balloon', 'display', 'none')

  // make sure user-configured numbers are not strings
  self.parseIntAll()

  // create the balloon object
  self.makeBalloon()

  // window dimensions
  var pageWidth = window.innerWidth
  var pageHeight = window.innerHeight
  var pageLeft = $(document).scrollLeft()
  var pageTop = $(document).scrollTop()
  var pageCen = pageLeft + Math.round(pageWidth / 2)
  var pageMid = pageTop + Math.round(pageHeight / 2)

  // balloon orientation
  var vOrient = self.activeTop > pageMid ? 'up' : 'down'
  var hOrient = self.activeRight > pageCen ? 'left' : 'right'

  // get the preloaded balloon contents
  var helpText = self.container.innerHTML

  self.contents.innerHTML = helpText // eslint-disable-line no-unsafe-innerhtml/no-unsafe-innerhtml

  // how and where to draw the balloon
  self.setBalloonStyle(vOrient, hOrient, pageWidth, pageLeft)

  // sticky balloons need a close control
  if (balloonIsSticky) {
    var topRight = document.getElementById('topRight')
    var margin = Math.round(self.padding / 2)
    var padding = 5
    var top = margin + self.shadow + 7 + padding
    var marginLeft = self.closeButtonWidth + 1 - margin + (padding * 2)

    // eslint-disable-next-line no-unsafe-innerhtml/no-unsafe-innerhtml
    topRight.innerHTML = '\
      <img src="' + self.closeButton + '" title="Close" id="close_button" \
          style="padding:' + padding + 'px;position:absolute;top:' + top + 'px;left:0px;\
          margin-left:-' + marginLeft + 'px;cursor:pointer;z-index:3">'
    topRight.onclick = function () { Balloon.prototype.hideTooltip(1) }
  }

  balloonIsVisible = true

  // in IE < 7, hide <select> elements
  self.showHide()

  self.fade(1, 95, self.fadeIn)
}

// use a fresh object every time to make sure style
// is not polluted
Balloon.prototype.makeBalloon = function () {
  var self = currentBalloonClass

  var balloon = document.getElementById('balloon')
  if (balloon) self.parent.removeChild(balloon)

  balloon = document.createElement('div')
  balloon.setAttribute('id', 'balloon')
  self.parent.appendChild(balloon)
  self.activeBalloon = balloon

  self.parts = new Array(balloon)
  var parts = new Array('contents', 'topRight', 'bottomRight', 'bottomLeft')
  for (var i = 0; i < parts.length; i++) {
    var child = document.createElement('div')
    child.setAttribute('id', parts[i])
    balloon.appendChild(child)
    if (parts[i] == 'contents') self.contents = child
    self.parts.push(child)
  }

  if (!balloonIsSticky && self.displayTime) {
    self.timeoutAutoClose = window.setTimeout(this.hideTooltip, self.displayTime)
  }
  return balloon
}

Balloon.prototype.setBalloonStyle = function (vOrient, hOrient, pageWidth, pageLeft) {
  var self = currentBalloonClass
  var balloon = self.activeBalloon

  if (typeof (self.shadow) != 'number') self.shadow = 0
  if (!self.stem) self.stemHeight = 0

  var fullPadding = self.padding + self.shadow
  var insidePadding = self.padding

  self.setStyle(balloon, 'position', 'absolute')
  self.setStyle(balloon, 'top', -9999)
  self.setStyle(balloon, 'z-index', 1000000)

  self.setStyle('bottomRight', 'position', 'absolute')
  self.setStyle('bottomRight', 'right', 0 - fullPadding)
  self.setStyle('bottomRight', 'bottom', 0 - fullPadding)
  self.setStyle('bottomRight', 'height', fullPadding)
  self.setStyle('bottomRight', 'width', fullPadding)
  self.setStyle('bottomRight', 'z-index', -1)

  self.setStyle('topRight', 'position', 'absolute')
  self.setStyle('topRight', 'right', 0)
  self.setStyle('topRight', 'top', 0)
  self.setStyle('topRight', 'width', fullPadding)
  self.setStyle('topRight', 'z-index', 3)

  self.setStyle('bottomLeft', 'position', 'absolute')
  self.setStyle('bottomLeft', 'left', 0)
  self.setStyle('bottomLeft', 'bottom', 0 - fullPadding)
  self.setStyle('bottomLeft', 'height', fullPadding)
  self.setStyle('bottomLeft', 'z-index', -1)

  // make sure our balloon doesn't go off the top of the page
  if (vOrient == 'up' && self.activeTop - self.vOffset - self.stemHeight - self.getRegion(balloon).height < 30) vOrient = 'down'

  if (this.stem) {
    var stem = document.createElement('img')
    self.setStyle(stem, 'position', 'absolute')
    balloon.appendChild(stem)

    var height
    if (vOrient == 'up' && hOrient == 'left') {
      stem.src = self.upLeftStem
      height = self.stemHeight + insidePadding - self.stemOverlap
      self.setStyle(stem, 'bottom', 0 - height)
      self.setStyle(stem, 'right', 0)
    } else if (vOrient == 'down' && hOrient == 'left') {
      stem.src = self.downLeftStem
      height = self.stemHeight - (self.shadow + self.stemOverlap)
      self.setStyle(stem, 'top', 0 - height)
      self.setStyle(stem, 'right', 0)
    } else if (vOrient == 'up' && hOrient == 'right') {
      stem.src = self.upRightStem
      height = self.stemHeight + insidePadding - self.stemOverlap
      self.setStyle(stem, 'bottom', 0 - height)
      self.setStyle(stem, 'left', self.shadow)
    } else if (vOrient == 'down' && hOrient == 'right') {
      stem.src = self.downRightStem
      height = self.stemHeight - (self.shadow + self.stemOverlap)
      self.setStyle(stem, 'top', 0 - height)
      self.setStyle(stem, 'left', self.shadow)
    }
  }

  // flip left or right, as required
  if (hOrient == 'left') {
    var activeRight = pageWidth - self.activeLeft
    self.setStyle(balloon, 'right', activeRight + self.xOffset)
  } else {
    self.setStyle(balloon, 'left', self.activeLeft - self.xOffset)
  }

  if (!self.width) {
    var width = self.getRegion('contents').width
    if (self.isIE()) width += 50
    if (width > self.maxWidth) width = self.maxWidth + 50
    if (width < self.minWidth) width = self.minWidth
    self.setStyle(balloon, 'width', width)
  } else {
    self.setStyle(balloon, 'width', self.width)
  }

  // Make sure the balloon is not offscreen
  var balloonPad = self.padding + self.shadow
  var balloonLeft = self.getRegion(balloon).left
  var balloonRight = self.getRegion(balloon).right
  if (hOrient == 'left') balloonLeft += balloonPad
  if (hOrient == 'right') balloonRight += balloonPad
  var pageRight = pageLeft + pageWidth

  if (hOrient == 'right' && balloonRight > (pageRight - 30)) {
    self.setStyle(balloon, 'width', (pageRight - balloonLeft) - 50)
  } else if (hOrient == 'left' && balloonLeft < (pageLeft + 30)) {
    self.setStyle(balloon, 'width', (balloonRight - pageLeft) - 50)
  }

  // Set the width/height for the right and bottom outlines
  var lineWidth = self.getRegion(balloon).width
  var lineHeight = self.getRegion(balloon).height

  self.setStyle('topRight', 'height', lineHeight)
  self.setStyle('bottomLeft', 'width', lineWidth)

  // DB: Better to have overlap than holes
  // // IE7 quirk -- look for unwanted overlap cause by an off by 1px error
  // var vOverlap = self.isOverlap('topRight','bottomRight');
  // var hOverlap = self.isOverlap('bottomLeft','bottomRight');
  // if (vOverlap) self.setStyle('topRight','height',lineHeight-vOverlap[1]);
  // if (hOverlap) self.setStyle('bottomLeft','width',lineWidth-hOverlap[0]);

  var activeTop
  if (vOrient == 'up') {
    activeTop = self.activeTop - self.vOffset - self.stemHeight - lineHeight
    self.setStyle(balloon, 'top', activeTop - self.yOffset)
    self.setStyle(balloon, 'display', 'inline')
  } else {
    activeTop = self.activeTop + self.vOffset + self.stemHeight
    self.setStyle(balloon, 'top', activeTop - self.yOffset)
  }

  self.setStyle('contents', 'z-index', 2)
  self.setStyle('contents', 'color', self.fontColor)
  self.setStyle('contents', 'border', '1px solid #eee')
  self.setStyle('contents', 'padding', fullPadding)
  self.setStyle('contents', 'padding-bottom', '10px')
  self.setStyle('contents', 'border-radius', '5px')
  self.setStyle('contents', 'background', '#fcfcfc')
  self.setStyle('contents', 'box-shadow', '0px 0px 5px 0px #eee')

  self.setOpacity(1)
}

// Fade method adapted from an example on
// http://brainerror.net/scripts/javascript/blendtrans/
Balloon.prototype.fade = function (opacStart, opacEnd, millisec) {
  var self = currentBalloonClass || new Balloon()

  // speed for each frame
  var speed = Math.round(millisec / 100)
  var timer = 0
  if (opacStart > opacEnd) {
    if (self.fadeOK) {
      for (o = opacStart; o >= opacEnd; o--) {
        self.timeoutFade = setTimeout(Balloon.prototype.setOpacity, (timer * speed), o)
        timer++
      }
      setTimeout(Balloon.prototype.setStyle, millisec, 'balloon', 'display', 'none')
    } else {
      self.setStyle('balloon', 'display', 'none')
    }
  } else if (opacStart < opacEnd && self.fadeOK) {
    for (o = opacStart; o <= opacEnd; o++) {
      self.timeoutFade = setTimeout(Balloon.prototype.setOpacity, (timer * speed), o)
      timer++
    }
  }
}

Balloon.prototype.setOpacity = function (opc) {
  var self = currentBalloonClass
  if (!self || !self.fadeOK) return false

  var o = parseFloat((opc || 0) / 100)

  /// //////////////////////////////////////////////////////////
  // Very irritating IE deficiency: it can't handle changing //
  // opacity of child elements.  Just fade balloon contents  //
  // for IE and the whole balloon for less obtuse browsers.  //
  var el = self.isIE() ? 'contents' : 'balloon' //
  /// //////////////////////////////////////////////////////////

  var b = document.getElementById(el)
  if (!b) return false

  // CSS standards-compliant browsers!
  self.setStyle(b, 'opacity', o)
  // old IE
  self.setStyle(b, 'filter', 'alpha(opacity= ' + opc + ')')
  // old Mozilla/NN
  self.setStyle(b, 'MozOpacity', o)
  // old Safari
  self.setStyle(b, 'KhtmlOpacity', o)
}

Balloon.prototype.hideTooltip = function (override) {
  // some browsers pass the event object == we don't want it
  if (override && typeof override == 'object') override = false
  if (balloonIsSticky && !override) return false

  var self = currentBalloonClass

  if (self) {
    window.clearTimeout(self.timeoutTooltip)
    window.clearTimeout(self.timeoutAutoClose)
  }

  if (balloonIsSticky && self) self.currentElement = null

  balloonIsVisible = false
  balloonIsSticky = false

  if (!self) {
    var hideBalloon = document.getElementById('balloon')
    if (hideBalloon) Balloon.prototype.setStyle(hideBalloon, 'display', 'none')
  } else if (self.activeBalloon) {
    if (!override && self.fadeOK && !self.isIE()) self.fade(95, 0, self.fadeOut)
    else self.setStyle(self.activeBalloon, 'display', 'none')
  }
  Balloon.prototype.showHide(1)
}

// Track the active mouseover coordinates
Balloon.prototype.setActiveCoordinates = function (event) {
  var self = currentBalloonClass
  if (!self) return false

  var evt = event || window.event
  var XY = self.eventXY(evt)
  self.activeTop = XY[1] - 10
  self.activeLeft = XY[0] - 10
  self.activeRight = self.activeLeft + 20
  self.activeBottom = self.activeTop + 20

  return true
}

/// /
// event XY and getEventTarget Functions based on examples by Peter-Paul
// Koch http://www.quirksmode.org/js/events_properties.html
Balloon.prototype.eventXY = function (event) {
  var XY = new Array(2)
  var e = event || window.event
  XY[0] = e.pageX || e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft
  XY[1] = e.pageY || e.clientY + document.body.scrollTop + document.documentElement.scrollTop
  return XY
}

Balloon.prototype.getEventTarget = function (event) {
  var targ
  var e = event || window.event
  if (e.target) targ = e.target
  else if (e.srcElement) targ = e.srcElement
  if (targ.nodeType == 3) targ = targ.parentNode // Safari
  return targ
}
/// /

Balloon.prototype.setStyle = function (el, att, val) {
  if (!el) return false
  if (val && att.match(/left|top|bottom|right|width|height|padding|margin/)) val += 'px'
  if (typeof (el) != 'object') el = document.getElementById(el)
  if (el == null) return false

  // z-index does not work as expected
  if (att == 'z-index') {
    if (el.style) {
      el.style.zIndex = parseInt(val)
    }
  } else {
    var styles = {}
    var attCamelized = att.replace(/-\w/, function ($1) { return $1.slice(1).toUpperCase() }) // Very simplified camelizer, but should be enough for style properties
    styles[attCamelized] = val
    $(el).css(styles).css(styles)
  }
}

// Get the location and dimensions for an element
Balloon.prototype.getRegion = function (el, request) {
  var element = (typeof el === 'string') ? $('#' + el) : $(el)
  var dimensions = { 'height': element.outerHeight(), 'width': element.outerWidth() }
  var scrollOffset = { left: $(document).scrollLeft(), top: $(document).scrollTop() }
  var offset = element[0].getBoundingClientRect()
  var offsetTop = offset.top + scrollOffset.top
  var offsetLeft = offset.left + scrollOffset.left
  return { top: offsetTop, bottom: (offsetTop + dimensions.height), left: offsetLeft, right: (offsetLeft + dimensions.width), width: dimensions.width, height: dimensions.height }
}

// We don't know if numbers are overridden with strings
// so play it safe
Balloon.prototype.parseIntAll = function () {
  this.padding = parseInt(this.padding)
  this.shadow = parseInt(this.shadow)
  this.stemHeight = parseInt(this.stemHeight)
  this.stemOverlap = parseInt(this.stemOverlap)
  this.vOffset = parseInt(this.vOffset)
  this.delayTime = parseInt(this.delayTime)
  this.width = parseInt(this.width)
  this.maxWidth = parseInt(this.maxWidth)
  this.minWidth = parseInt(this.minWidth)
  this.fadeIn = parseInt(this.fadeIn)
  this.fadeOut = parseInt(this.fadeOut)
}

// show/hide select elements in older IE
// plus user-defined elements
Balloon.prototype.showHide = function (visible) {
  var i, id
  var self = currentBalloonClass || new Balloon()

  // IE z-index bug fix (courtesy of Lincoln Stein)
  if (self.isOldIE()) {
    if (!visible) {
      var balloonSelects = document.getElementById('contents').getElementsByTagName('select')
      var myHash = new Object()
      for (i = 0; i < balloonSelects.length; i++) {
        id = balloonSelects[i].id || balloonSelects[i].name
        myHash[id] = 1
      }
      balloonInvisibleSelects = new Array()
      var allSelects = document.getElementsByTagName('select')
      for (i = 0; i < allSelects.length; i++) {
        id = allSelects[i].id || allSelects[i].name
        if (self.isOverlap(allSelects[i], self.activeBalloon) && !myHash[id]) {
          balloonInvisibleSelects.push(allSelects[i])
          self.setStyle(allSelects[i], 'visibility', 'hidden')
        }
      }
    } else if (balloonInvisibleSelects) {
      for (i = 0; i < balloonInvisibleSelects.length; i++) {
        id = balloonInvisibleSelects[i].id || balloonInvisibleSelects[i].name
        self.setStyle(balloonInvisibleSelects[i], 'visibility', 'visible')
      }
      balloonInvisibleSelects = null
    }
  }

  // show/hide any user-specified elements that overlap the balloon
  if (self.hide) {
    var display = visible ? 'inline' : 'none'
    for (var n = 0; n < self.hide.length; n++) {
      if (self.isOverlap(self.activeBalloon, self.hide[n])) {
        self.setStyle(self.hide[n], 'display', display)
      }
    }
  }
}

// Try to find overlap
Balloon.prototype.isOverlap = function (el1, el2) {
  if (!el1 || !el2) return false
  var R1 = this.getRegion(el1)
  var R2 = this.getRegion(el2)
  if (!R1 || !R2) return false
  // intersect the two regions
  var intersect = { top: Math.max(R1.top, R2.top), left: Math.max(R1.left, R2.left), bottom: Math.min(R1.bottom, R2.bottom), right: Math.min(R1.right, R2.right) }
  if (intersect.top >= intersect.bottom || intersect.left >= intersect.right) return null
  // extent of overlap;
  return new Array((intersect.right - intersect.left), (intersect.bottom - intersect.top))
}

// Coordinate-based test for the same element
Balloon.prototype.isSameElement = function (el1, el2) {
  if (!el1 || !el2) return false
  var R1 = this.getRegion(el1)
  var R2 = this.getRegion(el2)
  return (R1.left == R2.left) && (R1.right == R2.right) && (R1.top == R2.top) && (R1.bottom == R2.bottom)
}

/// ////////////////////////////////////////////////////
// AJAX widget to fill the balloons
// requires prototype.js
/// ////////////////////////////////////////////////////
Balloon.prototype.getContents = function (section) {
  // just pass it back if no AJAX handler is required.
  if (!this.helpUrl && !this.activeUrl) return section

  // or if the comntents are alreday loaded
  if (this.loadedFromElement) return section

  // inline URL takes precedence
  var url = this.activeUrl || this.helpUrl
  url += this.activeUrl ? '' : '?section=' + section

  // activeUrl is meant to be single-use only
  this.activeUrl = null

  var ajax
  if (window.XMLHttpRequest) {
    ajax = new XMLHttpRequest()
  } else {
    ajax = new ActiveXObject('Microsoft.XMLHTTP')
  }

  if (ajax) {
    ajax.open('GET', url, false)
    try {
      ajax.send(null)
    } catch (e) {
    // alert(e);
    }
    this.helpText = ajax.responseText || section
    return this.helpText
  } else {
    return section
  }
}

// test for internet explorer
Balloon.prototype.isIE = function () {
  return document.all && !window.opera
}

// test for internet explorer (but not IE7)
Balloon.prototype.isOldIE = function () {
  if (navigator.appVersion.indexOf('MSIE') == -1) return false
  var temp = navigator.appVersion.split('MSIE')
  return parseFloat(temp[1]) < 7
}

// test for Konqueror
Balloon.prototype.isKonqueror = function () {
  return navigator.userAgent.indexOf('Konqueror') != -1
}

window.balloon = new Balloon()
