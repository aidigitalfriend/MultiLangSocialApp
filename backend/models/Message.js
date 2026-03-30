const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Message = sequelize.define('Message', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  senderId: { type: DataTypes.INTEGER },
  receiverId: { type: DataTypes.INTEGER, allowNull: true },
  groupId: { type: DataTypes.INTEGER, allowNull: true },
  content: { type: DataTypes.TEXT },
  translatedContent: { type: DataTypes.TEXT },
  type: { type: DataTypes.STRING }, // text, image, video, audio, file
  mediaUrl: { type: DataTypes.STRING, allowNull: true },
  replyToId: { type: DataTypes.INTEGER, allowNull: true },
  status: { type: DataTypes.STRING, defaultValue: 'sent' }, // sent, delivered, read
  deletedForEveryone: { type: DataTypes.BOOLEAN, defaultValue: false },
  timestamp: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
});

module.exports = Message;