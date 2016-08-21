'use strict'

const Model = require('trails-model')

/**
 * @module Plugin
 * @description Plugin model
 */
module.exports = class Plugin extends Model {

  static config(app, Sequelize) {
  }

  static schema(app, Sequelize) {
    return {
      // First Name
      name: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false
      },
      camelName: {
        type: Sequelize.STRING,
        uniq: true,
        allowNull: false
      },
      version: {
        type: Sequelize.STRING,
        allowNull: false
      },
      activated: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      }
    }
  }
}
