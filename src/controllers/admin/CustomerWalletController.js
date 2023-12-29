const Transformer = require('object-transformer')
const Response = require('../../services/Response')
const Constants = require('../../services/Constants')
const { CustomerWallet, Customer } = require('../../models')
const {
  customerWallet,
} = require('../../transformers/admin/CustomerWalletTransformer')
const {
  addEditValidationForCustomerWallet,
} = require('../../services/AdminValidation')

module.exports = {
  /**
   * @description function to get a list of customer wallet history
   * @param id
   */

  async customerWalletData(id) {
    let totalAmount = 0
    let expiredNutricash = 0
    let usedNutricash = 0
    let removedByAdminNutricash = 0
    return await CustomerWallet.findAll({
      where: {
        customer_id: id,
      },
    }).then((result) => {
      if (result) {
        Object.keys(result).forEach((key) => {
          if ({}.hasOwnProperty.call(result, key)) {
            if (
              result[key].transaction_type === Constants.WALLET_ADD_BY_ADMIN ||
              result[key].transaction_type === Constants.WALLET_REFFER ||
              result[key].transaction_type === Constants.WALLET_ORDER_REFFER
            ) {
              totalAmount += result[key].amount
            }
            // expired
            if (result[key].expiry && result[key].expiry < new Date()) {
              expiredNutricash += result[key].amount
            }
            // used cash
            if (result[key].transaction_type === Constants.WALLET_PURCHASE) {
              usedNutricash += result[key].amount
            }
            // admin remove
            if (
              result[key].transaction_type === Constants.WALLET_REMOVE_BY_ADMIN
            ) {
              removedByAdminNutricash += result[key].amount
            }
          }
        })
        const availableNutricash =
          totalAmount -
          (removedByAdminNutricash + expiredNutricash + usedNutricash)
        return {
          totalAmount: totalAmount,
          expiredNutricash: expiredNutricash,
          usedNutricash: usedNutricash,
          availableNutricash: availableNutricash < 0 ? 0 : availableNutricash,
        }
      } else {
        return {
          totalAmount: totalAmount,
          expiredNutricash: expiredNutricash,
          usedNutricash: usedNutricash,
          availableNutricash: availableNutricash < 0 ? 0 : availableNutricash,
        }
      }
    })
  },

  customerWalletHistory: async (req, res) => {
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
    const sorting = [['updatedAt', 'DESC']]
    if (requestParams.id === null) {
      return Response.errorResponseData(
        res,
        res.__('invalidCustomerId'),
        Constants.BAD_REQUEST
      )
    } else {
      const nutricashRecords = await module.exports.customerWalletData(
        requestParams.customer_id
      )
      await CustomerWallet.findAndCountAll({
        where: {
          customer_id: requestParams.customer_id,
        },
        offset: offset,
        limit: limit,
        order: sorting,
      }).then(async (data) => {
        if (data.rows.length > 0) {
          const result = data.rows
          const extra = []
          extra.per_page = limit
          extra.total = data.count
          extra.page = pageNo
          extra.nutricashRecords = nutricashRecords

          return Response.successResponseData(
            res,
            new Transformer.List(result, customerWallet).parse(),
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
    }
    return null
  },

  /**
   * @description function add-remove customer wallet
   * @param req
   * @param res
   */
  CustomerWalletAddRemove: async (req, res) => {
    const requestParams = req.fields
    let totalAmount = 0
    addEditValidationForCustomerWallet(requestParams, res, async (validate) => {
      if (validate) {
        const wallet = {
          customer_id: requestParams.customer_id,
          transaction_type: requestParams.transaction_type,
          amount: requestParams.amount,
          description: requestParams.description,
        }
        await CustomerWallet.findAndCountAll({
          where: {
            customer_id: requestParams.customer_id,
          },
        })
          .then(async (data) => {
            if (data.rows.length > 0) {
              const result = data.rows
              Object.keys(result).forEach((key) => {
                if ({}.hasOwnProperty.call(result, key)) {
                  if (
                    result[key].transaction_type ===
                      Constants.WALLET_ADD_BY_ADMIN ||
                    result[key].transaction_type === Constants.WALLET_REFFER ||
                    result[key].transaction_type ===
                      Constants.WALLET_ORDER_REFFER
                  ) {
                    totalAmount += result[key].amount
                  }
                  if (
                    result[key].transaction_type ===
                      Constants.WALLET_REMOVE_BY_ADMIN ||
                    result[key].transaction_type === Constants.WALLET_PURCHASE
                  ) {
                    totalAmount -= result[key].amount
                  }
                }
              })
            }

            if (
              parseInt(requestParams.transaction_type, 10) ===
              Constants.WALLET_REMOVE_BY_ADMIN
            ) {
              if (totalAmount < requestParams.amount) {
                return Response.errorResponseData(
                  res,
                  res.__('notEnoughAmount'),
                  Constants.BAD_REQUEST
                )
              }
            }

            await CustomerWallet.create(wallet)
              .then(async (result) => {
                if (result) {
                  if (
                    parseInt(requestParams.transaction_type, 10) ===
                    Constants.WALLET_ADD_BY_ADMIN
                  ) {
                    const customerActualNutricash =
                      parseInt(totalAmount, 10) +
                      parseInt(requestParams.amount, 10)
                    await Customer.update(
                      { nutricash: customerActualNutricash },
                      {
                        where: {
                          id: requestParams.customer_id,
                        },
                      }
                    )

                    Response.successResponseWithoutData(
                      res,
                      res.locals.__('walledAddedSuccess'),
                      Constants.SUCCESS
                    )
                  } else {
                    const customerActualNutricash =
                      parseInt(totalAmount, 10) -
                      parseInt(requestParams.amount, 10)

                    await Customer.update(
                      { nutricash: customerActualNutricash },
                      {
                        where: {
                          id: requestParams.customer_id,
                        },
                      }
                    )

                    Response.successResponseWithoutData(
                      res,
                      res.locals.__('walledRemovedSuccess'),
                      Constants.SUCCESS
                    )
                  }
                }
              })
              .catch(async (e) => {
                Response.errorResponseData(
                  res,
                  res.__('internalError'),
                  Constants.INTERNAL_SERVER
                )
              })
          })
          .catch(async (e) => {
            Response.errorResponseData(
              res,
              res.__('internalError'),
              Constants.INTERNAL_SERVER
            )
          })
      }
    })
  },
}
