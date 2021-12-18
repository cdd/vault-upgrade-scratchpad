function lightBox() {
  function MoleculePopup() {
    const IMAGE_HEIGHT_OFFSET = 164 // subcontainer height - image height (not really)
    const TEXT_AREA_HEIGHT_OFFSET = 147 // IMAGE_HEIGHT_OFFSET - textarea height
    const RESIZE_SCALE = 2.4 // 2.4 seems to be the magic ratio to keep the element near the cursor

    function rasterDimensionSetting(event) {
      const image = event.currentTarget
      const imageSize = image.pendingImageSize

      if (typeof image.aspectRatio === 'undefined') {
        image.aspectRatio = image.width / image.height
      }

      const jqThis = $(image)
      let heightUsed = -1
      if (image.pendingImageSizeRepresentsWidth) {
        if (image.aspectRatio >= 1) {
          jqThis.width(imageSize)

          heightUsed = imageSize / image.aspectRatio
        } else {
          heightUsed = image.height
        }
        jqThis.height(heightUsed)
      } else {
        let widthToSet = imageSize * image.aspectRatio
        let heightToSet = imageSize

        if (widthToSet > image.parentWidth) {
          widthToSet = image.parentWidth
          heightToSet = widthToSet / image.aspectRatio
        }

        jqThis.width(widthToSet)
        jqThis.height(heightToSet)
        heightUsed = heightToSet
      }

      const topMargin = (imageSize - heightUsed) / 2
      const bottomMargin = imageSize - heightUsed - topMargin
      jqThis.css('margin-top', topMargin)
      jqThis.css('margin-bottom', bottomMargin)
    }

    function resizeMoleculePopup(lightBox, subcontainer) {
      return function (event, ui) {
        // not sure why this was triggering for other resizables, but this prevents it
        if (event.target === window || lightBox.has(event.target).length) {
          if ($('.light-box').hasClass('self_sizing')) {
            return
          }
          if (ui !== undefined) {
            // if resizable resize
            // using subcontainer to store so that the min and max width and height is factored in the math
            subcontainer.width(ui.size.width + (ui.size.width - ui.originalSize.width) / RESIZE_SCALE)
            subcontainer.height(ui.size.height + (ui.size.height - ui.originalSize.height) / RESIZE_SCALE)
          }
          const width = subcontainer.width()
          const height = subcontainer.height()
          const images = lightBox.find('.thumbnail').not('.raster_image')
          const textarea = lightBox.find('textarea')
          const imageSize = Math.min(height - IMAGE_HEIGHT_OFFSET, width)
          const textareaSize = height - TEXT_AREA_HEIGHT_OFFSET - imageSize
          textarea.height(textareaSize)
          images.width(imageSize)
          images.height(imageSize)
          if (ui !== undefined) {
            ui.size.width = imageSize
            ui.size.height = height
          } else {
            subcontainer.width(imageSize)
          }

          const rasterImages = lightBox.find('.raster_image')
          const imageSizeRepresentsWidth = (imageSize === width)
          rasterImages.each(function () {
            this.pendingImageSize = imageSize
            this.pendingImageSizeRepresentsWidth = imageSizeRepresentsWidth
            this.parentWidth = width

            if (!this.complete) {
              this.addEventListener('load', rasterDimensionSetting)
            } else {
              const mockEvent = {}

              mockEvent.currentTarget = this
              rasterDimensionSetting(mockEvent)
            }
          })
        }
      }
    }

    this.onOpen = function (lightBox) {
      const subcontainer = lightBox.children('.subcontainer')

      lightBox.find('.thumbnail').each(function () {
        const src = this.dataset.src
        if (src !== undefined) {
          this.src = src
          this.removeAttribute('data-src')

          if ($(this).is(':visible')) {
            $(this).on('load', resizeMoleculePopup(lightBox, subcontainer))
          }

          if ($(this).hasClass('emf_thumbnail')) {
            $(this).on('error', function () {
              this.src = "data:image/svg+xml;utf8,<svg viewBox='0 0 280 280' xmlns='http://www.w3.org/2000/svg'><text text-anchor='middle' x='140' y='130'>Your browser cannot display EMF images,</text><text text-anchor='middle' x='140' y='150'>but you can download the file.</text></svg>"
            })
          }
        }
      })
    }
    this.onLoad = function (lightBox) {
      const subcontainer = lightBox.children('.subcontainer')

      subcontainer.resizable({
        resize: resizeMoleculePopup(lightBox, subcontainer),
      })

      $(window).resize(resizeMoleculePopup(lightBox, subcontainer))
    }
  }
  const moleculePopup = new MoleculePopup()

  const customOpenBehaviors = {
    'molecule-download-copy-popup': moleculePopup.onOpen,
  }

  const customLoadBehaviors = {
    'molecule-download-copy-popup': moleculePopup.onLoad,
  }

  function open() {
    const link = $(this)
    const lightBox = link.nextAll('.light-box:first')

    lightBox.appendTo('body')
    lightBox.removeClass('hidden')
    $('body').addClass('light-box-open')
    link.addClass('light-box-link__open')

    for (const lightBoxCustomClass in customOpenBehaviors) {
      if (lightBox.hasClass(lightBoxCustomClass)) {
        customOpenBehaviors[lightBoxCustomClass](lightBox)
      }
    }
  }

  function forceClose() {
    const lightBox = $('.light-box:not(.hidden)')
    const link = $('.light-box-link__open')

    link.removeClass('light-box-link__open')
    $('body').removeClass('light-box-open')
    lightBox.addClass('hidden')
    lightBox.appendTo(link.parent())
  }

  let previous = null
  function preventBadClose(event) {
    previous = event.target
  }

  function close(event) {
    if (this === event.target && this === previous) {
      event.stopPropagation()
      forceClose()
    } else if (event.keyCode === $.ui.keyCode.ESCAPE) {
      forceClose()
    }
  }

  $(document).ready(function () {
    for (const lightBoxCustomClass in customLoadBehaviors) {
      $('.' + lightBoxCustomClass).each(function () {
        customLoadBehaviors[lightBoxCustomClass]($(this))
      })
    }
  })

  $(document).on('click', '.light-box-link', open)

  $(document).on('mousedown', preventBadClose)

  $(document).on('click', '.light-box', close)

  $(document).on('click', '.light-box-close-link', forceClose)

  $(document).on('keyup', close)
}
lightBox()
