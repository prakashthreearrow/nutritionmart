const { Model } = require('sequelize')

module.exports = (sequelize, DataTypes) => {
  class CustomerNotification extends Model {
    static associate() {}
  }
  CustomerNotification.init(
    {
      notification_id: {
        type: DataTypes.INTEGER,
      },
      notify_type: {
        type: DataTypes.INTEGER,
      },
      customer_id: {
        type: DataTypes.INTEGER,
      },
      title: {
        type: DataTypes.STRING,
      },
      message: {
        type: DataTypes.STRING,
      },
      is_read: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      status: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
      },
    },
    {
      sequelize,
      modelName: 'CustomerNotification',
      tableName: 'customer_notification',
      timestamps: true,
    }
  )
  return CustomerNotification
}
