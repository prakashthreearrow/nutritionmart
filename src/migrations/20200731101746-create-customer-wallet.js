module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('customer_wallet', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      customer_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'customer',
          key: 'id',
        },
      },
      transaction_type: {
        type: Sequelize.INTEGER,
        comment:
          '1:add by admin,2:remove by admin, 3:purchase, 4:reffer, 5:order_reffer',
        defaultValue: null,
      },
      order_id: {
        type: Sequelize.INTEGER,
        defaultValue: null,
        allowNull: true,
      },
      amount: {
        type: Sequelize.DOUBLE,
        defaultValue: null,
      },
      expiry: {
        type: Sequelize.DATE,
        defaultValue: null,
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
    await queryInterface.dropTable('customer_wallet')
  },
}
