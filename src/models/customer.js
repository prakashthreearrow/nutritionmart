const { Model } = require('sequelize')

module.exports = (sequelize, DataTypes) => {
  class Customer extends Model {
    static associate(models) {
      Customer.hasOne(models.CustomerWallet, {
        sourceKey: 'id',
        foreignKey: 'Customer_id',
      })
      Customer.hasOne(models.CustomerAddress, {
        sourceKey: 'id',
        foreignKey: 'id',
      })
      Customer.hasMany(models.CustomerDevice, {
        sourceKey: 'id',
        foreignKey: 'customer_id',
      })
      Customer.hasMany(models.CustomerReferral, {
        sourceKey: 'id',
        foreignKey: 'ref_customer_id',
      })
    }
  }
  Customer.init(
    {
      first_name: DataTypes.STRING(50),
      last_name: DataTypes.STRING(50),
      email: {
        type: DataTypes.STRING(200),
        unique: true,
      },
      password: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      mobile: DataTypes.STRING(15),
      image: DataTypes.STRING(40),
      gender: {
        type: DataTypes.INTEGER,
        defaultValue: 3,
        comment: '0-none,1:male,2:female,3:others',
      },
      dob: {
        type: DataTypes.DATE,
        defaultValue: null,
      },
      is_cod_active: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        comment: '0:no,1:yes',
      },
      otp: {
        type: DataTypes.INTEGER,
        defaultValue: null,
      },
      reset_token: {
        type: DataTypes.TEXT(200),
        defaultValue: '',
      },
      reset_expiry: {
        type: DataTypes.DATE,
        defaultValue: null,
      },
      resend_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      user_type: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
      },
      referrer_code: {
        type: DataTypes.STRING(50),
        unique: true,
        allowNull: true,
      },
      signup_details: DataTypes.TEXT,
      is_notify: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        comment: '0:no,1:yes',
      },
      state: DataTypes.TEXT,
      pincode: DataTypes.TEXT,
      nutricash: {
        type: DataTypes.FLOAT,
        defaultValue: 0,
      },
      is_use_app: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: '0:no,1:yes',
      },
      new_mobile: {
        allowNull: true,
        type: DataTypes.STRING(15),
      },
      recently_viewed: DataTypes.TEXT,
      last_otp_sent: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: 'timestamp',
      },
      status: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        comment: '0-inactive, 1-active, 2-deleted ,4-unverify',
      },
    },
    {
      sequelize,
      timestamps: true,
      modelName: 'Customer',
      tableName: 'customer',
      indexes: [
        {
          unique: true,
          fields: ['email', 'referrer_code'],
        },
        {
          unique: false,
          fields: [
            'id',
            'first_name',
            'last_name',
            'email',
            'mobile',
            'state',
            'nutricash',
            'pincode',
            'new_mobile',
            'last_otp_sent',
          ],
        },
      ],
    }
  )

  return Customer
}
