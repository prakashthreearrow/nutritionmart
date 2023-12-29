const { Model } = require('sequelize')

module.exports = (sequelize, DataTypes) => {
  class BlogViewCount extends Model {
    static associate(models) {
      BlogViewCount.belongsTo(models.Blog, {
        sourceKey: 'address_id',
        foreignKey: 'id',
      })
    }
  }

  BlogViewCount.init(
    {
      blog_id: DataTypes.INTEGER,
      view_count: DataTypes.INTEGER,
      ip_address: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: 'BlogViewCount',
      tableName: 'blog_view_count',
    }
  )
  return BlogViewCount
}
