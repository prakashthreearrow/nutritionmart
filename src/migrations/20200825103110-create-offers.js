module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('offer', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      offer_type: {
        type: Sequelize.INTEGER,
        comment: '1:bulk,2:payment,3:coupon_code',
      },
      name: {
        type: Sequelize.STRING(100),
      },
      coupon_code: {
        type: Sequelize.STRING(11),
        allowNull: false,
      },
      bulk_product_number: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      discount: {
        type: Sequelize.FLOAT,
      },
      discount_unit: {
        type: Sequelize.INTEGER,
        comment: '1:percentage,2:flat_off',
        defaultValue: 1,
      },
      product_id: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      product_category_id: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      terms_condition: {
        type: Sequelize.TEXT,
      },
      start_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      end_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      minimum_order_amount: {
        type: Sequelize.FLOAT(10, 2),
        allowNull: true,
      },
      maximum_discount: {
        type: Sequelize.FLOAT(10, 2),
        allowNull: true,
      },
      maximum_usage: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      payment_method_ids: {
        type: Sequelize.STRING,
        comment: '1:upi, 2:credit_card, 3:net_banking, 4:debit_card',
        allowNull: true,
      },
      device: {
        type: Sequelize.INTEGER,
        comment: '1:app, 2:website, 3:both',
        defaultValue: 3,
      },
      user_type: {
        type: Sequelize.INTEGER,
        comment: '1:all, 2:new',
        defaultValue: 1,
      },
      image: {
        type: Sequelize.STRING(40),
        allowNull: true,
      },
      status: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
        comment: '0:inactive,1:active,2:delete',
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    })
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('offer')
  },
}
