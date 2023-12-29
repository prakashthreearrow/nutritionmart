module.exports = {
  up: async (queryInterface) => {
    return queryInterface.removeColumn('blog', 'category_id', {})
  },

  down: async (queryInterface) => {
    return queryInterface.removeColumn('blog', 'category_id')
  },
}
