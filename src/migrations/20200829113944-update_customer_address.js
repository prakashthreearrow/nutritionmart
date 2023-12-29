module.exports = {
  up: async (queryInterface, Sequelize) => {
    return [
      queryInterface.addColumn('customer_address', 'mobile_no', {
        allowNull: true,
        type: Sequelize.STRING(10),
      }),
    ]
  },

  down: async (queryInterface) => {
    return [queryInterface.removeColumn('customer_address', 'mobile_no')]
  },
}
