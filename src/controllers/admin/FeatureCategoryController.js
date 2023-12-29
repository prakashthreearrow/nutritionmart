const Transformer = require('object-transformer')
const { Op } = require('sequelize')
const slugify = require('slugify')
const Response = require('../../services/Response')
const Constants = require('../../services/Constants')
const {
  FeatureCategoryProduct,
  Product,
  FeatureCategory,
} = require('../../models')
const {
  featureProduct,
  featuredCategoryDetail,
  featuredCategoryList,
} = require('../../transformers/admin/FeatureProductTransformer')
const Helper = require('../../services/Helper')
const {
  addEditValidationForFeaturedCategory,
  featuredCategoryChangeStatusValidation,
} = require('../../services/AdminValidation')

module.exports = {
  /**
   * @description "This function is use to generate list of feature product."
   * @param req
   * @param res
   */
  featureProducts: async (req, res) => {
    const requestParams = req.query
    let query = {
      status: Constants.ACTIVE,
    }
    let dateQuery = {}
    let mainQuery = {
      status: {
        [Op.in]: [Constants.ACTIVE, Constants.INACTIVE],
      },
    }
    if (
      requestParams.filter_by_category &&
      requestParams.filter_by_category !== ''
    ) {
      mainQuery = {
        ...mainQuery,
        feature_category_id: requestParams.filter_by_category,
      }
    }
    if (
      requestParams.filter_by_status &&
      requestParams.filter_by_status !== ''
    ) {
      mainQuery = {
        ...mainQuery,
        status: requestParams.filter_by_status,
      }
    }
    if (requestParams.search && requestParams.search !== '') {
      query = {
        name: {
          [Op.like]: `%${requestParams.search}%`,
        },
      }
    }

    if (
      requestParams.start_date &&
      requestParams.start_date !== '' &&
      requestParams.end_date &&
      requestParams.end_date !== ''
    ) {
      const startDate = requestParams.start_date
      const endDate = requestParams.end_date

      dateQuery = {
        start_date: {
          [Op.between]: [startDate, endDate],
        },
        end_date: {
          [Op.between]: [startDate, endDate],
        },
      }
    }
    FeatureCategoryProduct.findAndCountAll({
      include: [
        {
          model: Product,
          attributes: ['id', 'name', 'display_image'],
          where: query,
        },
        {
          model: FeatureCategory,
          attributes: ['start_date', 'end_date', 'name'],
          where: dateQuery,
        },
      ],
      where: mainQuery,
      order: [['sort_order', 'ASC']],
    })
      .then(async (data) => {
        if (data.rows && data.rows.length > 0) {
          const result = data.rows

          for (let i = 0; i < result.length; i++) {
            if (result[i]) {
              result[i].product_name = result[i].Product.name
              const productDisplayImage = await Helper.getProductDisplayImage(
                result[i].product_id
              )
              if (productDisplayImage) {
                result[i].product_image = await Helper.mediaUrlForS3(
                  Constants.PRODUCT_STOCKS_DETAIL_IMAGE,
                  productDisplayImage
                )
              } else {
                result[i].product_image = ''
              }

              result[i].start_date = result[i].FeatureCategory.start_date
              result[i].end_date = result[i].FeatureCategory.end_date
              result[i].name = result[i].FeatureCategory.name
            }
          }

          const extra = []
          return Response.successResponseData(
            res,
            new Transformer.List(result, featureProduct).parse(),
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
      .catch((e) => {
        Response.errorResponseData(
          res,
          res.__('internalError'),
          Constants.INTERNAL_SERVER
        )
      })
  },

  /**
   * @description delete featured category product
   * @param req
   * @param res
   */
  deleteFeaturedProduct: async (req, res) => {
    const requestParams = req.params
    if (requestParams.id === null) {
      Response.errorResponseData(
        res,
        res.__('invalidFeaturedProductId'),
        Constants.BAD_REQUEST
      )
    } else {
      await FeatureCategoryProduct.findOne({
        where: {
          id: requestParams.id,
        },
      })
        .then(async (featuredCategoryData) => {
          featuredCategoryData
            .update(
              { status: Constants.DELETE },
              { where: { id: requestParams.id } }
            )
            .then(async (result) => {
              if (result) {
                return Response.successResponseWithoutData(
                  res,
                  res.locals.__('featuresCategoryDeleted'),
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
   * @description 'FeaturedCategories add-edit function'
   * @param req
   * @param res
   */
  featuredCategoryAddEdit: async (req, res) => {
    const requestParams = req.fields
    addEditValidationForFeaturedCategory(
      requestParams,
      res,
      async (validate) => {
        if (validate) {
          let checkNameExist
          if (requestParams.id) {
            checkNameExist = FeatureCategory.findOne({
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
            checkNameExist = FeatureCategory.findOne({
              where: {
                name: requestParams.name,
                status: {
                  [Op.ne]: Constants.DELETE,
                },
              },
            }).then()
          }
          await checkNameExist.then(async (featuredCategoryData) => {
            if (featuredCategoryData) {
              Response.successResponseWithoutData(
                res,
                res.__('FeaturedCategoryNameAlreadyExist'),
                Constants.FAIL
              )
            } else {
              const FeatureCategoryObj = {
                name: requestParams.name,
                start_date: requestParams.start_date,
                end_date: requestParams.end_date,
                status: requestParams.status,
              }

              if (requestParams.id) {
                FeatureCategory.findOne({
                  where: {
                    id: requestParams.id,
                    status: {
                      [Op.ne]: Constants.DELETE,
                    },
                  },
                })
                  .then(async (featuredCategoryInfo) => {
                    if (featuredCategoryInfo) {
                      await featuredCategoryInfo
                        .update(FeatureCategoryObj, {
                          where: {
                            id: requestParams.id,
                          },
                        })
                        .then(async (result) => {
                          if (result) {
                            const productIds = requestParams.product_ids
                            const pidArr = productIds.split(',')
                            const moduleArr = []
                            pidArr.forEach((pid) => {
                              moduleArr.push({
                                product_id: pid,
                                feature_category_id: result.id,
                                status: Constants.ACTIVE,
                              })
                            })
                            await FeatureCategoryProduct.destroy({
                              where: {
                                feature_category_id: result.id,
                              },
                            })
                            await FeatureCategoryProduct.bulkCreate(
                              moduleArr
                            ).then(async (data) => {
                              if (data) {
                                return Response.successResponseData(
                                  res,
                                  {
                                    id: result.id,
                                  },
                                  Constants.SUCCESS,
                                  res.__('FeaturedCategoryUpdatedSuccessfully')
                                )
                              }
                            })
                            return null
                          }
                        })
                        .catch(() => {
                          return Response.errorResponseData(
                            res,
                            res.__('internalError'),
                            Constants.INTERNAL_SERVER
                          )
                        })
                    } else {
                      return Response.successResponseWithoutData(
                        res,
                        res.__('FeatureCategoryNotExist'),
                        Constants.FAIL
                      )
                    }
                    return null
                  })
                  .catch(() => {
                    return Response.errorResponseData(
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

                FeatureCategoryObj.slug = await module.exports.checkUniqueSlug(
                  slug
                )

                await FeatureCategory.create(FeatureCategoryObj)
                  .then(async (result) => {
                    if (result) {
                      const productIds = requestParams.product_ids
                      const pidArr = productIds.split(',')
                      const moduleArr = []
                      pidArr.forEach((pid) => {
                        moduleArr.push({
                          product_id: pid,
                          feature_category_id: result.id,
                          status: Constants.ACTIVE,
                        })
                      })
                      await FeatureCategoryProduct.bulkCreate(moduleArr).then(
                        async (data) => {
                          if (data) {
                            Response.successResponseData(
                              res,
                              {
                                id: result.id,
                              },
                              Constants.SUCCESS,
                              res.__('FeatureCategoryCreatedSuccessfully')
                            )
                          }
                        }
                      )
                    }
                  })
                  .catch(async (e) => {
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
      }
    )
  },

  /**
   * @description check unique slug
   * @param slugName
   */
  checkUniqueSlug: async (slugName) => {
    let newSlug = slugName
    await FeatureCategory.findOne({
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
        await FeatureCategory.findOne({
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
   * @description 'get list of featured-categories'
   * @param req
   * @param res
   */
  featuredCategoryList: async (req, res) => {
    await FeatureCategory.findAll({
      where: {
        status: {
          [Op.ne]: [Constants.DELETE],
        },
      },
    })
      .then(async (result) => {
        if (result && result.length > 0) {
          Object.keys(result).forEach((key) => {
            if (result[key].slug === 'limited-time-offers') {
              result[key].type = 0
            } else {
              result[key].type = 1
            }
          })

          return Response.successResponseData(
            res,
            new Transformer.List(result, featuredCategoryList).parse(),
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
      .catch(() => {
        return Response.errorResponseData(
          res,
          res.__('internalError'),
          Constants.INTERNAL_SERVER
        )
      })
  },

  /**
   * @description 'get detail of featured-categories'
   * @param req
   * @param res
   */
  featuredCategoryDetail: async (req, res) => {
    const requestParams = req.params
    if (requestParams.id === null) {
      Response.errorResponseData(
        res,
        res.__('FeaturedCategoryIdRequired'),
        Constants.BAD_REQUEST
      )
    } else {
      await FeatureCategory.findOne({
        include: {
          model: FeatureCategoryProduct,
          attributes: ['id', 'product_id'],
          where: {
            status: Constants.ACTIVE,
          },
          required: false,
          include: {
            model: Product,
            attributes: ['id', 'name'],
            where: {
              status: Constants.ACTIVE,
            },
            required: false,
          },
        },
        where: {
          id: requestParams.id,
          status: {
            [Op.ne]: [Constants.DELETE],
          },
        },
      })
        .then(async (result) => {
          if (result) {
            /* eslint no-param-reassign: "error" */
            const image =
              result.image && result.image !== '' ? result.image : ''
            result.image = Helper.mediaUrlForS3(
              Constants.FEATURED_CATEGORIES_IMAGE,
              image
            )
            if (result.slug === 'limited-time-offers') {
              result.type = 0
            } else {
              result.type = 1
            }
            result.featured_products = result.FeatureCategoryProducts
              ? result.FeatureCategoryProducts
              : ''
            return Response.successResponseData(
              res,
              new Transformer.Single(result, featuredCategoryDetail).parse(),
              Constants.SUCCESS,
              res.__('success')
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
          return Response.errorResponseData(
            res,
            res.__('internalError'),
            Constants.INTERNAL_SERVER
          )
        })
    }
  },

  /**
   * @description 'change status of featured-categories'
   * @param req
   * @param res
   */
  featuredCategoryUpdateStatus: async (req, res) => {
    const requestParams = req.fields
    featuredCategoryChangeStatusValidation(
      requestParams,
      res,
      async (validate) => {
        if (validate) {
          await FeatureCategory.findOne({
            where: {
              id: requestParams.id,
            },
          })
            .then(async (featureCategoryData) => {
              if (featureCategoryData) {
                featureCategoryData.status = requestParams.status
                featureCategoryData
                  .save()
                  .then((result) => {
                    if (result) {
                      if (
                        parseInt(requestParams.status, 10) === Constants.ACTIVE
                      ) {
                        Response.successResponseWithoutData(
                          res,
                          res.locals.__('FeaturedCategoryStatusActivated'),
                          Constants.SUCCESS
                        )
                      } else {
                        Response.successResponseWithoutData(
                          res,
                          res.locals.__('FeaturedCategoryStatusDeactivated'),
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
                  res.locals.__('noCategoryFound'),
                  Constants.FAIL
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
      }
    )
  },

  /**
   * @description 'Arrange Featured product'
   * @param req
   * @param res
   */
  updateFeaturedProductSequence: async (req, res) => {
    const requestParams = req.body

    const { sequence } = requestParams
    Object.keys(sequence).forEach((key) => {
      if ({}.hasOwnProperty.call(sequence, key)) {
        FeatureCategoryProduct.update(
          {
            sort_order: sequence[key].sort_order,
          },
          {
            where: {
              id: sequence[key].id,
            },
          }
        )
      }
    })
    Response.successResponseWithoutData(
      res,
      res.locals.__('FeaturedCategorySeqChangedSuccess'),
      Constants.SUCCESS
    )
  },
}
