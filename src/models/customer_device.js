const { Model } = require('sequelize')

module.exports = (sequelize, DataTypes) => {
  class CustomerDevice extends Model {
    static associate() {
      // define association here
    }
  }
  CustomerDevice.init(
    {
      customer_id: {
        type: DataTypes.INTEGER,
        references: {
          model: 'customer',
          key: 'id',
        },
      },
      device_type: {
        type: DataTypes.INTEGER(1),
        defaultValue: 3,
        comment: '1:Android,2:IOS,3:Web',
      },
      device_token: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'CustomerDevice',
      tableName: 'customer_device',
    }
  )
  return CustomerDevice
}
