const { Model } = require('sequelize')

module.exports = (sequelize, DataTypes) => {
  class Favorites extends Model {
    static associate(models) {
      // define association here
      Favorites.hasOne(models.Product, {
        sourceKey: 'product_id',
        foreignKey: 'id',
      })
    }
  }
  Favorites.init(
    {
      customer_id: DataTypes.INTEGER,
      product_id: DataTypes.INTEGER,
      is_favorite: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: '0:notfavorite,1:fvorite',
      },
    },
    {
      sequelize,
      modelName: 'Favorites',
      tableName: 'favorite_product',
      timestamps: true,
    }
  )
  return Favorites
}
