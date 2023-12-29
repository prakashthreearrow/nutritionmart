module.exports = {
  up: async (queryInterface, Sequelize) => {
    return [
      queryInterface.addColumn('brand', 'app_image', {
        type: Sequelize.DataTypes.TEXT,
        allowNull: true,
      }),
      queryInterface.addColumn('brand', 'sort_order', {
        type: Sequelize.DataTypes.TEXT,
        allowNull: true,
      }),
    ]
  },

  down: async (queryInterface) => {
    return [
      queryInterface.removeColumn('brand', 'app_image'),
      queryInterface.removeColumn('brand', 'sort_order'),
    ]
  },
}
