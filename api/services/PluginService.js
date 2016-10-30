'use strict'

const Service = require('trails-service')
const download = require('download')
const fs = require('fs-extra')
const npm = require('enpeem')

/**
 * @module PluginService
 * @description Service to manage L.I.S.A. plugins
 */
module.exports = class PluginService extends Service {

  _getPluginPath(pluginName) {
    return `${this.app.config.pluginManager.dist}/${pluginName}`
  }

  /**
   *
   * @param pluginName
   * @private
   */
  _loadPlugin(pluginName) {
    const PluginClass = require(this._getPluginPath(pluginName))
    const pluginInstance = new PluginClass(this.app.lisa)
    this.pluginsManager[pluginInstance.name] = pluginInstance
  }

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
        this._loadPlugin(plugin.name)
      })
    })
  }

  /**
   *
   */
  unloadPlugins() {
    //this.pluginsManager
  }

  activatePlugin(pluginName) {
    pluginName = pluginName.toCamelCase()
    this._loadPlugin(pluginName)

    return this.pluginsManager[pluginName].init().then(_ => {
      return this.app.orm.Plugin.update({
        activated: true
      }, {
        where: {
          name: pluginName
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
  installPlugin(name, version, from) {
    if (!from) {
      from = 'npm'
    }

    let url

    switch (from) {
      default:
        url = `https://registry.npmjs.org/${name}/-/${name}-${version}.tgz`
    }

    return download(url, this.app.config.pluginManager.dist, {
      extract: true
    }).then(() => {
      return new Promise((resolve, reject) => {
        const from = this._getPluginPath('package')
        const path = this._getPluginPath(name)
        npm.install({
          dir: from,
          loglevel: 'silent',
          production: true
        }, err => {
          if (err) return reject(err)

          fs.access(path, (fs.constants || fs).R_OK | (fs.constants || fs).W_OK, err => {
            if (!err) {
              fs.removeSync(path)
            }
            fs.rename(from, path, err => {
              if (err) return reject(err)
              resolve()
            })
          })
        })
      }).then(() => this._addPlugin(name))
    })
  }

  _addPlugin(pluginName) {
    const plugin = require(`${this._getPluginPath(pluginName)}/package.json`)
    return this.app.orm.Plugin.create({
      name: pluginName,
      camelName: pluginName.toCamelCase(),
      version: plugin.version
    }).then(() => this._loadPlugin(pluginName))
  }

  /**
   *
   */
  uninstallPlugin(name) {

  }

}

