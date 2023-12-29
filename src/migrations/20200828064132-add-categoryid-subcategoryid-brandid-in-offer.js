module.exports = {
  up: async (queryInterface, Sequelize) => {
    return [
      queryInterface.addColumn('offer', 'product_subcategory_id', {
        type: Sequelize.DataTypes.TEXT,
        allowNull: true,
      }),
      queryInterface.addColumn('offer', 'product_brand_id', {
        type: Sequelize.DataTypes.TEXT,
        allowNull: true,
      }),
    ]
  },

  down: async (queryInterface) => {
    return [
      queryInterface.removeColumn('offer', 'product_subcategory_id'),
      queryInterface.removeColumn('offer', 'product_brand_id'),
    ]
  },
}
