const { Model } = require('sequelize')

module.exports = (sequelize, DataTypes) => {
  class PaymentGateway extends Model {}
  PaymentGateway.init(
    {
      payment_group_id: {
        type: DataTypes.INTEGER,
        references: {
          model: 'payment_gateway_group',
          key: 'id',
        },
      },
      type: DataTypes.STRING(60),
      icon: DataTypes.STRING(100),
      position: DataTypes.INTEGER,
      description: DataTypes.TEXT,
      payment_group: DataTypes.STRING(40),
      payment_method: DataTypes.STRING(40),
      enable_version: DataTypes.STRING,
      status: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        comment: '0:inactive,1:active,2:delete',
      },
    },
    {
      sequelize,
      modelName: 'PaymentGateway',
      tableName: 'payment_gateway',
      timestamps: true,
    }
  )
  return PaymentGateway
}
