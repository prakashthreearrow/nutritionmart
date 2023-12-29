const { Model } = require('sequelize')

module.exports = (sequelize, DataTypes) => {
  class CustomerAccount extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate() {
      // define association here
    }
  }
  CustomerAccount.init(
    {
      customer_id: {
        type: DataTypes.INTEGER,
        references: {
          model: 'customer',
          key: 'id',
        },
      },
      account_type: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        comment: '1-Email, 2-Facebook, 3-Google, 4-Apple',
      },
      account_id: {
        allowNull: true,
        type: DataTypes.STRING(150),
      },
      status: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        comment: '0:inactive,1:active,2:delete',
      },
    },
    {
      sequelize,
      timestamps: true,
      modelName: 'CustomerAccount',
      tableName: 'customer_account',
      indexes: [
        {
          unique: true,
          fields: ['account_id'],
        },
        {
          unique: false,
          fields: ['customer_id', 'account_type', 'status'],
        },
      ],
    }
  )

  return CustomerAccount
}
