module.exports = {
  up: async (queryInterface, Sequelize) => {
    return [
      queryInterface.addColumn('blog', 'slug', {
        type: Sequelize.DataTypes.STRING(100),
        allowNull: false,
      }),
      queryInterface.addColumn('blog', 'category_id', {
        type: Sequelize.DataTypes.INTEGER,
        allowNull: false,
      }),
      queryInterface.addColumn('blog', 'image', {
        type: Sequelize.DataTypes.STRING(40),
        allowNull: true,
      }),
    ]
  },

  down: async (queryInterface) => {
    return [
      queryInterface.removeColumn('blog', 'slug'),
      queryInterface.removeColumn('blog', 'category_id'),
      queryInterface.removeColumn('blog', 'image'),
    ]
  },
}
