const Transformer = require('object-transformer')
const { Op } = require('sequelize')
const Response = require('../../services/Response')
const Constants = require('../../services/Constants')
const { Cms } = require('../../models')
const { cmsEditValidation } = require('../../services/AdminValidation')
const { cmsDetail } = require('../../transformers/admin/CmsTransformer')

module.exports = {
  /**
   * @description "This function is use to generate list of CMS."
   * @param req
   * @param res
   */
  cmsList: (req, res) => {
    Cms.findAll({
      where: {
        status: {
          [Op.ne]: Constants.DELETE,
        },
      },
      order: [['updatedAt', 'DESC']],
    }).then(async (result) => {
      if (result.length > 0) {
        return Response.successResponseData(
          res,
          new Transformer.List(result, cmsDetail).parse(),
          Constants.SUCCESS,
          res.locals.__('success'),
          null
        )
      }
      return Response.successResponseData(
        res,
        [],
        Constants.SUCCESS,
        res.__('noDataFound')
      )
    })
  },

  /**
   * @description "This function is use to edit CMS."
   * @param req
   * @param res
   * @returns {Promise<void>}
   */
  cmsEdit: async (req, res) => {
    const requestParam = req.fields
    cmsEditValidation(requestParam, res, async (validate) => {
      if (validate) {
        const cms = await Cms.findByPk(requestParam.id)
        if (cms === null) {
          return Response.errorResponseData(
            res,
            res.__('CmsIdInvalid'),
            Constants.INTERNAL_SERVER
          )
        } else {
          cms.title = requestParam.title
          cms.description = requestParam.description
          cms
            .save()
            .then(() => {
              return Response.successResponseWithoutData(
                res,
                res.__('cmsEdited'),
                Constants.SUCCESS
              )
            })
            .catch(() => {
              return Response.errorResponseData(
                res,
                res.__('somethingWentWrong'),
                Constants.BAD_REQUEST
              )
            })
        }
      }
      return null
    })
  },

  /**
   * @description "This function is use to get CMS detail."
   * @param req
   * @param res
   * @returns {Promise<void>}
   */
  cmsDetail: async (req, res) => {
    const requestParams = req.params
    if (requestParams.id === null) {
      Response.errorResponseData(
        res,
        res.__('invalidCmsId'),
        Constants.BAD_REQUEST
      )
    } else {
      await Cms.findOne({
        where: {
          id: requestParams.id,
          status: {
            [Op.in]: [Constants.ACTIVE, Constants.INACTIVE],
          },
        },
      })
        .then(async (result) => {
          if (result) {
            return Response.successResponseData(
              res,
              new Transformer.Single(result, cmsDetail).parse(),
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
    }
  },
}
