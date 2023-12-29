'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return [
      queryInterface.addColumn('category', 'sequence_number', {
        type: Sequelize.INTEGER,
        allowNull: true,
      }),
      queryInterface.addColumn('brand', 'sequence_number', {
        type: Sequelize.INTEGER,
        allowNull: true,
      }),
    ]
  },
  down: async (queryInterface) => {
    queryInterface.removeColumn('category', 'sequence_number')
    queryInterface.removeColumn('brand', 'sequence_number')
  },
}
