const { Model } = require('sequelize')

module.exports = (sequelize, DataTypes) => {
  class CustomerAddress extends Model {
    static associate(models) {}
  }
  CustomerAddress.init(
    {
      customer_id: {
        type: DataTypes.INTEGER,
        references: {
          model: 'customer',
          key: 'id',
        },
      },
      receiver_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      address_1: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      address_2: {
        type: DataTypes.STRING(255),
        defaultValue: null,
      },
      city: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },
      mobile_no: {
        type: DataTypes.STRING(10),
        allowNull: true,
      },
      pincode: {
        type: DataTypes.INTEGER(10),
        allowNull: false,
      },
      state: DataTypes.STRING,
      status: {
        type: DataTypes.INTEGER(1),
        defaultValue: 1,
        comment: '0:inactive,1:active,2:delete',
      },
    },
    {
      sequelize,
      modelName: 'CustomerAddress',
      tableName: 'customer_address',
    }
  )
  return CustomerAddress
}
