module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('notification', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      specific_type: {
        allowNull: false,
        type: Sequelize.INTEGER,
        comment: '1:order,2:customer',
      },
      customer_type: {
        allowNull: false,
        type: Sequelize.INTEGER,
        comment: '1:old,2:new,3:all,4:specific,5:order',
      },
      push_notification_title: {
        allowNull: false,
        type: Sequelize.STRING(60),
      },
      push_notification_content: {
        allowNull: false,
        type: Sequelize.STRING(250),
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
    await queryInterface.dropTable('notification')
  },
}
