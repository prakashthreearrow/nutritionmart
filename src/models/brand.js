const { Model } = require('sequelize')

module.exports = (sequelize, DataTypes) => {
  class Brand extends Model {
    static associate(models) {
      Brand.hasMany(models.Product, {
        sourceKey: 'id',
        foreignKey: 'brand_id',
      })
    }
  }
  Brand.init(
    {
      name: DataTypes.STRING(60),
      description: DataTypes.TEXT,
      slug: DataTypes.STRING(100),
      image: DataTypes.STRING(100),
      banner_image: DataTypes.STRING(100),
      app_image: DataTypes.STRING(100),
      sort_order: DataTypes.STRING,
      sequence_number: DataTypes.INTEGER,
      status: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        comment: '0:inactive,1:active,2:delete',
      },
    },
    {
      sequelize,
      modelName: 'Brand',
      tableName: 'brand',
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['id, name'],
        },
      ],
    }
  )
  return Brand
}
