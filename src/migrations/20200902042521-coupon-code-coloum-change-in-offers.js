module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.changeColumn('offer', 'coupon_code', {
      type: Sequelize.DataTypes.STRING(11),
      allowNull: true,
    })
  },

  down: async (queryInterface) => {
    return queryInterface.changeColumn('offer', 'coupon_code')
  },
}
