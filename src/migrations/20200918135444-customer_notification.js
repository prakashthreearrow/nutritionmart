module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('customer_notification', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      notification_id: {
        allowNull: true,
        type: Sequelize.INTEGER,
        references: {
          model: 'notification',
          key: 'id',
        },
      },
      notify_type: {
        allowNull: false,
        type: Sequelize.INTEGER,
        comment: '1:old,2:new,3:all,4:specific,5:order',
      },
      customer_id: {
        allowNull: true,
        type: Sequelize.INTEGER,
      },
      title: {
        allowNull: true,
        type: Sequelize.STRING(60),
      },
      message: {
        allowNull: true,
        type: Sequelize.STRING(250),
      },
      is_read: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: '0:no,1:yes',
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
    await queryInterface.dropTable('customer_notification')
  },
}
