const { Model } = require('sequelize')
module.exports = (sequelize, DataTypes) => {
  class FeatureCategoryProduct extends Model {
    static associate(models) {
      FeatureCategoryProduct.hasOne(models.FeatureCategory, {
        sourceKey: 'feature_category_id',
        foreignKey: 'id',
      })
      FeatureCategoryProduct.hasOne(models.Product, {
        sourceKey: 'product_id',
        foreignKey: 'id',
      })
    }
  }
  FeatureCategoryProduct.init(
    {
      feature_category_id: {
        type: DataTypes.INTEGER,
        references: {
          model: 'feature_category',
          key: 'id',
        },
      },
      product_id: {
        type: DataTypes.INTEGER,
        references: {
          model: 'product',
          key: 'id',
        },
      },
      sort_order: {
        type: DataTypes.INTEGER,
      },
      status: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: 'FeatureCategoryProduct',
      tableName: 'feature_category_product',
      timestamps: true,
    }
  )
  return FeatureCategoryProduct
}
