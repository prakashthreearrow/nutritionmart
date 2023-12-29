const { Model } = require('sequelize')

module.exports = (sequelize, DataTypes) => {
  class ProductImage extends Model {
    static associate(models) {
      ProductImage.hasOne(models.Product, {
        sourceKey: 'product_id',
        foreignKey: 'id',
      })

      ProductImage.belongsTo(models.ProductStock, {
        sourceKey: 'id',
        foreignKey: 'product_stock_id',
      })
    }
  }
  ProductImage.init(
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
      image: DataTypes.STRING(60),
      sort_order: DataTypes.INTEGER,
      media_type: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        comment: '1:image,2:video',
      },
      status: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        comment: '0:inactive,1:active,2:delete',
      },
    },
    {
      sequelize,
      modelName: 'ProductImage',
      tableName: 'product_image',
      timestamps: true,
    }
  )
  return ProductImage
}
