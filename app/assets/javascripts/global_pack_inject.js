/**
 * This file is injected into every pack generated by webpack to reinstate our jQuery
 * augmentation. This wasn't necessary in webpack 3, but for whatever reason is in webpack 4.
 */
import './jquery.js'
