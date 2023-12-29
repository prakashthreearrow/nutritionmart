const { Model } = require('sequelize')

module.exports = (sequelize, DataTypes) => {
  class faqs extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate() {
      // define association here
    }
  }
  faqs.init(
    {
      title: DataTypes.TEXT,
      description: DataTypes.TEXT,
      status: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        comment: '0:inactive,1:active,2:deleted',
      },
      faq_type: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        comment: '1:customer,2:vendor',
      },
    },
    {
      sequelize,
      modelName: 'Faqs',
      tableName: 'faqs',
      timestamps: true,
    }
  )
  return faqs
}
