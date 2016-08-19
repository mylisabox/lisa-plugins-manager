'use strict'

const Trailpack = require('trailpack')

module.exports = class ManagerTrailpack extends Trailpack {

  /**
   * Validate configuration
   */
  validate () {

  }

  /**
   * Load L.I.S.A. plugins
   */
  configure () {

  }

  /**
   * TODO document method
   */
  initialize () {
    return this.app.services.PluginService.loadPlugins()
  }

  constructor (app) {
    super(app, {
      config: require('./config'),
      api: require('./api'),
      pkg: require('./package')
    })
  }
}

