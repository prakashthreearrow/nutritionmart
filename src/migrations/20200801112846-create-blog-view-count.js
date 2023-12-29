module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('blog_view_count', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      blog_id: {
        type: Sequelize.INTEGER,
      },
      view_count: {
        type: Sequelize.INTEGER,
      },
      ip_address: {
        type: Sequelize.STRING,
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
    await queryInterface.dropTable('blog_view_count')
  },
}
