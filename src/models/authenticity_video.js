const { Model } = require('sequelize')
module.exports = (sequelize, DataTypes) => {
  class AuthenticityVideo extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate() {
      // define association here
    }
  }
  AuthenticityVideo.init(
    {
      name: DataTypes.STRING,
      link: DataTypes.TEXT,
      status: DataTypes.INTEGER,
      video_category: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: 'AuthenticityVideo',
      tableName: 'authenticity_videos',
      timestamps: true,
    }
  )
  return AuthenticityVideo
}
