'use strict'

const Model = require('trails/model')
const _ = require('lodash')

/**
 * @module Plugin
 * @description Plugin model
 */
module.exports = class Plugin extends Model {

  static config(app, Sequelize) {
  }

  static schema(app, Sequelize) {
    return {
      internalName: {
        type: Sequelize.STRING,
        allowNull: false
      },
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
      },
      settings: {
        type: Sequelize.TEXT,
        get: function () {
          let data = this.getDataValue('settings')
          if (_.isString(data)) {
            data = JSON.parse(this.getDataValue('settings'))
          }
          return data
        },
        set: function (value) {
          if (value) {
            this.setDataValue('settings', JSON.stringify(value))
          }
          else {
            this.setDataValue('settings', null)
          }
        }
      },
      devicesSettings: {
        type: Sequelize.TEXT,
        get: function () {
          let data = this.getDataValue('devicesSettings')
          if (_.isString(data)) {
            data = JSON.parse(this.getDataValue('devicesSettings'))
          }
          return data
        },
        set: function (value) {
          if (value) {
            this.setDataValue('devicesSettings', JSON.stringify(value))
          }
          else {
            this.setDataValue('devicesSettings', null)
          }
        }
      },
      infos: {
        type: Sequelize.TEXT,
        allowNull: false,
        get: function () {
          let data = this.getDataValue('infos')
          if (_.isString(data)) {
            data = JSON.parse(this.getDataValue('infos'))
          }
          return data
        },
        set: function (value) {
          if (value) {
            this.setDataValue('infos', JSON.stringify(value))
          }
          else {
            this.setDataValue('infos', null)
          }
        }
      }
    }
  }
}
