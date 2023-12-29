const Transformer = require('object-transformer')
const Response = require('../../services/Response')
const Constants = require('../../services/Constants')
const { Config } = require('../../models')
const { configDetail } = require('../../transformers/admin/ConfigTransformer')
const { addEditValidationForConfig } = require('../../services/AdminValidation')

module.exports = {
  /**
   * @description "This function is use to get Config."
   * @param req
   * @param res
   * @returns {Promise<void>}
   */
  getConfig: async (req, res) => {
    await Config.findOne({})
      .then(async (result) => {
        if (result) {
          return Response.successResponseData(
            res,
            new Transformer.Single(result, configDetail).parse(),
            Constants.SUCCESS,
            res.locals.__('success'),
            null
          )
        } else {
          return Response.successResponseWithoutData(
            res,
            res.locals.__('noDataFound'),
            Constants.FAIL
          )
        }
      })
      .catch(() => {
        Response.errorResponseData(
          res,
          res.__('internalError'),
          Constants.INTERNAL_SERVER
        )
      })
  },

  /**
   * @description "This function is use to set Config."
   * @param req
   * @param res
   * @returns {Promise<void>}
   */
  setConfig: async (req, res) => {
    const requestParam = req.fields
    addEditValidationForConfig(requestParam, res, async (validate) => {
      if (validate) {
        const config = {
          nutricash_expiry_days: requestParam.nutricash_expiry_days,
          promo_message: requestParam.promo_message,
          refer_earn_type: requestParam.refer_earn_type,
          refer_earn_value: requestParam.refer_earn_value,
        }
        await Config.update(config, { where: { id: 1 } })
          .then((data) => {
            if (data) {
              return Response.successResponseWithoutData(
                res,
                res.__('ConfigEdited'),
                Constants.SUCCESS
              )
            } else {
              return Response.successResponseWithoutData(
                res,
                res.__('noDataFound'),
                Constants.FAIL
              )
            }
          })
          .catch(() => {
            return Response.errorResponseData(
              res,
              res.__('somethingWentWrong'),
              Constants.BAD_REQUEST
            )
          })
      }
    })
  },
}
