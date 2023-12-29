const Transformer = require('object-transformer')
const slugify = require('slugify')
const { Op } = require('sequelize')
const Response = require('../../services/Response')
const Constants = require('../../services/Constants')
const Helper = require('../../services/Helper')
const { Brand, Product } = require('../../models')
const {
  brand,
  brandDetail,
  activeBrandList,
} = require('../../transformers/admin/BrandTransformer')
const {
  addEditValidationForBrand,
  brandChangeStatusValidation,
} = require('../../services/AdminValidation')

module.exports = {
  /**
   * @description This function is use to generate list of Brand
   * @param req
   * @param res
   * @returns {Promise<void>}
   */
  brandList: async (req, res) => {
    const requestParams = req.query
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
      query = {
        ...query,
        [Op.or]: {
          name: {
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

    await Brand.findAndCountAll({
      include: {
        model: Product,
        where: {
          status: {
            [Op.in]: [Constants.ACTIVE],
          },
        },
        required: false,
      },
      where: query,
      order: sorting,
      offset: offset,
      limit: limit,
      distinct: true,
    }).then((data) => {
      if (data.rows.length > 0) {
        const result = data.rows
        Object.keys(result).forEach((key) => {
          if ({}.hasOwnProperty.call(result, key)) {
            const brandImage =
              result[key].image && result[key].image !== ''
                ? result[key].image
                : ''
            result[key].image = Helper.mediaUrlForS3(
              Constants.BRAND_IMAGE,
              brandImage
            )

            const brandBannerImage =
              result[key].banner_image && result[key].banner_image !== ''
                ? result[key].banner_image
                : ''
            result[key].banner_image = Helper.mediaUrlForS3(
              Constants.BRAND_BANNER_IMAGE,
              brandBannerImage
            )

            const brandAppImage =
              result[key].app_image && result[key].app_image !== ''
                ? result[key].app_image
                : ''
            result[key].app_image = Helper.mediaUrlForS3(
              Constants.BRAND_APP_IMAGE,
              brandAppImage
            )

            result[key].products_count = result[key].Products.length
          }
        })
        const extra = []
        extra.per_page = limit
        extra.total = data.count
        extra.page = pageNo
        return Response.successResponseData(
          res,
          new Transformer.List(result, brand).parse(),
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
   * @description Brand add-edit function
   * @param req
   * @param res
   */
  brandAddEdit: async (req, res) => {
    const requestParams = req.fields
    addEditValidationForBrand(requestParams, res, async (validate) => {
      if (validate) {
        let checkNameExist
        if (requestParams.id) {
          checkNameExist = Brand.findOne({
            where: {
              name: requestParams.name,
              id: {
                [Op.ne]: requestParams.id,
              },
              status: {
                [Op.ne]: Constants.DELETE,
              },
            },
          }).then()
        } else {
          checkNameExist = Brand.findOne({
            where: {
              name: requestParams.name,
              status: {
                [Op.ne]: Constants.DELETE,
              },
            },
          }).then()
        }
        await checkNameExist.then(async (brandData) => {
          if (brandData) {
            Response.successResponseWithoutData(
              res,
              res.__('BrandNameAlreadyExist'),
              Constants.FAIL
            )
          } else {
            const brandObj = {
              name: requestParams.name,
              description: requestParams.description,
              status: requestParams.status,
            }
            if (requestParams.id) {
              Brand.findOne({
                where: {
                  id: requestParams.id,
                  status: {
                    [Op.ne]: Constants.DELETE,
                  },
                },
              })
                .then(async (brandInfo) => {
                  if (brandInfo) {
                    await brandInfo
                      .update(brandObj, {
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
                            res.__('brandUpdatedSuccessfully')
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
                      res.__('SubAdminNotExist'),
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
              const slug = slugify(requestParams.name, {
                replacement: '-',
                remove: /[*+~.()'"!:@]/gi,
                lower: true,
                strict: true,
              })

              brandObj.slug = await module.exports.checkUniqueSlug(slug)

              await Brand.create(brandObj)
                .then(async (result) => {
                  if (result) {
                    return Response.successResponseData(
                      res,
                      {
                        id: result.id,
                      },
                      Constants.SUCCESS,
                      res.locals.__('brandCreatedSuccessfully'),
                      null
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
        })
      }
      return null
    })
  },

  /**
   * @description check unique slug
   * @param slugName
   */

  checkUniqueSlug: async (slugName) => {
    let newSlug = slugName
    await Brand.findOne({
      where: {
        slug: slugName,
        status: {
          [Op.ne]: Constants.DELETE,
        },
      },
    }).then(async (res) => {
      if (res) {
        const randomNumber = await Helper.makeRandomDigit(3)
        newSlug = `${slugName}-${randomNumber}`
        await Brand.findOne({
          where: {
            slug: newSlug,
            status: {
              [Op.ne]: Constants.DELETE,
            },
          },
        }).then(async (data) => {
          if (!data) {
            return newSlug
          } else {
            await module.exports.checkUniqueSlug(slugName)
          }
          return null
        })
      }
      return newSlug
    })
    return newSlug
  },

  /**
   * @description change the status of brand
   * @param req
   * @param res
   */
  brandUpdateStatus: async (req, res) => {
    const requestParams = req.fields
    brandChangeStatusValidation(requestParams, res, async (validate) => {
      if (validate) {
        await Brand.findOne({
          where: {
            id: requestParams.id,
          },
        })
          .then(async (brandData) => {
            if (brandData) {
              /* eslint no-param-reassign: "error" */
              brandData.status = requestParams.status
              brandData
                .save()
                .then((result) => {
                  if (result) {
                    if (
                      parseInt(requestParams.status, 10) === Constants.ACTIVE
                    ) {
                      Response.successResponseWithoutData(
                        res,
                        res.locals.__('BrandStatusActivated'),
                        Constants.SUCCESS
                      )
                    } else if (
                      parseInt(requestParams.status, 10) === Constants.DELETE
                    ) {
                      Response.successResponseWithoutData(
                        res,
                        res.locals.__('BrandStatusDeleted'),
                        Constants.SUCCESS
                      )
                    } else {
                      Response.successResponseWithoutData(
                        res,
                        res.locals.__('BrandStatusDeactivated'),
                        Constants.SUCCESS
                      )
                    }
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
              return Response.successResponseWithoutData(
                res,
                res.locals.__('noSubAdminFound'),
                Constants.SUCCESS
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
      }
    })
  },

  /**
   * @description This function is use to get Brand detail
   * @param req
   * @param res
   */
  brandDetail: async (req, res) => {
    const requestParams = req.params
    if (requestParams.id === null) {
      Response.errorResponseData(
        res,
        res.__('invalidBrandId'),
        Constants.BAD_REQUEST
      )
    } else {
      await Brand.findOne({
        where: {
          id: requestParams.id,
          status: {
            [Op.ne]: [Constants.DELETE],
          },
        },
      })
        .then(async (result) => {
          if (result) {
            const brandImage =
              result.image && result.image !== '' ? result.image : ''
            result.image = Helper.mediaUrlForS3(
              Constants.BRAND_IMAGE,
              brandImage
            )

            const brandBannerImage =
              result.banner_image && result.banner_image !== ''
                ? result.banner_image
                : ''
            result.banner_image = Helper.mediaUrlForS3(
              Constants.BRAND_BANNER_IMAGE,
              brandBannerImage
            )

            const brandAppImage =
              result.app_image && result.app_image !== ''
                ? result.app_image
                : ''
            result.app_image = Helper.mediaUrlForS3(
              Constants.BRAND_APP_IMAGE,
              brandAppImage
            )

            return Response.successResponseData(
              res,
              new Transformer.Single(result, brandDetail).parse(),
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
   * @description This function is use to generate list of active Brand List
   * @returns {Promise<void>}
   * @param req
   * @param res
   */
  activeBrandList: async (req, res) => {
    await Brand.findAndCountAll({
      where: {
        status: Constants.ACTIVE,
      },
      order: [['updatedAt', 'DESC']],
    }).then((data) => {
      if (data.rows.length > 0) {
        const result = data.rows
        return Response.successResponseData(
          res,
          new Transformer.List(result, activeBrandList).parse(),
          Constants.SUCCESS,
          res.locals.__('success'),
          null
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
