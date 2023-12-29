module.exports = {
  up: async (queryInterface, Sequelize) => {
    return [
      queryInterface.addColumn('product_inventory', 'batch_no', {
        type: Sequelize.STRING(80),
        defaultValue: null,
      }),
      queryInterface.addColumn('product_inventory', 'expiry_date', {
        type: Sequelize.DATE,
        defaultValue: null,
        comment: 'YYYY-MM-DD',
      }),
    ]
  },

  down: async (queryInterface) => {
    return [
      queryInterface.removeColumn('product_inventory', 'batch_no'),
      queryInterface.removeColumn('product_inventory', 'expiry_date'),
    ]
  },
}
