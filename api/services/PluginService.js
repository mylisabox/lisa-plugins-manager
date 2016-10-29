'use strict'

const Service = require('trails-service')
const npmi = require('npmi')

/**
 * @module PluginService
 * @description Service to manage L.I.S.A. plugins
 */
module.exports = class PluginService extends Service {

  /**
   *
   */
  loadPlugins() {
    return this.app.orm.Plugin.findAll({
      where: {
        activated: true
      }
    }).then(plugins => {
      plugins.forEach(plugin => {
        const PluginClass = require(plugin.name)
        const pluginInstance = new PluginClass(this.app.lisa)
        this.pluginsManager[pluginInstance.name] = pluginInstance
      })
    })
  }

  /**
   *
   */
  unloadPlugins() {
    //this.pluginsManager
  }

  activatePlugin(name) {
    name = name.toCamelCase()
    const PluginClass = require(name)
    const plugin = new PluginClass(this.app.lisa)

    this.pluginsManager[plugin.name] = plugin

    return plugin.init().then(_ => {
      return this.app.orm.Plugin.update({
        activated: true
      }, {
        where: {
          name: name
        }
      })
    })
  }

  deactivatePlugin(name) {
    name = name.toCamelCase()
    return this.pluginsManager[name].unload().then(_ => {
      delete this.pluginsManager[name]
      return this.app.orm.Plugin.update({
        activated: false
      }, {
        where: {
          name: name
        }
      })
    })
  }

  /**
   *
   */
  installPlugin(name) {
    return new Promise((resolve, reject) => {
      npmi({
        name: name
      }, (err, result) => {
        if (err) {
          if (err.code === npmi.LOAD_ERR) this.log.error('npm load error')
          else if (err.code === npmi.INSTALL_ERR) this.log.error('npm install error')
          this.log.error(err.message)
          return reject(err)
        }

        // installed
        this._addPlugin(name)
      })
    })
  }

  _addPlugin(pluginName) {
    const plugin = require(pluginName + '/package.json')
    this.app.orm.Plugin.create({
      name: name,
      camelName: name.toCamelCase(),
      version: plugin.version
    }).then(resolve).catch(reject)
  }

  /**
   *
   */
  uninstallPlugin(name) {

  }

}

