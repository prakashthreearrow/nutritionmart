module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn('customer', 'is_use_app', {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      comment: '0:no,1:yes',
    })
  },

  down: async (queryInterface) => {
    return queryInterface.removeColumn('customer', 'is_use_app')
  },
}
