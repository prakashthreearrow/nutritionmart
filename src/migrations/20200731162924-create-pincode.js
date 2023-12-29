module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('pincode', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      zone: {
        type: Sequelize.INTEGER(1),
      },
      pincode: {
        type: Sequelize.INTEGER(10),
      },
      is_cod: {
        type: Sequelize.INTEGER(1),
        defaultValue: 1,
        comment: '0:not-available,1:available',
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
    await queryInterface.dropTable('pincode')
  },
}
