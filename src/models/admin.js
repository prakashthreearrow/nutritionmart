const { Model } = require('sequelize')

module.exports = (sequelize, DataTypes) => {
  class Admin extends Model {
    static associate(models) {
      Admin.hasMany(models.AdminLoginToken)
      Admin.belongsToMany(models.AdminModule, {
        through: 'SubAdminAccess',
        foreignKey: 'admin_id',
      })
      models.AdminModule.belongsToMany(models.Admin, {
        through: 'SubAdminAccess',
        foreignKey: 'admin_module_id',
      })
    }
  }

  Admin.init(
    {
      type: {
        type: DataTypes.INTEGER,
        defaultValue: 2,
        comment: '1:super-admin,2:sub-admin',
      },
      name: DataTypes.STRING(30),
      mobile: DataTypes.STRING(10),
      email: {
        type: DataTypes.STRING(30),
        unique: true,
      },
      address: DataTypes.TEXT,
      password: DataTypes.STRING(100),
      reset_token: DataTypes.TEXT,
      code_expiry: DataTypes.DATE,
      status: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        comment: '0:inactive,1:active,2:delete',
      },
    },
    {
      sequelize,
      timestamps: true,
      modelName: 'Admin',
      tableName: 'admin',
      indexes: [
        {
          unique: false,
          fields: ['id', 'name'],
        },
        {
          unique: true,
          fields: ['email'],
        },
      ],
    }
  )

  return Admin
}
