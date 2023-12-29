const { Model } = require('sequelize')
module.exports = (sequelize, DataTypes) => {
  class FeatureCategory extends Model {
    static associate(models) {
      FeatureCategory.hasMany(models.FeatureCategoryProduct, {
        sourceKey: 'id',
        foreignKey: 'feature_category_id',
      })
    }
  }

  FeatureCategory.init(
    {
      name: DataTypes.STRING(50),
      slug: DataTypes.STRING(70),
      start_date: DataTypes.DATE,
      end_date: DataTypes.DATE,
      image: {
        type: DataTypes.STRING(40),
        defaultValue: null,
      },
      status: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: 'FeatureCategory',
      tableName: 'feature_category',
      timestamps: true,
    }
  )
  return FeatureCategory
}
