const Transformer = require('object-transformer')
const slugify = require('slugify')
const { Op } = require('sequelize')
const Helper = require('../../services/Helper')
const Constants = require('../../services/Constants')
const Response = require('../../services/Response')
const {
  category,
  categoryDetails,
  activeCategoryList,
  activeSubCategoryList,
  subcategory,
} = require('../../transformers/admin/CategoryTransformer')
const {
  addEditValidationForCategory,
  categoryChangeStatusValidation,
} = require('../../services/AdminValidation')
const { Category, Product } = require('../../models')

module.exports = {
  /**
   * @description This function is use to generate list of Category.
   * @param req
   * @param res
   */
  categoryList: async (req, res) => {
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
      parent_id: Constants.ONLY_CATEGORY,
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

    await Category.findAndCountAll({
      include: [
        {
          model: Category,
          attributes: ['id', 'name', 'status'],
          status: {
            [Op.ne]: [Constants.DELETE],
          },
        },
        {
          model: Product,
          required: false,
          where: {
            status: {
              [Op.in]: [Constants.ACTIVE],
            },
          },
        },
      ],
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
            result[key].sub_category = data.rows[key].Categories
            result[key].sub_category_count = data.rows[key].Categories.length

            const subCatArr = []
            Object.keys(data.rows[key].Categories).forEach((subKey) => {
              if ({}.hasOwnProperty.call(data.rows[key].Categories, subKey)) {
                if (
                  data.rows[key].Categories[subKey].status === Constants.ACTIVE
                ) {
                  subCatArr.push(data.rows[key].Categories[subKey].id)
                  result[key].sub_category_ids = subCatArr.join(',')
                }
              }
            })

            result[key].image = Helper.mediaUrlForS3(
              Constants.CATEGORY_ICON_IMAGE,
              result[key].icon_image
            )

            const categoryAppImage =
              result[key].app_image && result[key].app_image !== ''
                ? result[key].app_image
                : ''
            result[key].app_image = Helper.mediaUrlForS3(
              Constants.CATEGORY_APP_IMAGE,
              categoryAppImage
            )

            const categoryWebImage =
              result[key].web_image && result[key].web_image !== ''
                ? result[key].web_image
                : ''
            result[key].web_image = Helper.mediaUrlForS3(
              Constants.CATEGORY_WEB_IMAGE,
              categoryWebImage
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
          new Transformer.List(result, category).parse(),
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
   * @description This function is add/edit category.
   * @param req
   * @param res
   */
  categoryAddEdit: async (req, res) => {
    const requestParams = req.fields
    addEditValidationForCategory(requestParams, res, async (validate) => {
      if (validate) {
        let checkNameExist
        if (requestParams.id) {
          checkNameExist = Category.findOne({
            where: {
              name: requestParams.name,
              id: {
                [Op.ne]: requestParams.id,
              },
              status: {
                [Op.ne]: [Constants.DELETE],
              },
            },
          }).then()
        } else {
          checkNameExist = Category.findOne({
            where: {
              name: requestParams.name,
              status: {
                [Op.ne]: [Constants.DELETE],
              },
            },
          }).then()
        }

        await checkNameExist.then(async (categoryData) => {
          if (categoryData) {
            if (requestParams.parent_id) {
              Response.successResponseWithoutData(
                res,
                res.__('CategoryNameAlreadyExist'),
                Constants.FAIL
              )
            } else {
              Response.successResponseWithoutData(
                res,
                res.__('SubCategoryNameAlreadyExist'),
                Constants.FAIL
              )
            }
          } else {
            const categoryObj = {
              name: requestParams.name,
              parent_id: requestParams.parent_id,
              description: requestParams.description,
              status: requestParams.status,
            }
            if (requestParams.id) {
              Category.findOne({
                where: {
                  id: requestParams.id,
                  status: {
                    [Op.ne]: Constants.DELETE,
                  },
                },
              })
                .then(async (categoryInfo) => {
                  if (categoryInfo) {
                    await categoryInfo
                      .update(categoryObj, {
                        where: {
                          id: requestParams.id,
                        },
                      })
                      .then(async (result) => {
                        if (result) {
                          if (requestParams.parent_id) {
                            return Response.successResponseData(
                              res,
                              {
                                id: result.id,
                              },
                              Constants.SUCCESS,
                              res.__('subCategoryUpdatedSuccessfully')
                            )
                          } else {
                            return Response.successResponseData(
                              res,
                              {
                                id: result.id,
                              },
                              Constants.SUCCESS,
                              res.__('categoryUpdatedSuccessfully')
                            )
                          }
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
                      res.__('CategoryNotExist'),
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

              categoryObj.slug = await module.exports.checkUniqueSlug(slug)

              Category.create(categoryObj)
                .then(async (result) => {
                  if (result) {
                    if (requestParams.parent_id) {
                      return Response.successResponseData(
                        res,
                        {
                          id: result.id,
                        },
                        Constants.SUCCESS,
                        res.__('subCategoryCreatedSuccessfully')
                      )
                    } else {
                      return Response.successResponseData(
                        res,
                        {
                          id: result.id,
                        },
                        Constants.SUCCESS,
                        res.__('categoryCreatedSuccessfully')
                      )
                    }
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
   * @description change the status of category
   * @param req
   * @param res
   */

  categoryUpdateStatus: async (req, res) => {
    const requestParams = req.fields
    categoryChangeStatusValidation(requestParams, res, async (validate) => {
      if (validate) {
        await Category.findOne({
          where: {
            id: requestParams.id,
          },
        })
          .then(async (categoryData) => {
            if (categoryData) {
              categoryData.status = requestParams.status
              categoryData
                .save()
                .then((result) => {
                  if (result) {
                    if (
                      parseInt(requestParams.status, 10) === Constants.ACTIVE
                    ) {
                      Response.successResponseWithoutData(
                        res,
                        res.locals.__('CategoryStatusActivated'),
                        Constants.SUCCESS
                      )
                    } else if (
                      parseInt(requestParams.status, 10) === Constants.DELETE
                    ) {
                      Response.successResponseWithoutData(
                        res,
                        res.locals.__('CategoryStatusDeleted'),
                        Constants.SUCCESS
                      )
                    } else {
                      Response.successResponseWithoutData(
                        res,
                        res.locals.__('CategoryStatusDeactivated'),
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
    })
  },
  /**
   * @description check unique slug
   * @param slugName
   */

  checkUniqueSlug: async (slugName) => {
    let newSlug = slugName
    await Category.findOne({
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
        await Category.findOne({
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
   * @description This function is use to generate list of Sub Category.
   * @param req
   * @param res
   */
  subCategoryList: async (req, res) => {
    const requestParams = req.query
    const search = false
    if (requestParams.parent_id) {
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
          [Op.in]: [Constants.ACTIVE, Constants.INACTIVE],
        },
        parent_id: requestParams.parent_id,
      }

      if (requestParams.search && requestParams.search !== '') {
        query = {
          name: {
            [Op.like]: `%${requestParams.search}%`,
          },
        }
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

      let sorting = [['updatedAt', 'DESC']]

      if (requestParams.order_by && requestParams.order_by !== '') {
        sorting = [
          [
            requestParams.order_by,
            requestParams.direction ? requestParams.direction : 'DESC',
          ],
        ]
      }

      await Category.findAndCountAll({
        include: {
          model: Product,
          as: 'subCategoryProducts',
          required: false,
          where: {
            status: {
              [Op.in]: [Constants.ACTIVE],
            },
          },
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
              const categoryIconImage =
                result[key].icon_image && result[key].icon_image !== ''
                  ? result[key].icon_image
                  : ''
              result[key].icon_image = Helper.mediaUrlForS3(
                Constants.CATEGORY_ICON_IMAGE,
                categoryIconImage
              )

              const categoryAppImage =
                result[key].app_image && result[key].app_image !== ''
                  ? result[key].app_image
                  : ''
              result[key].app_image = Helper.mediaUrlForS3(
                Constants.CATEGORY_APP_IMAGE,
                categoryAppImage
              )

              const categoryWebImage =
                result[key].web_image && result[key].web_image !== ''
                  ? result[key].web_image
                  : ''
              result[key].web_image = Helper.mediaUrlForS3(
                Constants.CATEGORY_WEB_IMAGE,
                categoryWebImage
              )

              result[key].products_count =
                result[key].subCategoryProducts.length
            }
          })

          const extra = []
          extra.per_page = limit
          extra.total = data.count
          extra.page = pageNo
          Response.successResponseData(
            res,
            new Transformer.List(result, subcategory).parse(),
            Constants.SUCCESS,
            res.locals.__('success'),
            extra
          )
        } else {
          Response.successResponseData(
            res,
            [],
            Constants.SUCCESS,
            res.locals.__('noDataFound')
          )
        }
      })
    } else {
      Response.successResponseData(
        res,
        [],
        Constants.FAIL,
        res.locals.__('noCategoryID')
      )
    }
  },

  /**
   * @description get detail of category
   * @param req
   * @param res
   */
  categoryDetail: async (req, res) => {
    const requestParams = req.params
    if (requestParams.id === null) {
      Response.errorResponseData(
        res,
        res.__('invalidCategoryId'),
        Constants.BAD_REQUEST
      )
    } else {
      await Category.findOne({
        include: [
          {
            model: Category,
            attributes: ['id', 'name'],
            status: {
              [Op.ne]: [Constants.DELETE],
            },
          },
        ],
        where: {
          id: requestParams.id,
          status: {
            [Op.ne]: [Constants.DELETE],
          },
        },
      })
        .then(async (result) => {
          if (result) {
            if (!result.parent_id) {
              /* eslint no-param-reassign: "error" */
              result.sub_category = result.Categories
              result.sub_category_count = result.Categories.length
            }

            result.image = Helper.mediaUrlForS3(
              Constants.CATEGORY_ICON_IMAGE,
              result.icon_image
            )

            const categoryAppImage =
              result.app_image && result.app_image !== ''
                ? result.app_image
                : ''
            result.app_image = Helper.mediaUrlForS3(
              Constants.CATEGORY_APP_IMAGE,
              categoryAppImage
            )

            const categoryWebImage =
              result.web_image && result.web_image !== ''
                ? result.web_image
                : ''
            result.web_image = Helper.mediaUrlForS3(
              Constants.CATEGORY_WEB_IMAGE,
              categoryWebImage
            )

            const categoryIconImage =
              result.icon_image && result.icon_image !== ''
                ? result.icon_image
                : ''
            result.icon_image = Helper.mediaUrlForS3(
              Constants.CATEGORY_ICON_IMAGE,
              categoryIconImage
            )

            return Response.successResponseData(
              res,
              new Transformer.Single(result, categoryDetails).parse(),
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
   * @description get activeCategoryList of category
   * @param req
   * @param res
   */
  activeCategoryList: (req, res) => {
    Category.findAll({
      include: [
        {
          model: Category,
          attributes: ['id', 'name', 'status'],
        },
      ],
      where: {
        status: Constants.ACTIVE,
        parent_id: Constants.ONLY_CATEGORY,
      },
      order: [['updatedAt', 'DESC']],
    }).then(async (result) => {
      Object.keys(result).forEach((key) => {
        result[key].sub_category = result[key].Categories
      })
      return Response.successResponseData(
        res,
        new Transformer.List(result, activeCategoryList).parse(),
        Constants.SUCCESS,
        res.locals.__('success'),
        null
      )
    })
  },

  /**
   * @description get activeCategoryList of category
   * @param req
   * @param res
   */
  activeSubCategoryList: (req, res) => {
    Category.findAll({
      where: {
        status: Constants.ACTIVE,
        parent_id: {
          [Op.ne]: Constants.ONLY_CATEGORY,
        },
      },
      order: [['updatedAt', 'DESC']],
    }).then(async (result) => {
      Object.keys(result).forEach((key) => {
        result[key].sub_category = result[key].Categories
      })
      return Response.successResponseData(
        res,
        new Transformer.List(result, activeSubCategoryList).parse(),
        Constants.SUCCESS,
        res.locals.__('success'),
        null
      )
    })
  },

  /**
   * @description get active sub Category List of category by parent-id
   * @param req
   * @param res
   */
  activeSubCategoryListFromParentID: (req, res) => {
    const requestParams = req.fields
    if (requestParams.parent_id) {
      const parentIds = requestParams.parent_id.split(',')
      Category.findAll({
        where: {
          status: Constants.ACTIVE,
          parent_id: {
            [Op.in]: parentIds,
          },
        },
        order: [['updatedAt', 'DESC']],
      }).then(async (result) => {
        Object.keys(result).forEach((key) => {
          result[key].sub_category = result[key].Categories
        })
        return Response.successResponseData(
          res,
          new Transformer.List(result, activeSubCategoryList).parse(),
          Constants.SUCCESS,
          res.locals.__('success'),
          null
        )
      })
    } else {
      return Response.errorResponseData(
        res,
        res.__('invalidCategoryId'),
        Constants.BAD_REQUEST
      )
    }
    return null
  },
}
