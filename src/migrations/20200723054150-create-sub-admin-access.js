module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('sub_admin_access', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      admin_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'admin',
          key: 'id',
        },
      },
      admin_module_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'admin_module',
          key: 'id',
        },
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
    await queryInterface.dropTable('sub_admin_access')
  },
}
