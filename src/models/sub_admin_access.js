const { Model } = require('sequelize')

module.exports = (sequelize, DataTypes) => {
  class SubAdminAccess extends Model {
    static associate(models) {
      SubAdminAccess.belongsTo(models.AdminModule, {
        sourceKey: 'id',
        foreignKey: 'admin_module_id',
      })
    }
  }
  SubAdminAccess.init(
    {
      admin_id: {
        type: DataTypes.INTEGER,
        references: {
          model: 'admin',
          key: 'id',
        },
      },
      admin_module_id: {
        type: DataTypes.INTEGER,
        references: {
          model: 'admin_module',
          key: 'id',
        },
      },
      status: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        comment: '0:inactive,1:active,2:delete',
      },
    },
    {
      sequelize,
      modelName: 'SubAdminAccess',
      tableName: 'sub_admin_access',
    }
  )
  return SubAdminAccess
}
