module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn('product_stock_details', 'sku', {
      type: Sequelize.DataTypes.STRING(30),
      allowNull: false,
    })
  },
  down: async (queryInterface) => {
    return queryInterface.removeColumn('product_stock_details', 'sku')
  },
}
