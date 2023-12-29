const Transformer = require('object-transformer')
const Response = require('../../../services/Response')
const {
  DELETE,
  FAIL,
  ACTIVE,
  PER_PAGE,
  SUCCESS,
} = require('../../../services/Constants')
const { addEditAddressValidation } = require('../../../services/ApiValidation')
const { CustomerAddress } = require('../../../models')
const { addresses } = require('../../../transformers/api/AddressTransformer')

module.exports = {
  /**
   * @description Add/Edit Address
   * @param req
   * @param res
   */
  addEditAddress: async (req, res) => {
    const { authCustomerId } = req
    const reqParam = req.body
    // eslint-disable-next-line consistent-return
    addEditAddressValidation(reqParam, res, async (validate) => {
      if (validate) {
        const addUpdateObj = {
          receiver_name: reqParam.receiver_name,
          address_1: reqParam.address_1,
          city: reqParam.city,
          state: reqParam.state,
          pincode: reqParam.pincode,
          address_2: reqParam.address_2 ? reqParam.address_2 : '',
          mobile_no: reqParam.mobile_no ? reqParam.mobile_no : '',
        }
        if (reqParam.id && reqParam.id !== '') {
          const customerAddress = await CustomerAddress.findOne({
            where: {
              id: reqParam.id,
              customer_id: authCustomerId,
              status: ACTIVE,
            },
          })
            .then((customerAddressData) => customerAddressData)
            .catch(() => {
              return Response.errorResponseData(
                res,
                res.__('somethingWentWrong')
              )
            })

          if (!customerAddress) {
            return Response.successResponseWithoutData(
              res,
              res.locals.__('addressNotAvailable'),
              FAIL
            )
          }

          CustomerAddress.update(addUpdateObj, {
            where: { id: customerAddress.id },
          }).then((update) => {
            if (update) {
              return Response.successResponseWithoutData(
                res,
                res.__('customerAddressUpdateSuccess')
              )
            } else {
              return Response.errorResponseData(
                res,
                res.__('somethingWentWrong')
              )
            }
          })
        } else {
          addUpdateObj.customer_id = authCustomerId
          CustomerAddress.create(addUpdateObj)
            // eslint-disable-next-line consistent-return
            .then(async (result) => {
              if (result) {
                return Response.successResponseWithoutData(
                  res,
                  res.__('customerAddressAddSuccess')
                )
              }
            })
            .catch(() => {
              return Response.errorResponseData(
                res,
                res.__('somethingWentWrong')
              )
            })
        }
      }
    })
  },

  /**
   * @description 'get address'
   * @param req
   * @param res
   * @returns {Promise<void>}
   */
  get: async (req, res) => {
    const { authCustomerId } = req
    const requestParams = req.query
    let limit = PER_PAGE
    if (requestParams.per_page && requestParams.per_page > 0) {
      limit = parseInt(requestParams.per_page, 10)
    }
    let pageNo = 1
    if (requestParams.page && requestParams.page > 0) {
      pageNo = parseInt(requestParams.page, 10)
    }
    const offset = (pageNo - 1) * limit

    await CustomerAddress.findAndCountAll({
      where: {
        customer_id: authCustomerId,
        status: ACTIVE,
      },
      order: [['updatedAt', 'DESC']],
      offset: offset,
      limit: limit,
    }).then((data) => {
      if (data.rows && data.rows.length > 0) {
        const result = data.rows
        result.map((data) =>
          data.mobile_no !== null
            ? (data.mobile_no = data.mobile_no)
            : (data.mobile_no = '')
        )
        const extra = []
        extra.per_page = limit
        extra.total = data.count
        extra.page = pageNo
        return Response.successResponseData(
          res,
          new Transformer.List(result, addresses).parse(),
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
   * @description 'Address detail'
   * @param req id
   * @param res
   */
  detail: async (req, res) => {
    const requestParams = req.params
    CustomerAddress.findOne({
      where: {
        id: requestParams.id,
        status: ACTIVE,
      },
    })
      .then(async (result) => {
        result.mobile_no !== null
          ? (result.mobile_no = result.mobile_no)
          : (result.mobile_no = '')
        if (result) {
          return Response.successResponseData(
            res,
            new Transformer.Single(result, addresses).parse(),
            SUCCESS,
            res.__('success')
          )
        } else {
          return Response.successResponseData(
            res,
            null,
            FAIL,
            res.__('addressIdNotAvailable')
          )
        }
      })
      .catch(() => {
        return Response.errorResponseData(res, res.__('somethingWentWrong'))
      })
  },

  /**
   * @description 'Address delete'
   * @param req id
   * @param res
   */
  delete: async (req, res) => {
    const requestParams = req.params
    CustomerAddress.findOne({
      where: {
        id: requestParams.id,
        status: ACTIVE,
      },
    })
      // eslint-disable-next-line consistent-return
      .then(async (result) => {
        if (result) {
          // Delete
          CustomerAddress.update(
            { status: DELETE },
            {
              where: { id: result.id },
            }
          ).then((update) => {
            if (update) {
              return Response.successResponseWithoutData(
                res,
                res.__('addressDeletedSuccess')
              )
            } else {
              return Response.errorResponseData(
                res,
                res.__('somethingWentWrong')
              )
            }
          })
        } else {
          return Response.successResponseData(
            res,
            null,
            FAIL,
            res.__('addressIdNotAvailable')
          )
        }
      })
      .catch(() => {
        return Response.errorResponseData(res, res.__('somethingWentWrong'))
      })
  },
}
