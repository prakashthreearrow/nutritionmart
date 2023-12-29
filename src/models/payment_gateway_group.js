const { Model } = require('sequelize')

module.exports = (sequelize, DataTypes) => {
  class PaymentGatewayGroup extends Model {
    static associate(models) {
      PaymentGatewayGroup.hasMany(models.PaymentGateway, {
        sourceKey: 'id',
        foreignKey: 'payment_group_id',
      })
    }
  }
  PaymentGatewayGroup.init(
    {
      name: DataTypes.STRING(30),
      payment_method_type: DataTypes.STRING,
      position: DataTypes.INTEGER,
      status: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        comment: '0:inactive,1:active,2:delete',
      },
    },
    {
      sequelize,
      modelName: 'PaymentGatewayGroup',
      tableName: 'payment_gateway_group',
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['id, name'],
        },
      ],
    }
  )
  return PaymentGatewayGroup
}
