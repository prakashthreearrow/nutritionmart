const { Model } = require('sequelize')

module.exports = (sequelize, DataTypes) => {
  class BlogCategory extends Model {
    static associate(models) {
      BlogCategory.hasMany(models.Blog, {
        sourceKey: 'id',
        foreignKey: 'blog_category_id',
      })
    }
  }
  BlogCategory.init(
    {
      title: DataTypes.STRING(60),
      slug: DataTypes.STRING(100),
      status: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        comment: '0:inactive,1:active,2:delete',
      },
    },
    {
      sequelize,
      modelName: 'BlogCategory',
      tableName: 'blog_category',
      timestamps: true,
    }
  )
  return BlogCategory
}
