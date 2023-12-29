module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn('product_stock_details', 'weight', {
      type: Sequelize.DataTypes.FLOAT,
      allowNull: true,
    })
  },
  down: async (queryInterface) => {
    return queryInterface.removeColumn('product_stock_details', 'weight')
  },
}
