'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return [
      queryInterface.changeColumn('pincode', 'zone', {
        type: Sequelize.STRING(1),
      }),
    ]
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('pincode', 'zone')
  },
}
