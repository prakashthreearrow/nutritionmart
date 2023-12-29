const { Model } = require('sequelize')

module.exports = (sequelize, DataTypes) => {
  class Pincode extends Model {}

  Pincode.init(
    {
      zone: DataTypes.STRING,
      pincode: DataTypes.INTEGER,
      is_cod: DataTypes.INTEGER,
      status: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
      },
    },
    {
      sequelize,
      modelName: 'Pincode',
      tableName: 'pincode',
    }
  )
  return Pincode
}
