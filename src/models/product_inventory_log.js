const { Model } = require('sequelize')

module.exports = (sequelize, DataTypes) => {
  class ProductInventoryLog extends Model {
    static associate(models) {
      ProductInventoryLog.belongsTo(models.Product, {
        sourceKey: 'id',
        foreignKey: 'product_id',
      })

      ProductInventoryLog.belongsTo(models.ProductFlavors, {
        sourceKey: 'id',
        foreignKey: 'flavor_id',
      })

      ProductInventoryLog.belongsTo(models.ProductStockDetails, {
        sourceKey: 'id',
        foreignKey: 'product_stock_detail_id',
      })
    }
  }
  ProductInventoryLog.init(
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
      quantity: {
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
      party_name: {
        type: DataTypes.STRING(100),
        defaultValue: null,
      },
      log_type: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        comment: '1:inward,2:outword',
      },
      sale_offline: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: '0:no,1:yes',
      },
    },
    {
      sequelize,
      modelName: 'ProductInventoryLog',
      tableName: 'product_inventory_log',
      timestamps: true,
    }
  )
  return ProductInventoryLog
}
