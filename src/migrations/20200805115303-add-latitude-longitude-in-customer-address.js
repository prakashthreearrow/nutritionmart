module.exports = {
  up: async (queryInterface, Sequelize) => {
    return [
      queryInterface.addColumn('customer_address', 'latitude', {
        type: Sequelize.DataTypes.DECIMAL(10, 8),
        allowNull: true,
        defaultValue: null,
      }),
      queryInterface.addColumn('customer_address', 'longitude', {
        type: Sequelize.DataTypes.DECIMAL(10, 8),
        allowNull: true,
        defaultValue: null,
      }),
    ]
  },

  down: async (queryInterface) => {
    return [
      queryInterface.removeColumn('customer_address', 'latitude'),
      queryInterface.removeColumn('customer_address', 'longitude'),
    ]
  },
}
