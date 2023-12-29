module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('product_stock', {
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
      flavor_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'product_flavor',
          key: 'id',
        },
        allowNull: false,
      },
      is_default: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: '0:no,1:yes',
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
    await queryInterface.dropTable('product_stock')
  },
}
