const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  phone: { type: DataTypes.STRING, unique: true },
  email: { type: DataTypes.STRING, unique: true, allowNull: true },
  username: { type: DataTypes.STRING, unique: true },
  password: { type: DataTypes.STRING },
  language: { type: DataTypes.STRING },
  voiceSample: { type: DataTypes.STRING },
  verified: { type: DataTypes.BOOLEAN, defaultValue: false },
  isOnline: { type: DataTypes.BOOLEAN, defaultValue: false },
  lastSeen: { type: DataTypes.DATE },
  about: { type: DataTypes.STRING, defaultValue: 'Hey there! I am using Voice 4U' },
});

module.exports = User;