module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('payment_gateway', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      type: {
        allowNull: true,
        type: Sequelize.STRING,
      },
      position: {
        type: Sequelize.INTEGER,
      },
      icon: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      payment_group: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      payment_group_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      enable_version: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      payment_method: {
        type: Sequelize.STRING,
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
    await queryInterface.dropTable('payment_gateway')
  },
}
