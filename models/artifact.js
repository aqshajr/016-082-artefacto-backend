const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Temple = require('./temple');

const Artifact = sequelize.define('Artifact', {
  artifactID: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'artifactID'
  },
  templeID: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'templeID',
    references: {
      model: Temple,
      key: 'templeID'
    }
  },
  imageUrl: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'image_url',
    get() {
      const value = this.getDataValue('imageUrl');
      if (!value) {
        return `https://storage.googleapis.com/${process.env.GOOGLE_CLOUD_STORAGE_BUCKET}/assets/image-placeholder.jpg`;
      }
      return value;
    }
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  detailPeriod: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'detail_period'
  },
  detailMaterial: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'detail_material'
  },
  detailSize: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'detail_size'
  },
  detailStyle: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'detail_style'
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
  tableName: 'artifact',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Artifact;
