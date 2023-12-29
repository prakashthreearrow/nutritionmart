const Transformer = require('object-transformer')
const slugify = require('slugify')
const { Op } = require('sequelize')
const Response = require('../../services/Response')
const Constants = require('../../services/Constants')
const Helper = require('../../services/Helper')
const { BlogCategory, Blog } = require('../../models')
const {
  blogCategory,
  blogCategoryActive,
  blogCategoryDetail,
} = require('../../transformers/admin/BlogCategoryTransformer')
const {
  addEditValidationForBlogCategory,
  blogCategoryChangeStatusValidation,
} = require('../../services/AdminValidation')

module.exports = {
  /**
   * @description This function is use to generate list of blog category.
   * @param req
   * @param res
   */
  blogCategoryList: async (req, res) => {
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
        title: {
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

    await BlogCategory.findAndCountAll({
      where: query,
      order: sorting,
      offset: offset,
      limit: limit,
    }).then((data) => {
      if (data.rows.length > 0) {
        const result = data.rows
        const extra = []
        extra.per_page = limit
        extra.total = data.count
        extra.page = pageNo
        Response.successResponseData(
          res,
          new Transformer.List(result, blogCategory).parse(),
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
  },

  /**
   * @description This function is use to generate add and edit  of blog Category.
   * @param req
   * @param res
   */
  blogCategoryAddEdit: async (req, res) => {
    const requestParams = req.fields
    addEditValidationForBlogCategory(requestParams, res, async (validate) => {
      if (validate) {
        let checkTitleExist
        if (requestParams.id) {
          checkTitleExist = BlogCategory.findOne({
            where: {
              title: requestParams.title,
              id: {
                [Op.ne]: requestParams.id,
              },
              status: {
                [Op.ne]: Constants.DELETE,
              },
            },
          }).then()
        } else {
          checkTitleExist = BlogCategory.findOne({
            where: {
              title: requestParams.title,
              status: {
                [Op.ne]: Constants.DELETE,
              },
            },
          }).then()
        }
        await checkTitleExist.then(async (BlogData) => {
          if (BlogData) {
            Response.successResponseWithoutData(
              res,
              res.__('BlogCategoryTitleAlreadyExist'),
              Constants.FAIL
            )
          } else {
            const BlogObj = {
              title: requestParams.title,
              slug: requestParams.slug,
              status: requestParams.status,
            }

            if (requestParams.id) {
              BlogCategory.findOne({
                where: {
                  id: requestParams.id,
                  status: {
                    [Op.ne]: Constants.DELETE,
                  },
                },
              })
                .then(async (blogData) => {
                  if (blogData) {
                    await blogData
                      .update(BlogObj, {
                        where: {
                          id: requestParams.id,
                        },
                      })
                      .then(async (result) => {
                        if (result) {
                          Response.successResponseWithoutData(
                            res,
                            res.__('blogCategoryUpdatedSuccessfully'),
                            Constants.SUCCESS
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
                    Response.successResponseWithoutData(
                      res,
                      res.__('BlogCategoryNotExist'),
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
              const slug = slugify(requestParams.title, {
                replacement: '-',
                remove: /[*+~.()'"!:@]/gi,
                lower: true,
                strict: true,
              })

              BlogObj.slug = await module.exports.checkUniqueSlug(slug)

              await BlogCategory.create(BlogObj)
                .then(async (result) => {
                  if (result) {
                    Response.successResponseWithoutData(
                      res,
                      res.__('blogCategoryCreatedSuccessfully'),
                      Constants.SUCCESS
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
      }
    })
  },

  /**
   * @description This function is use to generate unique slug of blog Category.
   * @param slugName
   */
  checkUniqueSlug: async (slugName) => {
    let newSlug = slugName
    await BlogCategory.findOne({
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
        await BlogCategory.findOne({
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
   * @description This function is use to generate update status of blog Category.
   * @param req
   * @param res
   */
  blogCategoryUpdateStatus: async (req, res) => {
    const requestParams = req.fields
    blogCategoryChangeStatusValidation(requestParams, res, async (validate) => {
      if (validate) {
        await BlogCategory.findOne({
          where: {
            id: requestParams.id,
          },
        })
          .then(async (blogCateData) => {
            if (blogCateData) {
              /* eslint no-param-reassign: "error" */
              blogCateData.status = requestParams.status
              await blogCateData
                .save()
                .then(async (result) => {
                  if (result) {
                    if (
                      parseInt(requestParams.status, 10) === Constants.ACTIVE
                    ) {
                      return Response.successResponseWithoutData(
                        res,
                        res.locals.__('BlogCategoryStatusActivated'),
                        Constants.SUCCESS
                      )
                    } else if (
                      parseInt(requestParams.status, 10) === Constants.DELETE
                    ) {
                      await Blog.update(
                        {
                          status: Constants.DELETE,
                        },
                        {
                          where: {
                            blog_category_id: requestParams.id,
                          },
                        }
                      )
                      return Response.successResponseWithoutData(
                        res,
                        res.locals.__('BlogCategoryStatusDeleted'),
                        Constants.SUCCESS
                      )
                    } else {
                      return Response.successResponseWithoutData(
                        res,
                        res.locals.__('BlogCategoryStatusDeactivated'),
                        Constants.SUCCESS
                      )
                    }
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
              return Response.successResponseWithoutData(
                res,
                res.locals.__('noDataFound'),
                Constants.SUCCESS
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
      }
    })
  },

  /**
   * @description This function is use to fetch active blog Category.
   * @param req
   * @param res
   */
  activeBlogCategoryList: (req, res) => {
    BlogCategory.findAll({
      where: {
        status: Constants.ACTIVE,
      },
      order: [['title', 'ASC']],
    }).then(async (result) => {
      if (result.length > 0) {
        return Response.successResponseData(
          res,
          new Transformer.List(result, blogCategoryActive).parse(),
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
   * @description 'get detail of blog-category'
   * @param req
   * @param res
   */
  blogCategoryDetail: async (req, res) => {
    const requestParams = req.params

    if (requestParams.id === null) {
      Response.errorResponseData(
        res,
        res.__('invalidBlogCategoryId'),
        Constants.BAD_REQUEST
      )
    } else {
      await BlogCategory.findOne({
        where: {
          id: requestParams.id,
        },
      })
        .then(async (result) => {
          if (result) {
            return Response.successResponseData(
              res,
              new Transformer.Single(result, blogCategoryDetail).parse(),
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
          Response.errorResponseData(
            res,
            res.__('internalError'),
            Constants.INTERNAL_SERVER
          )
        })
    }
  },
}
