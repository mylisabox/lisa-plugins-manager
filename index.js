'use strict'

const Trailpack = require('trailpack')

module.exports = class PluginManagerTrailpack extends Trailpack {

  /**
   * Validate configuration
   */
  validate() {
    this.plugins = {}
  }

  configure() {
    this.app.services.PluginService.pluginsManager = this
  }

  /**
   * Load all registered and activated plugin
   */
  initialize() {
    this.app.on('trails:stop', () => {
      return this.app.services.PluginService.unloadPlugins()
    })
    this.app.on('trails:ready', () => {
      return this.app.services.PluginService.loadPlugins()
        .then(results => {
          this.emit('plugins:loaded')
        })
        .catch(err => {
          this.log.error(err)
          //return this.app.stop()
        })
    })
    return Promise.resolve()
  }

  get name() {
    return this.pkg.name.replace(/lisa\-/, '').toCamelCase()
  }

  constructor(app) {
    super(app, {
      config: require('./config'),
      api: require('./api'),
      pkg: require('./package')
    })
  }
}

