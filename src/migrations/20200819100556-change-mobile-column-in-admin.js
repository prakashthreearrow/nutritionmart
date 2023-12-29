module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.changeColumn('admin', 'mobile', {
      type: Sequelize.DataTypes.STRING(20),
      allowNull: false,
    })
  },

  down: async (queryInterface) => {
    return queryInterface.changeColumn('admin', 'mobile')
  },
}
