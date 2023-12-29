module.exports = {
  up: async (queryInterface, Sequelize) => {
    return [
      queryInterface.addColumn('blog', 'author_name', {
        type: Sequelize.DataTypes.STRING(100),
        allowNull: false,
      }),
      queryInterface.addColumn('blog', 'reading_minute', {
        type: Sequelize.DataTypes.INTEGER,
        allowNull: false,
      }),
    ]
  },

  down: async (queryInterface) => {
    return [
      queryInterface.removeColumn('blog', 'author_name'),
      queryInterface.removeColumn('blog', 'reading_minute'),
    ]
  },
}
