module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn('customer', 'referrer_code', {
      type: Sequelize.STRING(50),
      allowNull: true,
    })
  },

  down: async (queryInterface) => {
    return queryInterface.removeColumn('customer', 'referrer_code')
  },
}
