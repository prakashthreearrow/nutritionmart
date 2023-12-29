module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('customer_referral', {
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
      ref_customer_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'customer',
          key: 'id',
        },
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
    await queryInterface.dropTable('customer_referral')
  },
}
