const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./user');
const Ticket = require('./ticket');

const Transaction = sequelize.define('Transaction', {
  transactionID: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'transactionID'
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
    field: 'ticketID',
    references: {
      model: Ticket,
      key: 'ticketID'
    }
  },
  transactionDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'transaction_date'
  },
  ticketQuantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'ticket_quantity'
  },
  status: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'Pending'
  },
  totalPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'total_price'
  },
  validDate: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'valid_date'
  }
}, {
  tableName: 'transaction',
  timestamps: false
});

// Define associations
Transaction.belongsTo(User, { foreignKey: 'userID' });
User.hasMany(Transaction, { foreignKey: 'userID' });

Transaction.belongsTo(Ticket, { foreignKey: 'ticketID' });
Ticket.hasMany(Transaction, { foreignKey: 'ticketID' });

module.exports = Transaction;
