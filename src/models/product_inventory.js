const { Model } = require('sequelize')

module.exports = (sequelize, DataTypes) => {
  class ProductInventory extends Model {
    static associate(models) {
      ProductInventory.belongsTo(models.Product, {
        sourceKey: 'id',
        foreignKey: 'product_id',
      })

      ProductInventory.belongsTo(models.ProductFlavors, {
        sourceKey: 'id',
        foreignKey: 'flavor_id',
      })

      ProductInventory.belongsTo(models.ProductStockDetails, {
        sourceKey: 'id',
        foreignKey: 'product_stock_detail_id',
      })
    }
  }
  ProductInventory.init(
    {
      product_id: {
        type: DataTypes.INTEGER,
        references: {
          model: 'Product',
          key: 'id',
        },
      },
      flavor_id: {
        type: DataTypes.INTEGER,
        references: {
          model: 'ProductFlavors',
          key: 'id',
        },
      },
      product_stock_detail_id: {
        type: DataTypes.INTEGER,
        references: {
          model: 'ProductStockDetails',
          key: 'id',
        },
      },
      total_quantity: {
        type: DataTypes.INTEGER,
      },
      batch_no: {
        type: DataTypes.STRING(80),
        defaultValue: null,
      },
      expiry_date: {
        type: DataTypes.DATE,
        defaultValue: null,
        comment: 'YYYY-MM-DD',
      },
      status: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        comment: '0:inactive,1:active,2:delete',
      },
    },
    {
      sequelize,
      modelName: 'ProductInventory',
      tableName: 'product_inventory',
      timestamps: true,
    }
  )
  return ProductInventory
}
