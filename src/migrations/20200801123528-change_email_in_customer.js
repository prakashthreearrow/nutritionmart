module.exports = {
  up: async (queryInterface) => {
    return queryInterface.removeColumn('customer', 'email')
  },

  down: async (queryInterface) => {
    return queryInterface.removeColumn('customer', 'email')
  },
}
