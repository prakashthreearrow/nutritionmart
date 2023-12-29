module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn('customer', 'email', {
      type: Sequelize.STRING(200),
      allowNull: true,
    })
  },

  down: async (queryInterface) => {
    return queryInterface.removeColumn('customer', 'email')
  },
}
