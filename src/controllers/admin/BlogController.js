const Transformer = require('object-transformer')
const slugify = require('slugify')
const { Op } = require('sequelize')
const Helper = require('../../services/Helper')
const { Blog, BlogViewCount } = require('../../models')
const Constants = require('../../services/Constants')
const Response = require('../../services/Response')
const { blog, blogDetail } = require('../../transformers/admin/BlogTransformer')
const {
  addEditValidationForBlog,
  blogChangeStatusValidation,
} = require('../../services/AdminValidation')
const { BlogCategory } = require('../../models')

module.exports = {
  /**
   * @description 'This function is use to generate list of Blog'
   * @param req
   * @param res
   * @returns {Promise<void>}
   */
  blogList: async (req, res) => {
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
        [Op.or]: {
          title: {
            [Op.like]: `%${requestParams.search}%`,
          },
        },
      }
    }

    if (
      requestParams.filter_by_category &&
      requestParams.filter_by_category !== ''
    ) {
      query = {
        ...query,
        [Op.and]: {
          blog_category_id: requestParams.filter_by_category,
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

    await Blog.findAndCountAll({
      include: [
        {
          model: BlogCategory,
          attributes: ['title'],
          where: {
            status: Constants.ACTIVE,
          },
        },
        {
          model: BlogViewCount,
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
            result[key].blog_category_name = data.rows[key].BlogCategory.title
            const blogImage =
              result[key].image && result[key].image !== ''
                ? result[key].image
                : ''
            result[key].image = Helper.mediaUrlForS3(
              Constants.BLOG_IMAGE,
              blogImage
            )
            result[key].blog_view_count = result[key].BlogViewCounts.length
          }
        })
        const extra = []
        extra.per_page = limit
        extra.total = data.count
        extra.page = pageNo
        return Response.successResponseData(
          res,
          new Transformer.List(result, blog).parse(),
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
   * @description 'Blog add-edit function'
   * @param req
   * @param res
   */
  blogAddEdit: async (req, res) => {
    const requestParams = req.fields

    addEditValidationForBlog(requestParams, res, async (validate) => {
      if (validate) {
        let checkTitleExist
        if (requestParams.id) {
          checkTitleExist = Blog.findOne({
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
          checkTitleExist = Blog.findOne({
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
            return Response.successResponseWithoutData(
              res,
              res.__('BlogTitleAlreadyExist'),
              Constants.FAIL
            )
          } else {
            const BlogObj = {
              title: requestParams.title,
              description: requestParams.description,
              blog_category_id: requestParams.blog_category_id,
              author_name: requestParams.author_name,
              reading_minute: requestParams.reading_minute,
            }
            if (requestParams.id) {
              Blog.findOne({
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
                          return Response.successResponseData(
                            res,
                            {
                              id: result.id,
                            },
                            Constants.SUCCESS,
                            res.__('BlogUpdatedSuccessfully')
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
                      res.__('BlogNotExist'),
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
              // const uploadURL = await Helper.getUploadURL(
              //   requestParams.mimetype
              // )
              // BlogObj.image = uploadURL.uploadURL
              await Blog.create(BlogObj)
                .then(async (result) => {
                  if (result) {
                    Response.successResponseData(
                      res,
                      {
                        id: result.id,
                        // imgUrl: uploadURL,
                      },
                      Constants.SUCCESS,
                      res.__('BlogCreatedSuccessfully')
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
          return null
        })
      } else {
        Response.errorResponseData(
          res,
          res.__('error'),
          Constants.INTERNAL_SERVER
        )
      }
      return null
    })
  },

  /**
   * @description 'Change the status of blog'
   * @param req
   * @param res
   */
  blogUpdateStatus: async (req, res) => {
    const requestParams = req.fields
    blogChangeStatusValidation(requestParams, res, async (validate) => {
      if (validate) {
        await Blog.findOne({
          where: {
            id: requestParams.id,
          },
        })
          .then(async (blogData) => {
            if (blogData) {
              blogData.status = requestParams.status
              blogData
                .save()
                .then((result) => {
                  if (result) {
                    if (
                      parseInt(requestParams.status, 10) === Constants.ACTIVE
                    ) {
                      Response.successResponseWithoutData(
                        res,
                        res.locals.__('BlogStatusActivated'),
                        Constants.SUCCESS
                      )
                    } else if (
                      parseInt(requestParams.status, 10) === Constants.DELETE
                    ) {
                      Response.successResponseWithoutData(
                        res,
                        res.locals.__('BlogStatusDeleted'),
                        Constants.SUCCESS
                      )
                    } else {
                      Response.successResponseWithoutData(
                        res,
                        res.locals.__('BlogStatusDeactivated'),
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
                res.locals.__('noDataFound'),
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
   * @description check unique slug
   * @param slugName
   */

  checkUniqueSlug: async (slugName) => {
    let newSlug = slugName
    await Blog.findOne({
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
        await Blog.findOne({
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
   * @description 'get detail of blog'
   * @param req
   * @param res
   */
  blogDetail: async (req, res) => {
    const requestParams = req.params

    if (requestParams.id === null) {
      Response.errorResponseData(
        res,
        res.__('invalidBlogId'),
        Constants.BAD_REQUEST
      )
    } else {
      await Blog.findOne({
        include: [
          {
            model: BlogCategory,
            attributes: ['title'],
          },
          {
            model: BlogViewCount,
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
            /* eslint no-param-reassign: "error" */
            const blogImage =
              result.image && result.image !== '' ? result.image : ''
            result.image = Helper.mediaUrlForS3(Constants.BLOG_IMAGE, blogImage)
            result.category_name = result.BlogCategory.title
            result.blog_view_count = result.BlogViewCounts.length
            return Response.successResponseData(
              res,
              new Transformer.Single(result, blogDetail).parse(),
              Constants.SUCCESS,
              res.__('success')
            )
          } else {
            Response.successResponseWithoutData(
              res,
              res.locals.__('noDataFound'),
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
  },
}
