const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Temple = require('./temple');

const Ticket = sequelize.define('Ticket', {
  ticketID: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'ticketID'
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
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  }
}, {
  tableName: 'ticket',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Mendefinisikan relasi antara ticket dan temple
Ticket.belongsTo(Temple, { foreignKey: 'templeID' });
Temple.hasMany(Ticket, { foreignKey: 'templeID' });

module.exports = Ticket;
