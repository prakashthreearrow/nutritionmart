module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.changeColumn('customer', 'dob', {
      defaultValue: null,
      type: Sequelize.DATEONLY,
    })
  },

  down: async (queryInterface) => {
    return queryInterface.removeColumn('customer', 'dob')
  },
}
