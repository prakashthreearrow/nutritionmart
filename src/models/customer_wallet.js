const { Model } = require('sequelize')

module.exports = (sequelize, DataTypes) => {
  class CustomerWallet extends Model {
    static associate(models) {
      CustomerWallet.belongsTo(models.Customer, {
        sourceKey: 'id',
        foreignKey: 'Customer_id',
      })
    }
  }
  CustomerWallet.init(
    {
      customer_id: {
        type: DataTypes.INTEGER,
        references: {
          model: 'customer',
          key: 'id',
        },
      },
      transaction_type: {
        type: DataTypes.INTEGER,
        comment:
          '1:add_by_admin,2:remove_by_admin,3:purchase,4:reffer,5:order_reffer',
      },
      order_id: {
        type: DataTypes.INTEGER,
      },
      amount: DataTypes.DOUBLE,
      description: DataTypes.TEXT,
      expiry: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      timestamps: true,
      modelName: 'CustomerWallet',
      tableName: 'customer_wallet',
    }
  )
  return CustomerWallet
}
