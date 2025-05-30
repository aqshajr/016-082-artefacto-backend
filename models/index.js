const User = require('./user');
const Temple = require('./temple');
const Artifact = require('./artifact');
const Ticket = require('./ticket');
const Transaction = require('./transaction');
const OwnedTicket = require('./ownedTicket');
const Bookmark = require('./bookmark');
const Read = require('./read');

// Temple associations
Temple.hasMany(Artifact, { foreignKey: 'templeID' });
Artifact.belongsTo(Temple, { foreignKey: 'templeID' });

Temple.hasMany(Ticket, { foreignKey: 'templeID' });
Ticket.belongsTo(Temple, { foreignKey: 'templeID' });

// Artifact associations
Artifact.hasMany(Bookmark, { foreignKey: 'artifactID' });
Bookmark.belongsTo(Artifact, { foreignKey: 'artifactID' });

Artifact.hasMany(Read, { foreignKey: 'artifactID' });
Read.belongsTo(Artifact, { foreignKey: 'artifactID' });

// User associations
User.hasMany(Bookmark, { foreignKey: 'userID' });
Bookmark.belongsTo(User, { foreignKey: 'userID' });

User.hasMany(Read, { foreignKey: 'userID' });
Read.belongsTo(User, { foreignKey: 'userID' });

User.hasMany(Transaction, { foreignKey: 'userID' });
Transaction.belongsTo(User, { foreignKey: 'userID' });

User.hasMany(OwnedTicket, { foreignKey: 'userID' });
OwnedTicket.belongsTo(User, { foreignKey: 'userID' });

// Ticket associations
Ticket.hasMany(Transaction, { foreignKey: 'ticketID' });
Transaction.belongsTo(Ticket, { foreignKey: 'ticketID' });

Ticket.hasMany(OwnedTicket, { foreignKey: 'ticketID' });
OwnedTicket.belongsTo(Ticket, { foreignKey: 'ticketID' });

// Transaction associations
Transaction.hasMany(OwnedTicket, { foreignKey: 'transactionID' });
OwnedTicket.belongsTo(Transaction, { foreignKey: 'transactionID' });

module.exports = {
  User,
  Temple,
  Artifact,
  Ticket,
  Transaction,
  OwnedTicket,
  Bookmark,
  Read
}; 