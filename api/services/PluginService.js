'use strict'

const Service = require('trails/service')
const download = require('download')
const fs = require('fs-extra')
const npm = require('enpeem')
const _ = require('lodash')

const ERROR_PLUGIN = 'E_PLUGIN_NOT_FOUND'
const ERROR_PLUGIN_DRIVER = 'E_PLUGIN_DRIVER_NOT_FOUND'

/**
 * @module PluginService
 * @description Service to manage L.I.S.A. plugins
 */
module.exports = class PluginService extends Service {
  _getPluginInstance(pluginName) {
    let plugin
    if (pluginName) {
      plugin = this.pluginsManager.plugins[this._getPluginName(pluginName)]
    }
    return plugin
  }

  _getPluginName(pluginName) {
    return pluginName.replace(/lisa\-/, '').replace(/plugin\-/, '').toCamelCase()
  }

  _getPluginPath(pluginName) {
    return `${this.app.config.pluginManager.dist}/${pluginName}`
  }

  _managePluginBots(pluginName, bots) {
    if (!bots) {
      bots = {}
    }
    const botIds = Object.keys(bots)
    return botIds.length === 0 ? Promise.resolve() : this.app.orm.ChatBot.findAll({
      where: {
        pluginName: pluginName
      }
    }).then(chatBots => {
      const promises = []
      botIds.forEach(botId => {
        const bot = chatBots.find(item => botId === item.name)
        bots[botId].pluginName = pluginName
        if (bot) {
          promises.push(this.app.services.ChatBotService.updateBot(botId, bots[botId]))
        }
        else {
          promises.push(this.app.services.ChatBotService.addBot(botId, bots[botId]))
        }
      })
      return Promise.all(promises)
    }).catch(err => this.log.error(err))
  }

  /**
   *
   * @param pluginRealName
   * @private
   */
  _loadPlugin(pluginRealName) {
    const PluginClass = require(this._getPluginPath(pluginRealName))
    const pluginInstance = new PluginClass(this.app.lisa)
    this.pluginsManager.plugins[pluginInstance.name] = pluginInstance
    return this._managePluginBots(pluginRealName, pluginInstance.bots).then(() => Promise.resolve(pluginInstance))
  }

  callOnPlugins(toCall, args = []) {
    const promises = []

    _.each(this.pluginsManager.plugins, (value, key) => {
      promises.push(this.pluginsManager.plugins[key][toCall](...args))
    })

    return Promise.all(promises)
  }

  callOnPlugin(toCall, pluginName, args = []) {
    const plugin = this._getPluginInstance(pluginName)
    return plugin[toCall](...args)
  }

  callOnPluginDriver(toCall, pluginName, driver, args = []) {
    const plugin = this._getPluginInstance(pluginName)

    if (!plugin) {
      return Promise.reject(new Error(ERROR_PLUGIN))
    }

    if (!plugin.drivers && !plugin.drivers[driver]) {
      return Promise.reject(new Error(ERROR_PLUGIN_DRIVER))
    }

    return plugin.drivers[driver][toCall](...args)
  }

  setDeviceValue(pluginName, args) {
    const plugin = this._getPluginInstance(pluginName)
    const driver = args[0].driver

    if (!plugin) {
      return Promise.reject(new Error(ERROR_PLUGIN))
    }

    if (!plugin.drivers && !plugin.drivers[driver]) {
      return Promise.reject(new Error(ERROR_PLUGIN_DRIVER))
    }

    return plugin.drivers[driver].setDeviceValue(...args)
  }

  setDevicesValue(pluginName, args) {
    const plugin = this._getPluginInstance(pluginName)
    const devices = args[0]
    const driver = devices.length > 0 ? devices[0].driver : null

    if (!plugin) {
      return Promise.reject(new Error(ERROR_PLUGIN))
    }

    if (!plugin.drivers && !plugin.drivers[driver]) {
      return Promise.reject(new Error(ERROR_PLUGIN_DRIVER))
    }

    return plugin.drivers[driver].setDevicesValue(...args)
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
      const promises = []
      plugins.forEach(plugin => {
        this._loadPlugin(plugin.name)
        promises.push(this.pluginsManager.plugins[plugin.internalName].init())
      })
      return Promise.all(promises)
    })
  }

  /**
   *
   */
  unloadPlugins() {
    //this.pluginsManager
  }

  enablePlugin(pluginName) {
    this._loadPlugin(pluginName)
    pluginName = this._getPluginName(pluginName)

    return this.pluginsManager.plugins[pluginName].init().then(_ => {
      return this.app.orm.Plugin.update({
        activated: true
      }, {
        where: {
          internalName: pluginName
        }
      })
    })
  }

  disablePlugin(name) {
    name = this._getPluginName(name)
    return this.pluginsManager.plugins[name].unload().then(_ => {
      delete this.pluginsManager.plugins[name]
      return this.app.orm.Plugin.update({
        activated: false
      }, {
        where: {
          internalName: name
        }
      })
    })
  }

  /**
   *
   */
  installPlugin(name, version, from = 'npm') {
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

  _updatePlugin(pluginName) {
    const plugin = require(`${this._getPluginPath(pluginName)}/package.json`)
    const pluginConfig = require(`${this._getPluginPath(pluginName)}/config`)
    return this.app.orm.Plugin.update({
      version: plugin.version,
      settings: pluginConfig.settings,
      devicesSettings: pluginConfig.devices,
      infos: pluginConfig.infos
    }, { where: { name: plugin.name } }).then(plugin => {
      return this._loadPlugin(pluginName).then(() => plugin)
    })
  }

  _addPlugin(pluginName) {
    const plugin = require(`${this._getPluginPath(pluginName)}/package.json`)
    const pluginConfig = require(`${this._getPluginPath(pluginName)}/config`)
    const name = this._getPluginName(plugin.name)
    return this.app.orm.Plugin.create({
      name: plugin.name,
      internalName: name,
      camelName: name.toCamelCase(),
      version: plugin.version,
      settings: pluginConfig.settings,
      devicesSettings: pluginConfig.devices,
      infos: pluginConfig.infos
    }).then(plugin => {
      return this._loadPlugin(pluginName).then(() => plugin)
    })
  }

  /**
   *
   */
  uninstallPlugin(name) {
    return this.disablePlugin(name).then(() => {
      return this.app.orm.Plugin.destroy({
        where: {
          name: name,
        }
      }).then(results => {
        return new Promise((resolve, reject) => {
          const path = this._getPluginPath(name)
          fs.access(path, (fs.constants || fs).R_OK | (fs.constants || fs).W_OK, err => {
            if (!err) {
              fs.removeSync(path)
            }
            resolve(results)
          })
        })
      })
    })
  }
}

