module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn('category', 'parent_id', {
      type: Sequelize.DataTypes.INTEGER,
      defaultValue: 0,
    })
  },

  down: async (queryInterface) => {
    return queryInterface.removeColumn('category', 'parent_id')
  },
}
