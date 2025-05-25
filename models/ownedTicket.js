const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./user');
const Ticket = require('./ticket');

const OwnedTicket = sequelize.define('OwnedTicket', {
  ownedTicketID: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'ownedTicketID'
  },
  userID: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'userID',
    references: {
      model: User,
      key: 'userID'
    }
  },
  ticketID: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'ticket_id',
    references: {
      model: Ticket,
      key: 'ticketID'
    }
  },
  uniqueCode: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    field: 'unique_code'
  },
  usageStatus: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: 'Belum Digunakan',
    field: 'usage_status'
  }
}, {
  tableName: 'ownedticket',
  timestamps: false
});

// Define associations
OwnedTicket.belongsTo(User, { foreignKey: 'userID' });
OwnedTicket.belongsTo(Ticket, { foreignKey: 'ticket_id' });

module.exports = OwnedTicket;
