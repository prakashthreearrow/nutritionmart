module.exports = {
  up: async (queryInterface, Sequelize) => {
    return [
      queryInterface.addColumn('customer_address', 'state', {
        type: Sequelize.DataTypes.STRING,
      }),
    ]
  },

  down: async (queryInterface) => {
    return [queryInterface.removeColumn('customer_address', 'state')]
  },
}
