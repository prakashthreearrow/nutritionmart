const { Model } = require('sequelize')

module.exports = (sequelize, DataTypes) => {
  class ProductStock extends Model {
    static associate(models) {
      ProductStock.belongsTo(models.Product, {
        sourceKey: 'id',
        foreignKey: 'product_id',
      })

      ProductStock.hasMany(models.ProductImage, {
        sourceKey: 'id',
        foreignKey: 'product_stock_id',
      })

      ProductStock.hasMany(models.ProductStockDetails, {
        sourceKey: 'id',
        foreignKey: 'product_stock_id',
      })

      ProductStock.hasOne(models.ProductFlavors, {
        sourceKey: 'flavor_id',
        foreignKey: 'id',
      })
    }
  }
  ProductStock.init(
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
      is_default: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: '0:no,1:yes',
      },
      status: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        comment: '0:inactive,1:active,2:delete',
      },
    },
    {
      sequelize,
      modelName: 'ProductStock',
      tableName: 'product_stock',
      timestamps: true,
    }
  )
  return ProductStock
}
