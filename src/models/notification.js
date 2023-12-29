const { Model } = require('sequelize')

module.exports = (sequelize, DataTypes) => {
  class Notification extends Model {
    static associate() {}
  }
  Notification.init(
    {
      specific_type: {
        type: DataTypes.INTEGER,
      },
      customer_type: {
        type: DataTypes.INTEGER,
      },
      push_notification_content: {
        type: DataTypes.STRING,
      },
      push_notification_title: DataTypes.STRING,
      status: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        comment: '0:inactive,1:active,2:delete',
      },
    },
    {
      sequelize,
      modelName: 'Notification',
      tableName: 'notification',
      timestamps: true,
    }
  )
  return Notification
}
