module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn('category', 'icon_image', {
      type: Sequelize.STRING,
      allowNull: true,
    })
  },

  down: async (queryInterface) => {
    return queryInterface.removeColumn('category', 'icon_image')
  },
}
