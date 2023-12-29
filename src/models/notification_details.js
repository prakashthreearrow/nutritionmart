const { Model } = require('sequelize')

module.exports = (sequelize, DataTypes) => {
  class NotificationDetails extends Model {
    static associate() {}
  }
  NotificationDetails.init(
    {
      notification_id: {
        allowNull: false,
        type: DataTypes.INTEGER,
      },
      upload_file: {
        allowNull: false,
        type: DataTypes.STRING,
      },
    },

    {
      sequelize,
      modelName: 'NotificationDetails',
      tableName: 'notification_detail',
      timestamps: true,
    }
  )
  return NotificationDetails
}
