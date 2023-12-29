module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('product_image', {
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
      image: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      sort_order: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      media_type: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
        comment: '1:image,2:video',
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
    await queryInterface.dropTable('product_image')
  },
}
