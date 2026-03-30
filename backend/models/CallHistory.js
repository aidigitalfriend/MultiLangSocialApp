const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CallHistory = sequelize.define('CallHistory', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  callerId: { type: DataTypes.INTEGER, allowNull: false },
  receiverId: { type: DataTypes.INTEGER, allowNull: false },
  callType: { type: DataTypes.STRING, defaultValue: 'voice' }, // voice, video
  status: { type: DataTypes.STRING, defaultValue: 'missed' }, // missed, answered, rejected
  duration: { type: DataTypes.INTEGER, defaultValue: 0 }, // seconds
});

module.exports = CallHistory;
