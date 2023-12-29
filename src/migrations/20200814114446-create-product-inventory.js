module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('product_inventory', {
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
      total_quantity: {
        type: Sequelize.INTEGER,
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
    await queryInterface.dropTable('product_inventory')
  },
}
