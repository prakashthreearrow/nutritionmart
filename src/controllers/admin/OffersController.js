const Transformer = require('object-transformer')
const { Op } = require('sequelize')
const Helper = require('../../services/Helper')
const Response = require('../../services/Response')
const Constants = require('../../services/Constants')
const { Offers, PaymentGatewayGroup } = require('../../models')
const {
  offer,
  offerDetail,
  paymentGateways,
} = require('../../transformers/admin/OffersTransformer')
const { addEditValidationForOffers } = require('../../services/AdminValidation')

module.exports = {
  /**
   * @description 'This function is use to generate list of Offers.'
   * @param req
   * @param res
   */
  offersList: async (req, res) => {
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
        [Op.ne]: [Constants.DELETE],
      },
    }

    if (requestParams.search && requestParams.search !== '') {
      search = true
      query = {
        ...query,
        name: {
          [Op.like]: `%${requestParams.search}%`,
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

    Offers.findAndCountAll({
      where: query,
      order: sorting,
      offset: offset,
      limit: limit,
      distinct: true,
    })
      .then((data) => {
        if (data.rows.length > 0) {
          const result = data.rows
          Object.keys(result).forEach((key) => {
            if ({}.hasOwnProperty.call(result, key)) {
              const image =
                result[key].image && result[key].image !== ''
                  ? result[key].image
                  : ''
              result[key].image = Helper.mediaUrlForS3(
                Constants.OFFER_IMAGE,
                image
              )
            }
          })
          const extra = []
          extra.per_page = limit
          extra.total = data.count
          extra.page = pageNo
          return Response.successResponseData(
            res,
            new Transformer.List(result, offer).parse(),
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
      .catch(() => {
        Response.errorResponseData(
          res,
          res.__('internalError'),
          Constants.INTERNAL_SERVER
        )
      })
  },

  /**
   * @description Offer add-edit function
   * @param req
   * @param res
   */
  offerAddEdit: async (req, res) => {
    const requestParams = req.fields
    addEditValidationForOffers(requestParams, res, async (validate) => {
      if (validate) {
        if (parseInt(requestParams.offer_type, 10) === Constants.BULK_OFFER) {
          const bulkProducts = JSON.parse(requestParams.bulk_product_number)
          const repeatBulkProduct = bulkProducts
            .map(function (value) {
              return value.qty + value.discount
            })
            .some(function (value, index, array) {
              return array.indexOf(value) !== array.lastIndexOf(value)
            })

          if (repeatBulkProduct) {
            return Response.successResponseWithoutData(
              res,
              res.__('BulkProductIsRepeated'),
              Constants.FAIL
            )
          }
        }

        let checkNameExist
        if (
          parseInt(requestParams.offer_type, 10) === Constants.COUPON_CODE_OFFER
        ) {
          if (requestParams.id) {
            checkNameExist = Offers.findOne({
              where: {
                coupon_code: requestParams.coupon_code,
                id: {
                  [Op.ne]: requestParams.id,
                },
                status: {
                  [Op.ne]: Constants.DELETE,
                },
              },
            }).then()
          } else {
            checkNameExist = Offers.findOne({
              where: {
                coupon_code: requestParams.coupon_code,
                status: {
                  [Op.ne]: Constants.DELETE,
                },
              },
            }).then()
          }

          await checkNameExist.then(async (OfferData) => {
            if (OfferData) {
              Response.successResponseWithoutData(
                res,
                res.__('OfferAlreadyExist'),
                Constants.FAIL
              )
            }
          })
        }
        const offerObj = {
          offer_type: requestParams.offer_type,
          name: requestParams.name,
          coupon_code: requestParams.coupon_code,
          bulk_product_number: requestParams.bulk_product_number,
          discount: requestParams.discount,
          discount_unit: requestParams.discount_unit,
          product_id: requestParams.product_id,
          product_category_id: requestParams.product_category_id,
          terms_condition: requestParams.terms_condition,
          start_date: requestParams.start_date,
          end_date: requestParams.end_date,
          minimum_order_amount: requestParams.minimum_order_amount,
          maximum_discount: requestParams.maximum_discount,
          maximum_usage: requestParams.maximum_usage,
          payment_method_ids: requestParams.payment_method_ids,
          device: requestParams.device,
          user_type: requestParams.user_type,
          product_subcategory_id: requestParams.product_subcategory_id,
          product_brand_id: requestParams.product_brand_id,
          status: requestParams.status,
        }
        if (requestParams.id) {
          Offers.findOne({
            where: {
              id: requestParams.id,
              status: {
                [Op.ne]: Constants.DELETE,
              },
            },
          })
            .then(async (offerInfo) => {
              if (offerInfo) {
                await offerInfo
                  .update(offerObj, {
                    where: {
                      id: requestParams.id,
                    },
                  })
                  .then(async (result) => {
                    if (result) {
                      return Response.successResponseData(
                        res,
                        {
                          id: result.id,
                        },
                        Constants.SUCCESS,
                        res.__('OfferUpdatedSuccessfully')
                      )
                    }
                    return null
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
                  res.__('OfferNotExist'),
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
          await Offers.create(offerObj)
            .then(async (result) => {
              if (result) {
                return Response.successResponseData(
                  res,
                  {
                    id: result.id,
                  },
                  Constants.SUCCESS,
                  res.__('OfferCreatedSuccessfully')
                )
              }
              return null
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
      return null
    })
  },

  /**
   * @description delete single offers
   * @param req
   * @param res
   * */
  deleteOffers: async (req, res) => {
    const requestParam = req.params
    const offersData = await Offers.findByPk(requestParam.id)
    if (offersData === null) {
      Response.successResponseWithoutData(
        res,
        res.__('noDataFound'),
        Constants.FAIL
      )
    } else {
      offersData.status = Constants.DELETE
      offersData
        .save()
        .then(() => {
          Response.successResponseWithoutData(
            res,
            res.__('offersDeleted'),
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
   * @description detail of offers
   * @param req
   * @param res
   * */
  offerDetail: async (req, res) => {
    const requestParams = req.params
    if (requestParams.id === null) {
      Response.errorResponseData(
        res,
        res.__('invalidOfferId'),
        Constants.BAD_REQUEST
      )
    } else {
      await Offers.findOne({
        where: {
          id: requestParams.id,
          status: {
            [Op.in]: [Constants.ACTIVE, Constants.INACTIVE],
          },
        },
      })
        .then(async (result) => {
          if (result) {
            const offerImage =
              result.image && result.image !== '' ? result.image : ''
            result.image = Helper.mediaUrlForS3(
              Constants.OFFER_IMAGE,
              offerImage
            )
            return Response.successResponseData(
              res,
              new Transformer.Single(result, offerDetail).parse(),
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

  /**
   * @description Payment gateway group list
   * @param req
   * @param res
   * */
  paymentGatewayList: async (req, res) => {
    await PaymentGatewayGroup.findAndCountAll({
      where: {
        status: Constants.ACTIVE,
      },
      order: [['id', 'ASC']],
    }).then(async (data) => {
      if (data.rows.length > 0) {
        const result = data.rows
        return Response.successResponseData(
          res,
          new Transformer.List(result, paymentGateways).parse(),
          Constants.SUCCESS,
          res.locals.__('success')
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
}
