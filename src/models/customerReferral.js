const { Model } = require('sequelize')

module.exports = (sequelize, DataTypes) => {
  class CustomerReferral extends Model {
    static associate(models) {}
  }
  CustomerReferral.init(
    {
      customer_id: {
        type: DataTypes.INTEGER,
        references: {
          model: 'customer',
          key: 'id',
        },
      },
      ref_customer_id: {
        type: DataTypes.INTEGER,
        references: {
          model: 'customer',
          key: 'id',
        },
      },
    },
    {
      sequelize,
      timestamps: true,
      modelName: 'CustomerReferral',
      tableName: 'customer_referral',
      indexes: [
        {
          unique: true,
          fields: ['customer_id', 'ref_customer_id'],
        },
      ],
    }
  )

  return CustomerReferral
}
