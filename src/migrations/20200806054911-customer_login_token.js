module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('customer_login_token', {
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
      token: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      device_type: {
        type: Sequelize.INTEGER(1),
        defaultValue: 3,
        comment: '1:Android,2:IOS,3:Web',
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
    await queryInterface.dropTable('customer_login_token')
  },
}
