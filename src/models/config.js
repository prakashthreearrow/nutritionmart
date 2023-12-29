const { Model } = require('sequelize')

module.exports = (sequelize, DataTypes) => {
  class Config extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate() {
      // define association here
    }
  }
  Config.init(
    {
      penalty_for_late_dispatch: DataTypes.FLOAT,
      penalty_for_flavor_change: DataTypes.FLOAT,
      nutricash_expiry_days: DataTypes.INTEGER,
      promo_message: DataTypes.TEXT,
      refer_earn_type: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        comment: '1:nutricash,2:percentage on first order',
      },
      refer_earn_value: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: 'Config',
      tableName: 'config',
      timestamps: true,
    }
  )
  return Config
}
