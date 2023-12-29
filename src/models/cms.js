const { Model } = require('sequelize')

module.exports = (sequelize, DataTypes) => {
  class cms extends Model {}

  cms.init(
    {
      title: DataTypes.STRING,
      description: DataTypes.TEXT,
      seo_url: DataTypes.STRING,
      status: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        comment: '0:inactive,1:active,2:delete',
      },
    },
    {
      sequelize,
      modelName: 'Cms',
      tableName: 'cms',
      timestamps: true,
    }
  )
  return cms
}
