const Transformer = require('object-transformer')
const Response = require('../../../services/Response')
const { banner } = require('../../../models')
const {
  SUCCESS,
  ACTIVE,
  PER_PAGE,
  BANNER_IMAGE,
  BANNER_APP_IMAGE,
  BANNER_RESPONSIVE_IMAGE,
} = require('../../../services/Constants')
const {
  bannerList,
  bannerWithOutId,
} = require('../../../transformers/api/BannerTransformer')
const helper = require('../../../services/Helper')
const Constants = require('../../../services/Constants')

module.exports = {
  /**
   * @description "Banner list"
   * @param req
   * @param res
   */
  bannersList: async (req, res) => {
    const requestParams = req.body
    const limit =
      requestParams.per_page && requestParams.per_page > 0
        ? parseInt(requestParams.per_page, 10)
        : PER_PAGE
    const pageNo =
      requestParams.page && requestParams.page > 0
        ? parseInt(requestParams.page, 10)
        : 1
    const offset = (pageNo - 1) * limit

    await banner
      .findAndCountAll({
        where: {
          status: ACTIVE,
        },
        order: [['updatedAt', 'DESC']],
        offset: offset,
        limit: limit,
        distinct: true,
      })
      .then((data) => {
        if (data.rows.length > 0) {
          const result = data.rows
          Object.keys(result).forEach((key) => {
            if ({}.hasOwnProperty.call(result, key)) {
              result[key].image = helper.mediaUrlForS3(
                BANNER_IMAGE,
                result[key].image
              )

              result[key].app_image = helper.mediaUrlForS3(
                BANNER_APP_IMAGE,
                result[key].app_image
              )

              result[key].responsive_image = helper.mediaUrlForS3(
                BANNER_RESPONSIVE_IMAGE,
                result[key].responsive_image
              )
            }
          })

          const extra = []
          extra.per_page = limit
          extra.total = data.count
          extra.page = pageNo
          return Response.successResponseData(
            res,
            new Transformer.List(result, bannerList).parse(),
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

  async newBannersList(displayId) {
    let sorting = [['sequence_number', 'ASC']]
    let bannerArray = []
    await banner
      .findAndCountAll({
        where: { status: Constants.ACTIVE, display_location: displayId },
        order: sorting,
      })
      .then((data, err) => {
        const newdata = data.rows
        newdata.map((data) => {
          data.image = helper.mediaUrlForS3(BANNER_IMAGE, data.image)
          if (displayId === 1) {
            data.app_image = helper.mediaUrlForS3(
              BANNER_APP_IMAGE,
              data.app_image
            )
          } else {
            data.app_image = helper.mediaUrlForS3(
              BANNER_RESPONSIVE_IMAGE,
              data.responsive_image
            )
          }
        })
        bannerArray = new Transformer.List(newdata, bannerWithOutId).parse()
      })
    return bannerArray
  },
}
