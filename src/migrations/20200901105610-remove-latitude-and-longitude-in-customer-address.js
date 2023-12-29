module.exports = {
  up: async (queryInterface) => {
    {
      return queryInterface.sequelize.transaction((t) => {
        return Promise.all([
          queryInterface.removeColumn('customer_address', 'latitude', {
            transaction: t,
          }),
          queryInterface.removeColumn('customer_address', 'longitude', {
            transaction: t,
          }),
        ])
      })
    }
  },

  down: async (queryInterface) => {
    {
      return queryInterface.sequelize.transaction((t) => {
        return Promise.all([
          queryInterface.removeColumn('customer_address', 'latitude', {
            transaction: t,
          }),
          queryInterface.removeColumn('customer_address', 'longitude', {
            transaction: t,
          }),
        ])
      })
    }
  },
}
