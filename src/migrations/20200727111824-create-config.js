module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('config', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      penalty_for_late_dispatch: {
        type: Sequelize.FLOAT,
      },
      penalty_for_flavor_change: {
        type: Sequelize.FLOAT,
      },
      nutricash_expiry_days: {
        type: Sequelize.INTEGER,
      },
      promo_message: {
        type: Sequelize.TEXT,
      },
      refer_earn_type: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
        comment: '1:nutricash,2:percentage on first order',
      },
      refer_earn_value: {
        type: Sequelize.INTEGER,
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
    await queryInterface.dropTable('config')
  },
}
