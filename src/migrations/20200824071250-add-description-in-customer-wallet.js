module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn('customer_wallet', 'description', {
      type: Sequelize.TEXT,
    })
  },

  down: async (queryInterface) => {
    return queryInterface.removeColumn('customer_wallet', 'description')
  },
}
