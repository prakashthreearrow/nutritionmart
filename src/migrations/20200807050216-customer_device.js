module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('customer_device', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER(11),
      },
      customer_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'customer',
          key: 'id',
        },
      },
      device_type: {
        type: Sequelize.INTEGER(1),
        defaultValue: 3,
        comment: '1:Android,2:IOS,3:Web',
      },
      device_token: {
        type: Sequelize.TEXT,
        allowNull: false,
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
    await queryInterface.dropTable('customer_device')
  },
}
