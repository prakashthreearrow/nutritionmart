const Transformer = require('object-transformer')
const { Op } = require('sequelize')
const sequelize = require('sequelize')
const Response = require('../../services/Response')
const Constants = require('../../services/Constants')
const Helper = require('../../services/Helper')
const { Customer, CustomerAddress, CustomerReferral } = require('../../models')
const {
  customer,
  customerDetail,
  customerAddressList,
  customerAddressDetails,
} = require('../../transformers/admin/CustomerTransformer')
const {
  customerChangeStatusValidation,
  addEditValidationForCustomerAddress,
} = require('../../services/AdminValidation')
const {
  customerCodChangeStatusValidation,
} = require('../../services/AdminValidation')

module.exports = {
  /**
   * @description function to get a list of customers address
   * @param req
   * @param res
   */
  customerAddressList: async (req, res) => {
    const requestParams = req.params
    const sorting = [['updatedAt', 'DESC']]
    await CustomerAddress.findAll({
      where: {
        customer_id: requestParams.id,
        status: {
          [Op.ne]: [Constants.DELETE],
        },
      },
      order: sorting,
    }).then((result) => {
      if (result.length > 0) {
        return Response.successResponseData(
          res,
          new Transformer.List(result, customerAddressList).parse(),
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

  /**
   * @description "This function is use to get customerAddress detail."
   * @param req
   * @param res
   * @returns {Promise<void>}
   */
  customerAddressDetail: async (req, res) => {
    const requestParams = req.params
    if (requestParams.id === null) {
      Response.errorResponseData(
        res,
        res.__('invalidCustomerAddressId'),
        Constants.BAD_REQUEST
      )
    } else {
      await CustomerAddress.findOne({
        where: {
          id: requestParams.id,
          status: {
            [Op.in]: [Constants.ACTIVE, Constants.INACTIVE],
          },
        },
      })
        .then(async (result) => {
          if (result) {
            return Response.successResponseData(
              res,
              new Transformer.Single(result, customerAddressDetails).parse(),
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
   * @description function to get a list of customers
   * @param req
   * @param res
   */
  customerList: async (req, res) => {
    const requestParams = req.query
    const search = false
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
          first_name: {
            [Op.like]: `%${requestParams.search}%`,
          },
          last_name: {
            [Op.like]: `%${requestParams.search}%`,
          },
          email: {
            [Op.like]: `%${requestParams.search}%`,
          },
          mobile: {
            [Op.like]: `%${requestParams.search}%`,
          },
          [Op.or]: {
            namesQuery: sequelize.where(
              sequelize.fn(
                'concat',
                sequelize.col('first_name'),
                ' ',
                sequelize.col('last_name')
              ),
              {
                [Op.like]: `%${requestParams.search}%`,
              }
            ),
          },
        },
      }
    }

    let filterQuery = {}

    if (
      requestParams.filter_by_user_type &&
      requestParams.filter_by_user_type !== ''
    ) {
      filterQuery = {
        ...filterQuery,
        user_type: requestParams.filter_by_user_type,
      }
    }

    if (
      requestParams.filter_by_is_use_app &&
      requestParams.filter_by_is_use_app !== ''
    ) {
      filterQuery = {
        ...filterQuery,
        is_use_app: requestParams.filter_by_is_use_app,
      }
    }

    if (
      requestParams.filter_by_status &&
      requestParams.filter_by_status !== ''
    ) {
      filterQuery = {
        ...filterQuery,
        status: requestParams.filter_by_status,
      }
    }

    query = {
      ...query,
      ...filterQuery,
    }

    let sorting = [['updatedAt', 'DESC']]

    if (requestParams.order_by && requestParams.order_by !== '') {
      if (requestParams.order_by === 'name') {
        requestParams.order_by = 'first_name'
      }
      sorting = [
        [
          requestParams.order_by,
          requestParams.direction ? requestParams.direction : 'DESC',
        ],
      ]
    }

    await Customer.findAndCountAll({
      include: {
        model: CustomerReferral,
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
          result[key].orders_count = 0 //TODO
          result[key].referral_count = result[key].CustomerReferrals
            ? result[key].CustomerReferrals.length
            : 0
          if ({}.hasOwnProperty.call(result, key)) {
            const customerImage =
              result[key].image && result[key].image !== ''
                ? result[key].image
                : ''
            result[key].image = Helper.mediaUrlForS3(
              Constants.CUSTOMER_IMAGE,
              customerImage
            )
            if (result[key].last_name == null) {
              result[key].name = `${result[key].first_name}`
            } else {
              result[
                key
              ].name = `${result[key].first_name} ${result[key].last_name}`
            }
          }
        })
        const extra = []
        extra.per_page = limit
        extra.total = data.count
        extra.page = pageNo
        return Response.successResponseData(
          res,
          new Transformer.List(result, customer).parse(),
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
   * @description change the COD status of customer
   * @param req
   * @param res
   */
  customerCodUpdateStatus: async (req, res) => {
    const requestParams = req.fields
    customerCodChangeStatusValidation(requestParams, res, async (validate) => {
      if (validate) {
        await Customer.findByPk(requestParams.customer_id)
          .then(async (customerData) => {
            if (customerData) {
              /* eslint no-param-reassign: "error" */
              customerData.is_cod_active = requestParams.is_cod_active
              await customerData
                .save()
                .then((result) => {
                  if (result) {
                    return Response.successResponseWithoutData(
                      res,
                      res.locals.__('CodUpdateStatusSuccess'),
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
            } else {
              return Response.successResponseData(
                res,
                null,
                Constants.SUCCESS,
                res.locals.__('noCustomerFound')
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
   * @description change the status of customer
   * @param req
   * @param res
   */
  customerUpdateStatus: async (req, res) => {
    const requestParams = req.fields
    customerChangeStatusValidation(requestParams, res, async (validate) => {
      if (validate) {
        await Customer.findOne({
          where: {
            id: requestParams.id,
          },
        })
          .then(async (customerData) => {
            if (customerData) {
              customerData.status = requestParams.status
              customerData
                .save()
                .then((result) => {
                  if (result) {
                    if (
                      parseInt(requestParams.status, 10) === Constants.ACTIVE
                    ) {
                      return Response.successResponseWithoutData(
                        res,
                        res.locals.__('CustomerStatusActivated'),
                        Constants.SUCCESS
                      )
                    } else if (
                      parseInt(requestParams.status, 10) === Constants.DELETE
                    ) {
                      return Response.successResponseWithoutData(
                        res,
                        res.locals.__('CustomerStatusDeleted'),
                        Constants.SUCCESS
                      )
                    } else {
                      return Response.successResponseWithoutData(
                        res,
                        res.locals.__('CustomerStatusDeactivated'),
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
              return null
            } else {
              return Response.successResponseWithoutData(
                res,
                res.locals.__('nocustomerFound'),
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
    })
  },

  /**
   * @description "This function is use to get Customer."
   * @param req
   * @param res
   * @returns {Promise<void>}
   */
  customerDetail: async (req, res) => {
    const requestParams = req.params
    if (requestParams.id === null) {
      Response.errorResponseData(
        res,
        res.__('invalidCustomerId'),
        Constants.BAD_REQUEST
      )
    } else {
      await Customer.findOne({
        where: {
          id: requestParams.id,
          status: {
            [Op.ne]: [Constants.DELETE],
          },
        },
      })
        .then(async (result) => {
          if (result) {
            if (result.last_name == null) {
              result.name = `${result.first_name}`
            } else {
              result.name = `${result.first_name} ${result.last_name}`
            }
            const customerImage =
              result.image && result.image !== '' ? result.image : ''
            result.image = Helper.mediaUrlForS3(
              Constants.CUSTOMER_IMAGE,
              customerImage
            )
            result.dob = result.dob ? result.dob : ''
            return Response.successResponseData(
              res,
              new Transformer.Single(result, customerDetail).parse(),
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
        .catch((e) => {
          Response.errorResponseData(
            res,
            res.__('internalError'),
            Constants.INTERNAL_SERVER
          )
        })
    }
  },

  /**
   * @description This function is add/edit customer address.
   * @param req
   * @param res
   */

  customerAddressAddEdit: async (req, res) => {
    const requestParams = req.fields
    addEditValidationForCustomerAddress(
      requestParams,
      res,
      async (validate) => {
        if (validate) {
          const addressObj = {
            customer_id: requestParams.customer_id,
            receiver_name: requestParams.receiver_name,
            address_1: requestParams.address_1,
            address_2: requestParams.address_2,
            city: requestParams.city,
            pincode: requestParams.pincode,
            state: requestParams.state,
            status: requestParams.status,
            mobile_no: requestParams.mobile_no,
          }

          if (requestParams.id) {
            CustomerAddress.findOne({
              where: {
                id: requestParams.id,
                status: {
                  [Op.ne]: Constants.DELETE,
                },
              },
            })
              .then(async (addressData) => {
                if (addressData) {
                  await addressData
                    .update(addressObj, {
                      where: {
                        id: requestParams.id,
                      },
                    })
                    .then(async (result) => {
                      if (result) {
                        return Response.successResponseWithoutData(
                          res,
                          res.__('customerAddressUpdatedSuccessfully'),
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
                } else {
                  Response.successResponseWithoutData(
                    res,
                    res.__('noDataFound'),
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
            await CustomerAddress.create(addressObj)
              .then(async (result) => {
                if (result) {
                  return Response.successResponseWithoutData(
                    res,
                    res.__('customerAddressAddedSuccessfully'),
                    Constants.SUCCESS
                  )
                }
                return null
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
      }
    )
  },
}
