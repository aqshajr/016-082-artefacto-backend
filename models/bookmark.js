const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./user');
const Artifact = require('./artifact');

const Bookmark = sequelize.define('Bookmark', {
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
  isBookmark: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'is_bookmark'
  }
}, {
  tableName: 'bookmark',
  timestamps: false
});

module.exports = Bookmark;
