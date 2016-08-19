'use strict'

const TrailsApp = require('trails')
const lisa = require('lisa-box')

before(() => {
  lisa.config.main.packs.push(require('../'))
  lisa.config.database.models.migrate = 'drop'
  global.app = new TrailsApp(require('lisa-box'))
  return global.app.start()
})

after(() => {
  return global.app.stop()
})
