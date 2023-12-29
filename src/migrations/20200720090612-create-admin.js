module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('admin', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      type: {
        type: Sequelize.INTEGER,
        defaultValue: '2',
        comment: '1:super-admin,2:sub-admin',
      },
      name: {
        allowNull: false,
        type: Sequelize.STRING(30),
      },
      mobile: {
        allowNull: false,
        type: Sequelize.STRING(10),
      },
      email: {
        allowNull: false,
        unique: true,
        type: Sequelize.STRING(30),
      },
      address: {
        allowNull: true,
        type: Sequelize.TEXT,
      },
      password: {
        allowNull: false,
        type: Sequelize.STRING(100),
      },
      reset_token: {
        defaultValue: '',
        type: Sequelize.TEXT,
      },
      code_expiry: {
        type: Sequelize.DATE,
      },
      status: {
        allowNull: false,
        type: Sequelize.INTEGER,
        defaultValue: '1',
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
    await queryInterface.dropTable('admin')
  },
}
