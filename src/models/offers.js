const { Model } = require('sequelize')
module.exports = (sequelize, DataTypes) => {
  class Offers extends Model {
    static associate(models) {}
  }
  Offers.init(
    {
      offer_type: {
        type: DataTypes.INTEGER,
        comment: '1:bulk,2:payment,3:coupon_code',
      },
      name: DataTypes.STRING(100),
      coupon_code: {
        type: DataTypes.STRING(10),
        allowNull: true,
      },
      bulk_product_number: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      discount: DataTypes.FLOAT,
      discount_unit: {
        type: DataTypes.INTEGER,
        comment: '1:percentage,2:flat_off',
        defaultValue: 1,
      },
      product_id: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      product_category_id: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      terms_condition: DataTypes.TEXT,
      start_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      end_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      minimum_order_amount: {
        type: DataTypes.FLOAT(10, 2),
        allowNull: true,
      },
      maximum_discount: {
        type: DataTypes.FLOAT(10, 2),
        allowNull: true,
      },
      maximum_usage: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      payment_method_ids: {
        type: DataTypes.STRING,
        comment: '1:upi, 2:credit_card, 3:net_banking, 4:debit_card',
        allowNull: true,
      },
      device: {
        type: DataTypes.INTEGER,
        comment: '1:app, 2:website, 3:both',
        defaultValue: 3,
      },
      user_type: {
        type: DataTypes.INTEGER,
        comment: '1:all, 2:new',
        defaultValue: 1,
      },
      image: {
        type: DataTypes.STRING(40),
        allowNull: true,
      },
      product_subcategory_id: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      product_brand_id: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      status: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        comment: '0:inactive,1:active,2:delete',
      },
    },
    {
      sequelize,
      modelName: 'Offers',
      tableName: 'offer',
      timestamps: true,
    }
  )
  return Offers
}
