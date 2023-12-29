module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('product_stock_details', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      product_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'product',
          key: 'id',
        },
        allowNull: false,
      },
      product_stock_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'product_stock',
          key: 'id',
        },
        allowNull: false,
      },
      upc_code: {
        type: Sequelize.STRING(40),
        allowNull: false,
      },
      size: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      serving_day: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      mrp_price: {
        type: Sequelize.FLOAT(10, 2),
        allowNull: false,
      },
      customer_price: {
        type: Sequelize.FLOAT(10, 2),
        allowNull: false,
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
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
    await queryInterface.dropTable('product_stock_details')
  },
}
