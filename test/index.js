'use strict'

const TrailsApp = require('trails')
const lisa = require('lisa-box')
const smokesignals = require('smokesignals')
const _ = require('lodash')
const app = _.defaultsDeep(lisa, smokesignals.FailsafeConfig)

before(() => {
  lisa.config.main.packs[lisa.config.main.packs.findIndex(pack => pack.name === 'PluginManagerTrailpack')] = require('../')
  lisa.config.database.models.migrate = 'drop'
  global.app = new TrailsApp(app)
  return global.app.start()
})

after(() => {
  return global.app.stop()
})
