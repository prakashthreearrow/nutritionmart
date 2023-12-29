const { Model } = require('sequelize')

module.exports = (sequelize, DataTypes) => {
  class ProductFlavors extends Model {
    static associate(models) {
      ProductFlavors.hasOne(models.ProductStock, {
        sourceKey: 'id',
        foreignKey: 'flavor_id',
      })
    }
  }
  ProductFlavors.init(
    {
      flavor_name: DataTypes.STRING(100),
      status: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        comment: '0:inactive,1:active,2:delete',
      },
    },
    {
      sequelize,
      modelName: 'ProductFlavors',
      tableName: 'product_flavor',
      timestamps: true,
    }
  )
  return ProductFlavors
}
