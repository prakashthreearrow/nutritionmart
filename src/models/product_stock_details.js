const { Model } = require('sequelize')

module.exports = (sequelize, DataTypes) => {
  class ProductStockDetails extends Model {
    static associate(models) {
      ProductStockDetails.belongsTo(models.Product, {
        sourceKey: 'id',
        foreignKey: 'product_id',
      })
      ProductStockDetails.belongsTo(models.ProductStock, {
        sourceKey: 'id',
        foreignKey: 'product_stock_id',
      })
      ProductStockDetails.hasMany(models.ProductInventory, {
        sourceKey: 'id',
        foreignKey: 'product_stock_detail_id',
      })
    }
  }
  ProductStockDetails.init(
    {
      product_id: {
        type: DataTypes.INTEGER,
        references: {
          model: 'Product',
          key: 'id',
        },
      },
      product_stock_id: {
        type: DataTypes.INTEGER,
        references: {
          model: 'productStock',
          key: 'id',
        },
      },
      upc_code: DataTypes.STRING,
      size: DataTypes.STRING,
      sku: DataTypes.STRING,
      serving_day: DataTypes.INTEGER,
      mrp_price: DataTypes.FLOAT(10, 2),
      weight: {
        type: DataTypes.FLOAT(10, 2),
      },
      customer_price: DataTypes.FLOAT(10, 2),
      quantity: DataTypes.INTEGER,
      status: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: 'ProductStockDetails',
      tableName: 'product_stock_details',
      timestamps: true,
    }
  )
  return ProductStockDetails
}
