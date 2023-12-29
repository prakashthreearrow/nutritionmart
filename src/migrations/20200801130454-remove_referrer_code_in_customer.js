module.exports = {
  up: async (queryInterface) => {
    return queryInterface.removeColumn('customer', 'referrer_code')
  },

  down: async (queryInterface) => {
    return queryInterface.removeColumn('customer', 'referrer_code')
  },
}
