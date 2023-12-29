const Transformer = require('object-transformer')
const Response = require('../../../services/Response')
const { ACTIVE, SUCCESS, FAIL } = require('../../../services/Constants')
const { Cms, Config } = require('../../../models')
const { getCms } = require('../../../transformers/api/CmsTransformer')
const { configInfo } = require('../../../transformers/api/ConfigTransformer')

module.exports = {
  /**
   * @description "Get CMS"
   * @param req
   * @param res
   * @returns {Promise<void>}
   */
  cms: async (req, res) => {
    const requestParams = req.params
    const whereQue = { status: ACTIVE }
    if (requestParams.seo_url) {
      whereQue.seo_url = requestParams.seo_url
      await Cms.findOne({
        where: whereQue,
      })
        .then(async (result) => {
          if (result) {
            return Response.successResponseData(
              res,
              new Transformer.Single(result, getCms).parse(),
              SUCCESS,
              res.locals.__('success')
            )
          } else {
            return Response.successResponseWithoutData(
              res,
              res.locals.__('noDataFound'),
              FAIL
            )
          }
        })
        .catch(() => {
          Response.errorResponseData(res, res.__('somethingWentWrong'))
        })
    } else {
      await Cms.findAll({
        where: whereQue,
      })
        .then(async (result) => {
          if (result) {
            return Response.successResponseData(
              res,
              new Transformer.List(result, getCms).parse(),
              SUCCESS,
              res.locals.__('success')
            )
          } else {
            return Response.successResponseWithoutData(
              res,
              res.locals.__('noDataFound'),
              FAIL
            )
          }
        })
        .catch(() => {
          Response.errorResponseData(res, res.__('somethingWentWrong'))
        })
    }
  },
  /**
   * @description "Get config"
   * @param req
   * @param res
   * @returns {Promise<void>}
   */
  config: async (req, res) => {
    Config.findOne()
      .then(async (result) => {
        if (result) {
          return Response.successResponseData(
            res,
            new Transformer.Single(result, configInfo).parse(),
            SUCCESS,
            res.locals.__('success')
          )
        } else {
          return Response.successResponseData(
            res,
            null,
            SUCCESS,
            res.locals.__('noDataFound')
          )
        }
      })
      .catch(() => {
        Response.errorResponseData(res, res.__('somethingWentWrong'))
      })
  },
}
