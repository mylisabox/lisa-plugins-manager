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
        const from = `${this.app.config.pluginManager.dist}/package`
        const path = `${this.app.config.pluginManager.dist}/${name}`
        npm.install({
          dir: from,
          loglevel: 'silent',
          production: true
        }, err => {
          if (err) return reject(err)

          fs.access(path, fs.constants.R_OK | fs.constants.W_OK, err => {
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
    const plugin = require(`${this.app.config.pluginManager.dist}/${pluginName}/package.json`)
    return this.app.orm.Plugin.create({
      name: pluginName,
      camelName: pluginName.toCamelCase(),
      version: plugin.version
    })
  }

  /**
   *
   */
  uninstallPlugin(name) {

  }

}

