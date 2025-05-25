const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./user');
const Artifact = require('./artifact');

const Read = sequelize.define('Read', {
  userID: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    field: 'userID',
    references: {
      model: User,
      key: 'userID'
    }
  },
  artifactID: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    field: 'artifactID',
    references: {
      model: Artifact,
      key: 'artifactID'
    }
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'is_read'
  }
}, {
  tableName: 'read',
  timestamps: false
});

module.exports = Read;
