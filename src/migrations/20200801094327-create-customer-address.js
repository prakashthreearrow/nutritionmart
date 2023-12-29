module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('customer_address', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER(11),
      },
      customer_id: {
        type: Sequelize.INTEGER(11),
        allowNull: false,
      },
      receiver_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      address_1: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      address_2: {
        type: Sequelize.STRING(255),
        defaultValue: null,
      },
      landmark: {
        type: Sequelize.STRING(150),
        allowNull: false,
      },
      city: {
        type: Sequelize.STRING(150),
        allowNull: true,
      },
      pincode: {
        type: Sequelize.INTEGER(10),
        allowNull: true,
      },
      status: {
        type: Sequelize.INTEGER(1),
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
    await queryInterface.dropTable('customer_address')
  },
}
