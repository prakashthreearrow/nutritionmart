module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('brand', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      name: {
        allowNull: false,
        unique: true,
        type: Sequelize.STRING(60),
      },
      description: {
        type: Sequelize.TEXT,
      },
      image: {
        allowNull: true,
        type: Sequelize.STRING(100),
      },
      banner_image: {
        allowNull: true,
        type: Sequelize.STRING(100),
      },
      status: {
        allowNull: false,
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
    await queryInterface.dropTable('brand')
  },
}
