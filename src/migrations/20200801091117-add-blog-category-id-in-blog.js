module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn('blog', 'blog_category_id', {
      type: Sequelize.DataTypes.INTEGER,
    })
  },

  down: async (queryInterface) => {
    return queryInterface.removeColumn('blog', 'blog_category_id')
  },
}
