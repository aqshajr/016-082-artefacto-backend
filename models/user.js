//user.js: Untuk membuat model pengguna

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcrypt');

const User = sequelize.define('User', {
  userID: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'userID'
  },
  username: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'username'
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    field: 'email'
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'password'
  },
  profilePicture: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'profile_picture'
  },
  role: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'role'
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'created_at'
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'updated_at'
  }
}, {
  tableName: 'user',
  timestamps: false,
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

// Memvalidasi password
User.prototype.validatePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = User;
