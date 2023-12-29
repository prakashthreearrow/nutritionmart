const { Model } = require('sequelize')

module.exports = (sequelize, DataTypes) => {
  class SubCategory extends Model {
    static associate(models) {
      SubCategory.belongsTo(models.Category, {
        foreignKey: 'category_id',
        targetKey: 'id',
      })
    }
  }
  SubCategory.init(
    {
      category_id: {
        type: DataTypes.INTEGER,
        references: {
          model: 'category',
          key: 'id',
        },
      },
      name: DataTypes.STRING(50),
      status: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        comment: '0:inactive,1:active,2:delete',
      },
    },
    {
      sequelize,
      modelName: 'SubCategory',
      tableName: 'sub_category',
      timestamps: true,
    }
  )
  return SubCategory
}
