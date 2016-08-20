'use strict'

const Trailpack = require('trailpack')

module.exports = class PluginManagerTrailpack extends Trailpack {

  /**
   * Validate configuration
   */
  validate () {

  }

  /**
   * Load all registered and activated plugin
   */
  initialize () {
    this.app.on('trails:stop', () => {
      this.app.services.PluginService.unloadPlugins()
    })
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

