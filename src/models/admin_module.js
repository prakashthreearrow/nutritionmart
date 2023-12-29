const { Model } = require('sequelize')

module.exports = (sequelize, DataTypes) => {
  class AdminModule extends Model {
    static associate(models) {
      AdminModule.hasOne(models.SubAdminAccess, {
        sourceKey: 'id',
        foreignKey: 'admin_module_id',
      })
    }
  }

  AdminModule.init(
    {
      name: DataTypes.STRING(100),
      slug: DataTypes.STRING(100),
      status: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        comment: '0:inactive,1:active,2:delete',
      },
    },
    {
      sequelize,
      timestamps: true,
      modelName: 'AdminModule',
      tableName: 'admin_module',
      indexes: [
        {
          unique: true,
          fields: ['slug'],
        },
      ],
    }
  )

  return AdminModule
}
