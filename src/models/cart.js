const { Model } = require('sequelize')

module.exports = (sequelize, DataTypes) => {
  class Cart extends Model {
    static associate(models) {
      Cart.hasOne(models.Product, {
        sourceKey: 'product_id',
        foreignKey: 'id',
      })
    }
  }
  Cart.init(
    {
      customer_id: DataTypes.INTEGER,
      product_id: DataTypes.INTEGER,
      product_stock_id: DataTypes.INTEGER,
      product_stock_detail_id: DataTypes.INTEGER,
      quantity: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: 'Cart',
      tableName: 'cart',
      timestamps: true,
    }
  )
  return Cart
}
