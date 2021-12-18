import $ from 'jquery'

/*
 * React/Enzyme have no way of knowing if a spec is finished, so we have to
 * manually clean them up.
 *
 */
export default function checkForPageCleanup() {
  /*
   * The spec runners insert script and style tags, so we ought to ignore
   * those. We should be pretty safe if even just looked for divs.
   * EJSChart draws asynchronously, so skip those for now.
   */
  const elements = $('body :not(style, script):not([class^="ejsc"])')

  if (elements.length > 0) {
    // eslint-disable-next-line no-console
    console.warn('Found elements on page:')
    // eslint-disable-next-line no-console
    elements.toArray().forEach(el => console.log(el))

    throw (new Error('Spec did not clean up page elements!'))
  }
}
