module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn('product_stock', 'status', {
      type: Sequelize.INTEGER,
      defaultValue: 1,
      comment: '0:inactive,1:active,2:delete',
    })
  },

  down: async (queryInterface) => {
    return queryInterface.removeColumn('product_stock', 'status')
  },
}
