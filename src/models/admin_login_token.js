const { Model } = require('sequelize')

module.exports = (sequelize, DataTypes) => {
  class AdminLoginToken extends Model {
    static associate() {
      // define association here
    }
  }
  AdminLoginToken.init(
    {
      admin_id: {
        type: DataTypes.INTEGER,
        references: {
          model: 'admin',
          key: 'id',
        },
      },
      token: {
        type: DataTypes.TEXT,
        required: true,
      },
      expire: DataTypes.INTEGER,
    },
    {
      sequelize,
      timestamps: true,
      modelName: 'AdminLoginToken',
      tableName: 'admin_login_token',
    }
  )

  return AdminLoginToken
}
