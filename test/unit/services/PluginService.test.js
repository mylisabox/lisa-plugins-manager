'use strict'
/* global describe, it */

const assert = require('assert')
const chai = require('chai')
chai.use(require('chai-fs'))
const expect = chai.expect

describe('PluginService', () => {
  const pluginName = 'lisa-plugin'
  let service
  it('should exist', () => {
    assert(global.app.api.services['PluginService'])
    assert(service = global.app.services.PluginService)
  })

  it('should install a plugin', () => {
    return service.installPlugin(pluginName)
      .then(plugin => {
        assert(plugin.version)
        assert.equal(plugin.name, pluginName)
        assert.equal(plugin.camelName, pluginName.toCamelCase())
        assert.equal(plugin.activated, false)
        expect('./node_modules/' + pluginName).to.be.a.directory()
      })
  })

  it.skip('should activate a plugin', () => {
    return service.activatePlugin(pluginName)
      .then(pluginIds => {
        assert.equal(pluginIds.length, 1)
        assert.equal(pluginIds[0], 1)
      })
  })

  it.skip('should be load when server start', () => {
    return global.app.stop().then(_ => {
      return global.app.start().then(_ => {
        const plugin = global.app.packs.pluginsManager[pluginName]
        assert(plugin)
        assert(plugin.version)
        assert.equal(plugin.name, pluginName)
        assert.equal(plugin.camelName, pluginName.toCamelCase())
        assert.equal(plugin.activated, false)
      })
    })
  })

})
