module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn('product_inventory_log', 'sale_offline', {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      comment: '0:no,1:yes',
    })
  },

  down: async (queryInterface) => {
    return queryInterface.removeColumn('product_inventory_log', 'sale_offline')
  },
}
