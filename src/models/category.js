const { Model } = require('sequelize')

module.exports = (sequelize, DataTypes) => {
  class Category extends Model {
    static associate(models) {
      Category.hasMany(models.Category, {
        sourceKey: 'id',
        foreignKey: 'parent_id',
      })
      Category.hasOne(models.Blog, {
        sourceKey: 'id',
        foreignKey: 'id',
      })
      Category.hasMany(models.Product, {
        sourceKey: 'id',
        foreignKey: 'category_id',
      })
      Category.hasMany(models.Product, {
        as: 'subCategoryProducts',
        sourceKey: 'id',
        foreignKey: 'sub_category_id',
      })
    }
  }
  Category.init(
    {
      name: DataTypes.STRING(50),
      parent_id: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      slug: DataTypes.STRING(100),
      description: DataTypes.TEXT,
      image: DataTypes.STRING(40),
      sequence_number: DataTypes.INTEGER,
      icon_image: DataTypes.STRING(40),
      app_image: DataTypes.STRING(40),
      web_image: DataTypes.STRING(40),
      status: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        comment: '0:inactive,1:active,2:delete',
      },
    },
    {
      sequelize,
      modelName: 'Category',
      tableName: 'category',
      timestamps: true,
    }
  )
  return Category
}
