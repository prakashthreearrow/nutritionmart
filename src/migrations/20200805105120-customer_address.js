module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface
      .createTable('customer_address', {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER,
        },
        customer_id: {
          type: Sequelize.INTEGER,
          references: {
            model: 'customer',
            key: 'id',
          },
        },
        receiver_name: {
          allowNull: false,
          type: Sequelize.STRING(100),
        },
        address_1: {
          allowNull: false,
          type: Sequelize.STRING(255),
        },
        address_2: {
          allowNull: true,
          type: Sequelize.STRING(255),
        },
        landmark: {
          allowNull: true,
          type: Sequelize.STRING(150),
        },
        city: {
          allowNull: true,
          type: Sequelize.STRING(150),
        },
        pincode: {
          type: Sequelize.STRING(10),
          defaultValue: '',
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
      .then(() => {
        queryInterface.addIndex('customer_address', [
          'id',
          'customer_id',
          'status',
        ])
      })
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('customer_address')
  },
}
