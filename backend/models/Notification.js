const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Notification = sequelize.define('Notification', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  type: { type: DataTypes.STRING, allowNull: false }, // friend_request, friend_accepted, message, missed_call, group_invite
  title: { type: DataTypes.STRING, allowNull: false },
  body: { type: DataTypes.STRING, defaultValue: '' },
  relatedId: { type: DataTypes.INTEGER, allowNull: true }, // related user/group/message id
  read: { type: DataTypes.BOOLEAN, defaultValue: false },
});

module.exports = Notification;
