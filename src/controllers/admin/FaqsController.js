const Transformer = require('object-transformer')
const { Op } = require('sequelize')
const Response = require('../../services/Response')
const Constants = require('../../services/Constants')
const { Faqs } = require('../../models')
const { faq } = require('../../transformers/admin/FaqTransformer')
const { faqDetail } = require('../../transformers/admin/FaqTransformer')
const { faqEditValidation } = require('../../services/AdminValidation')

module.exports = {
  /**
   * @description 'This function is use to generate list of faq.'
   * @param req
   * @param res
   */
  faqList: async (req, res) => {
    const requestParams = req.query
    let search = false
    const limit =
      requestParams.per_page && requestParams.per_page > 0
        ? parseInt(requestParams.per_page, 10)
        : Constants.PER_PAGE
    const pageNo =
      requestParams.page && requestParams.page > 0
        ? parseInt(requestParams.page, 10)
        : 1
    const offset = (pageNo - 1) * limit

    let query = {
      status: {
        [Op.ne]: Constants.DELETE,
      },
    }

    if (requestParams.search && requestParams.search !== '') {
      search = true
      query = {
        ...query,
        [Op.or]: {
          title: {
            [Op.like]: `%${requestParams.search}%`,
          },
        },
      }
    }

    let sorting = [['updatedAt', 'DESC']]

    if (requestParams.order_by && requestParams.order_by !== '') {
      sorting = [
        [
          requestParams.order_by,
          requestParams.direction ? requestParams.direction : 'DESC',
        ],
      ]
    }

    if (
      requestParams.filter_by_status &&
      requestParams.filter_by_status !== ''
    ) {
      query = {
        ...query,
        [Op.and]: {
          status: requestParams.filter_by_status,
        },
      }
    }

    await Faqs.findAndCountAll({
      where: query,
      order: sorting,
      offset: offset,
      limit: limit,
      distinct: true,
    }).then((data) => {
      if (data.rows.length > 0) {
        const result = data.rows
        const extra = []
        extra.per_page = limit
        extra.total = data.count
        extra.page = pageNo
        return Response.successResponseData(
          res,
          new Transformer.List(result, faq).parse(),
          Constants.SUCCESS,
          res.locals.__('success'),
          extra
        )
      } else {
        return Response.successResponseData(
          res,
          [],
          Constants.SUCCESS,
          res.locals.__('noDataFound')
        )
      }
    })
  },

  /**
   * @description 'This function is use to edit FAQ.'
   * @param req
   * @param res
   * @returns {Promise<void>}
   */
  faqAddEdit: async (req, res) => {
    const requestParams = req.fields
    faqEditValidation(requestParams, res, async (validate) => {
      if (validate) {
        const faqObj = {
          title: requestParams.title,
          description: requestParams.description,
        }

        if (requestParams.id) {
          Faqs.findOne({
            where: {
              id: requestParams.id,
              status: {
                [Op.ne]: Constants.DELETE,
              },
            },
          })
            .then(async (faqData) => {
              if (faqData) {
                await Faqs.update(faqObj, {
                  where: {
                    id: requestParams.id,
                  },
                })
                  .then(async () => {
                    Faqs.findOne({
                      where: {
                        id: requestParams.id,
                        status: {
                          [Op.ne]: Constants.DELETE,
                        },
                      },
                    }).then((finalResult) => {
                      if (finalResult) {
                        return Response.successResponseData(
                          res,
                          new Transformer.Single(
                            finalResult,
                            faqDetail
                          ).parse(),
                          Constants.SUCCESS,
                          res.__('faqUpdated')
                        )
                      }
                      return null
                    })
                  })
                  .catch(() => {
                    Response.errorResponseData(
                      res,
                      res.__('internalError'),
                      Constants.INTERNAL_SERVER
                    )
                  })
              } else {
                Response.successResponseWithoutData(
                  res,
                  res.__('faqNotExits'),
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
        } else {
          await Faqs.create(faqObj)
            .then(async (result) => {
              if (result) {
                Response.successResponseData(
                  res,
                  new Transformer.Single(result, faqDetail).parse(),
                  Constants.SUCCESS,
                  res.__('faqAdded')
                )
              }
            })
            .catch(async () => {
              Response.errorResponseData(
                res,
                res.__('internalError'),
                Constants.INTERNAL_SERVER
              )
            })
        }
      }
    })
  },
  /**
   * @description delete single faq
   * @param req
   * @param res
   * */
  deleteFaq: async (req, res) => {
    const requestParam = req.fields
    const faqData = await Faqs.findByPk(requestParam.id)
    if (faqData === null) {
      Response.successResponseWithoutData(
        res,
        res.__('noDataFound'),
        Constants.FAIL
      )
    } else {
      faqData.status = Constants.DELETE
      faqData
        .save()
        .then(() => {
          Response.successResponseWithoutData(
            res,
            res.__('faqDeleted'),
            Constants.SUCCESS
          )
        })
        .catch(() => {
          Response.errorResponseData(
            res,
            res.__('somethingWentWrong'),
            Constants.BAD_REQUEST
          )
        })
    }
  },
  /**
   * @description details the faq
   * @param req
   * @param res
   * */
  faqDetails: async (req, res) => {
    const faqId = req.params.id
    await Faqs.findOne({
      where: {
        id: faqId,
        status: {
          [Op.not]: Constants.DELETE,
        },
      },
    }).then(
      (faqExists) => {
        if (faqExists) {
          Response.successResponseData(
            res,
            new Transformer.Single(faqExists, faqDetail).parse(),
            Constants.SUCCESS,
            res.__('success')
          )
        } else {
          Response.successResponseWithoutData(
            res,
            res.locals.__('nodataFound'),
            Constants.FAIL
          )
        }
      },
      () => {
        Response.errorResponseData(res, res.__('internalError'), 500)
      }
    )
  },
}
