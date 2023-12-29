module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface
      .createTable('customer_account', {
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
        account_type: {
          type: Sequelize.INTEGER,
          defaultValue: 1,
          comment: '1-Email, 2-Facebook, 3-Google, 4-Apple',
        },
        account_id: {
          allowNull: true,
          type: Sequelize.STRING(150),
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
        queryInterface.addIndex('customer_account', [
          'id',
          'customer_id',
          'account_type',
          'account_id',
          'status',
        ])
      })
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('customer_account')
  },
}
