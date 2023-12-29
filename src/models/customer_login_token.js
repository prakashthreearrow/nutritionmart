const { Model } = require('sequelize')

module.exports = (sequelize, DataTypes) => {
  class CustomerLoginToken extends Model {
    static associate() {
      // define association here
    }
  }
  CustomerLoginToken.init(
    {
      customer_id: {
        type: DataTypes.INTEGER,
        references: {
          model: 'customer',
          key: 'id',
        },
      },
      token: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      device_type: {
        type: DataTypes.INTEGER(1),
        defaultValue: 3,
        comment: '1:Android,2:IOS,3:Web',
      },
    },
    {
      sequelize,
      modelName: 'CustomerLoginToken',
      tableName: 'customer_login_token',
    }
  )
  return CustomerLoginToken
}
