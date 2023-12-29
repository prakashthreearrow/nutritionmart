const Transformer = require('object-transformer')
const { Op } = require('sequelize')
const Response = require('../../services/Response')
const sequelize = require('sequelize')
const Constants = require('../../services/Constants')
const { Customer, Product } = require('../../models')
const {
  dashboardTransformer,
} = require('../../transformers/admin/DashboardTransformer')

module.exports = {
  /**
   * @description "This function is use to generate details."
   * @param req
   * @param res
   */
  dashboard: async (req, res) => {
    let totalCustomer = 0
    let newCustomer = 0
    let oldCustomer = 0
    let newCustomerUnsuccessfull = 0
    let retailCustomer = 0
    let totalProducts = 0
    let activeProducts = 0
    let inactiveProducts = 0
    let totalOrders = 0
    let yesterdayOrders = 0
    let todayOrders = 0

    await Customer.findAll({
      attributes: [
        'user_type',
        [sequelize.fn('count', sequelize.col('user_type')), 'count'],
      ],
      where: {
        status: {
          [Op.ne]: [Constants.DELETE],
        },
      },
      group: ['user_type'],
      raw: true,
    }).then(async (result) => {
      for (let i = 0; i < result.length; i++) {
        if (result[i].user_type === Constants.USER_TYPE.OLD_CUSTOMER) {
          oldCustomer = result[i].count
        }
        if (result[i].user_type === Constants.USER_TYPE.NEW_CUSTOMER) {
          newCustomer = result[i].count
        }
        if (
          result[i].user_type ===
          Constants.USER_TYPE.NEW_CUSTOMER_WITH_UNSUCCESSFUL_ORDER
        ) {
          newCustomerUnsuccessfull = result[i].count
        }
        if (result[i].user_type === Constants.USER_TYPE.RETAILS_CUSTOMER) {
          retailCustomer = result[i].count
        }
        totalCustomer =
          oldCustomer + newCustomer + newCustomerUnsuccessfull + retailCustomer
      }
    })

    await Product.findAll({
      attributes: [
        'status',
        [sequelize.fn('count', sequelize.col('status')), 'cnt'],
      ],
      where: {
        status: {
          [Op.ne]: [Constants.DELETE],
        },
      },
      group: ['status'],
      raw: true,
    }).then(async (results) => {
      for (let i = 0; i < results.length; i++) {
        if (results[i].status === Constants.ACTIVE) {
          activeProducts = results[i].cnt
        }
        if (results[i].status === Constants.INACTIVE) {
          inactiveProducts = results[i].cnt
        }
        totalProducts = activeProducts + inactiveProducts
      }
    })

    const result = {}
    result.totalCustomer = totalCustomer
    result.newCustomer = newCustomer
    result.oldCustomer = oldCustomer
    result.totalProducts = totalProducts
    result.activeProducts = activeProducts
    result.inactiveProducts = inactiveProducts
    result.outOfStocks = 0
    result.totalOrders = 0
    result.yesterdayOrders = 0
    result.todayOrders = 0
    result.todaySale = 0
    return Response.successResponseData(
      res,
      new Transformer.Single(result, dashboardTransformer).parse(),
      Constants.SUCCESS,
      res.locals.__('success'),
      null
    )
  },
}
