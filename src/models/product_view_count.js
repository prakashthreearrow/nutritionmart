const { Model } = require('sequelize')

module.exports = (sequelize, DataTypes) => {
  class ProductViewCount extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      ProductViewCount.hasOne(models.Product, {
        sourceKey: 'id',
        foreignKey: 'id',
      })
    }
  }
  ProductViewCount.init(
    {
      product_id: {
        type: DataTypes.INTEGER,
        references: {
          model: 'Product',
          key: 'id',
        },
      },
      view_count: DataTypes.INTEGER,
      ip_address: DataTypes.STRING(50),
      status: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: 'ProductViewCount',
      tableName: 'product_view_count',
      timestamps: true,
    }
  )
  return ProductViewCount
}
