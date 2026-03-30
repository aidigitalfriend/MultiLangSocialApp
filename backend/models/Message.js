const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Message = sequelize.define('Message', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  senderId: { type: DataTypes.INTEGER },
  receiverId: { type: DataTypes.INTEGER },
  content: { type: DataTypes.TEXT },
  translatedContent: { type: DataTypes.TEXT },
  type: { type: DataTypes.STRING },
  timestamp: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
});

module.exports = Message;