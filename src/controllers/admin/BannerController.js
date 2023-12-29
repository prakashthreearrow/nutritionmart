const { Op } = require('sequelize')
const Transformer = require('object-transformer')
const Response = require('../../services/Response')
const { banner } = require('../../models')
const {
  DELETE,
  SUCCESS,
  FAIL,
  ACTIVE,
  PER_PAGE,
  INTERNAL_SERVER,
  INACTIVE,
  BAD_REQUEST,
  BANNER_IMAGE,
  BANNER_APP_IMAGE,
  BANNER_RESPONSIVE_IMAGE,
} = require('../../services/Constants')
const { bannerlist } = require('../../transformers/admin/BannerTransformer')
const {
  addEditValidationForBanner,
  bannerChangeStatusValidation,
} = require('../../services/AdminValidation')
const Helper = require('../../services/Helper')

module.exports = {
  /**
   * @description "This function is use to generate list of faq."
   * @param req
   * @param res
   */
  bannersList: async (req, res) => {
    const requestParams = req.query
    let search = false
    const limit =
      requestParams.per_page && requestParams.per_page > 0
        ? parseInt(requestParams.per_page, 10)
        : PER_PAGE
    const pageNo =
      requestParams.page && requestParams.page > 0
        ? parseInt(requestParams.page, 10)
        : 1
    const offset = (pageNo - 1) * limit
    let query
    query = {
      status: {
        [Op.in]: [ACTIVE, INACTIVE],
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
      if (requestParams.order_by === 'title') {
        requestParams.order_by = 'title'
      }
      sorting = [
        [
          requestParams.order_by,
          requestParams.direction ? requestParams.direction : 'DESC',
        ],
      ]
    }

    await banner
      .findAndCountAll({
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
              const bannerImage =
                result[key].image && result[key].image !== ''
                  ? result[key].image
                  : ''
              result[key].image = Helper.mediaUrlForS3(
                BANNER_IMAGE,
                bannerImage
              )

              const bannerAppImage =
                result[key].app_image && result[key].app_image !== ''
                  ? result[key].app_image
                  : ''
              result[key].app_image = Helper.mediaUrlForS3(
                BANNER_APP_IMAGE,
                bannerAppImage
              )

              const bannerResponsiveImage =
                result[key].responsive_image &&
                result[key].responsive_image !== ''
                  ? result[key].responsive_image
                  : ''
              result[key].responsive_image = Helper.mediaUrlForS3(
                BANNER_RESPONSIVE_IMAGE,
                bannerResponsiveImage
              )
            }
          })

          const extra = []
          extra.per_page = limit
          extra.total = data.count
          extra.page = pageNo
          return Response.successResponseData(
            res,
            new Transformer.List(result, bannerlist).parse(),
            SUCCESS,
            res.locals.__('success'),
            extra
          )
        } else {
          return Response.successResponseData(
            res,
            [],
            SUCCESS,
            res.locals.__('noDataFound')
          )
        }
      })
  },
  /**
   * @description Banner add-edit function
   * @param req
   * @param res
   */
  bannerAddEdit: async (req, res) => {
    const requestParams = req.fields
    addEditValidationForBanner(requestParams, res, async (validate) => {
      if (validate) {
        const bannerObj = {
          title: requestParams.title,
          status: requestParams.status,
          link: requestParams.link,
          sequence_number: requestParams.sequence_number,
          display_location: requestParams.display_location,
        }
        if (requestParams.id) {
          banner
            .findOne({
              where: {
                id: requestParams.id,
                status: {
                  [Op.ne]: DELETE,
                },
              },
            })
            .then(async (bannerData) => {
              if (bannerData) {
                await bannerData
                  .update(bannerObj, {
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
                        SUCCESS,
                        res.__('bannerUpdatedSuccessfully')
                      )
                    }
                    return null
                  })
                  .catch(() => {
                    Response.errorResponseData(
                      res,
                      res.__('internalError'),
                      INTERNAL_SERVER
                    )
                  })
              } else {
                Response.successResponseWithoutData(
                  res,
                  res.__('bannerNotExits'),
                  FAIL
                )
              }
            })
            .catch(() => {
              Response.errorResponseData(
                res,
                res.__('internalError'),
                INTERNAL_SERVER
              )
            })
        } else {
          banner
            .create(bannerObj)
            .then(async (result) => {
              if (result) {
                return Response.successResponseData(
                  res,
                  {
                    id: result.id,
                  },
                  SUCCESS,
                  res.__('bannerCreatedSuccessfully')
                )
              }
              return null
            })
            .catch(async () => {
              Response.errorResponseData(
                res,
                res.__('internalError'),
                INTERNAL_SERVER
              )
            })
        }
      }
      return null
    })
  },
  /**
   * @description This function is use to get banner detail
   * @param req
   * @param res
   */
  bannerDetail: async (req, res) => {
    const requestParams = req.params
    if (requestParams.id === null) {
      Response.errorResponseData(res, res.__('invalidBannerId'), BAD_REQUEST)
    } else {
      await banner
        .findOne({
          where: {
            id: requestParams.id,
            status: {
              [Op.in]: [ACTIVE, INACTIVE],
            },
          },
        })
        .then(async (result) => {
          if (result) {
            /* eslint no-param-reassign: "error" */
            const bannerImage =
              result.image && result.image !== '' ? result.image : ''
            result.image = Helper.mediaUrlForS3(BANNER_IMAGE, bannerImage)

            const bannerAppImage =
              result.app_image && result.app_image !== ''
                ? result.app_image
                : ''
            result.app_image = Helper.mediaUrlForS3(
              BANNER_APP_IMAGE,
              bannerAppImage
            )

            const bannerResponsiveImage =
              result.responsive_image && result.responsive_image !== ''
                ? result.responsive_image
                : ''
            result.responsive_image = Helper.mediaUrlForS3(
              BANNER_RESPONSIVE_IMAGE,
              bannerResponsiveImage
            )
            return Response.successResponseData(
              res,
              new Transformer.Single(result, bannerlist).parse(),
              SUCCESS,
              res.locals.__('success'),
              null
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
          Response.errorResponseData(
            res,
            res.__('internalError'),
            INTERNAL_SERVER
          )
        })
    }
  },
  /**
   * @description 'Change the status of banner'
   * @param req
   * @param res
   */
  bannerUpdateStatus: async (req, res) => {
    const requestParams = req.fields
    bannerChangeStatusValidation(requestParams, res, async (validate) => {
      if (validate) {
        await banner
          .findOne({
            where: {
              id: requestParams.id,
            },
          })
          .then(async (bannerData) => {
            if (bannerData) {
              bannerData.status = requestParams.status
              bannerData
                .save()
                .then((result) => {
                  if (result) {
                    if (parseInt(requestParams.status, 10) === ACTIVE) {
                      Response.successResponseWithoutData(
                        res,
                        res.locals.__('bannerStatusActivated'),
                        SUCCESS
                      )
                    } else if (parseInt(requestParams.status, 10) === DELETE) {
                      Response.successResponseWithoutData(
                        res,
                        res.locals.__('bannerDeleted'),
                        SUCCESS
                      )
                    } else {
                      Response.successResponseWithoutData(
                        res,
                        res.locals.__('bannerStatusDeactivated'),
                        SUCCESS
                      )
                    }
                  }
                })
                .catch(() => {
                  Response.errorResponseData(
                    res,
                    res.__('internalError'),
                    INTERNAL_SERVER
                  )
                })
            } else {
              return Response.successResponseWithoutData(
                res,
                res.locals.__('noDataFound'),
                SUCCESS
              )
            }
            return null
          })
          .catch(() => {
            Response.errorResponseData(
              res,
              res.__('internalError'),
              INTERNAL_SERVER
            )
          })
      }
    })
  },
}
