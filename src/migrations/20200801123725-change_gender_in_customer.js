module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.changeColumn('customer', 'gender', {
      type: Sequelize.INTEGER,
      defaultValue: 4,
      comment: '1:male,2:female,3:others,4:none',
    })
  },

  down: async (queryInterface) => {
    return queryInterface.removeColumn('customer', 'gender')
  },
}
