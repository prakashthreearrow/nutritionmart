module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn('brand', 'slug', {
      type: Sequelize.DataTypes.STRING(100),
      allowNull: false,
    })
  },

  down: async (queryInterface) => {
    return queryInterface.removeColumn('brand', 'slug')
  },
}
