module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('authenticity_videos', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      name: {
        type: Sequelize.STRING,
      },
      link: {
        type: Sequelize.TEXT,
      },
      status: {
        allowNull: false,
        type: Sequelize.INTEGER,
        comment: '0:inactive,1:active,2:deleted',
        defaultValue: 1,
      },
      video_category: {
        allowNull: false,
        type: Sequelize.INTEGER,
        comment: '1-Customer Unboxing, 2-Product Reviews, 3-Product Teaser',
        defaultValue: 1,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    })
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('authenticity_videos')
  },
}
