module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('product_inventory_log', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER(11),
      },
      product_id: {
        type: Sequelize.INTEGER(11),
        references: {
          model: 'product',
          key: 'id',
        },
        allowNull: false,
      },
      flavor_id: {
        type: Sequelize.INTEGER(11),
        references: {
          model: 'product_flavor',
          key: 'id',
        },
        allowNull: false,
      },
      product_stock_detail_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'product_stock_details',
          key: 'id',
        },
      },
      quantity: {
        type: Sequelize.INTEGER,
      },
      batch_no: {
        type: Sequelize.STRING(80),
        defaultValue: null,
      },
      expiry_date: {
        type: Sequelize.DATE,
        defaultValue: null,
        comment: 'YYYY-MM-DD',
      },
      party_name: {
        type: Sequelize.STRING(100),
        defaultValue: null,
      },
      log_type: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
        comment: '1:inward,2:outword',
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
    await queryInterface.dropTable('product_inventory_log')
  },
}
