const { Model } = require('sequelize')

module.exports = (sequelize, DataTypes) => {
  class banner extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate() {
      // define association here
    }
  }
  banner.init(
    {
      title: DataTypes.STRING,
      display_location: DataTypes.INTEGER,
      image: DataTypes.STRING,
      app_image: DataTypes.STRING,
      responsive_image: DataTypes.STRING,
      link: DataTypes.STRING,
      sequence_number: DataTypes.INTEGER,
      status: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: 'banner',
    }
  )
  return banner
}
