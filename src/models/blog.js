const { Model } = require('sequelize')

module.exports = (sequelize, DataTypes) => {
  class Blog extends Model {
    static associate(models) {
      Blog.belongsTo(models.BlogCategory, {
        sourceKey: 'id',
        foreignKey: 'blog_category_id',
      })
      Blog.hasMany(models.BlogViewCount, {
        sourceKey: 'id',
        foreignKey: 'blog_id',
      })
    }
  }
  Blog.init(
    {
      title: DataTypes.STRING,
      description: DataTypes.TEXT,
      image: DataTypes.STRING,
      slug: DataTypes.STRING,
      author_name: DataTypes.STRING,
      reading_minute: DataTypes.INTEGER,
      blog_category_id: DataTypes.INTEGER,
      status: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        comment: '0:inactive,1:active,2:delete',
      },
    },
    {
      sequelize,
      modelName: 'Blog',
      tableName: 'blog',
    }
  )
  return Blog
}
