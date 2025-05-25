const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Temple = sequelize.define('Temple', {
  templeID: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'templeID'
  },
  imageUrl: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'image_url'
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  funfactTitle: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'funfact_title'
  },
  funfactDescription: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'funfact_description'
  },
  locationUrl: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'location_url'
  }
}, {
  tableName: 'temple',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Temple;
