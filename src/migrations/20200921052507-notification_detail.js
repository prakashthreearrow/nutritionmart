module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('notification_detail', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      notification_id: {
        allowNull: false,
        type: Sequelize.INTEGER,
      },
      upload_file: {
        allowNull: false,
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
    await queryInterface.dropTable('notification_detail')
  },
}
