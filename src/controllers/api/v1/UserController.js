const Transformer = require('object-transformer')
const bcrypt = require('bcrypt')
const path = require('path')
const { Op } = require('sequelize')
const Response = require('../../../services/Response')
const helper = require('../../../services/Helper')
const {
  CUSTOMER_IMAGE,
  SUCCESS,
  FAIL,
  ACTIVE,
  DELETE,
  PER_PAGE,
  WALLET_REMOVE_BY_ADMIN,
  WALLET_PURCHASE,
} = require('../../../services/Constants')
const {
  checkPinCodeValidation,
  changePasswordValidation,
  saveDeviceTokenValidation,
  editProfileValidation,
  verifyNewMobileValidation,
} = require('../../../services/ApiValidation')
const { detail } = require('../../../transformers/api/CustomerTransformer')
const { walletDetail } = require('../../../transformers/api/WalletTransformer')
const {
  Pincode,
  Customer,
  CustomerDevice,
  CustomerWallet,
} = require('../../../models')

module.exports = {
  /**
   * @description this API is for check pin-code exist or not
   * @param req
   * @param res
   */
  checkPinCode: async (req, res) => {
    const { authCustomerId } = req
    const reqParam = req.body
    // eslint-disable-next-line consistent-return
    checkPinCodeValidation(reqParam, res, async (validate) => {
      if (validate) {
        const isPinCodeExist = await Pincode.findOne({
          where: {
            pincode: reqParam.pincode,
            status: ACTIVE,
          },
        }).then((pinCodeData) => pinCodeData)

        if (isPinCodeExist) {
          Customer.update(
            { pincode: reqParam.pincode },
            {
              where: { id: authCustomerId },
            }
          ).then(async () => {
            return Response.successResponseWithoutData(
              res,
              res.locals.__('success'),
              SUCCESS
            )
          })
        } else {
          return Response.successResponseWithoutData(
            res,
            res.locals.__('servicesAreNotAvailableInTheEnteredPincodeArea'),
            FAIL
          )
        }
      }
    })
  },

  /**
   * @description Change password
   * @param req
   * @param res
   */
  changePassword: async (req, res) => {
    const { authCustomerId } = req
    const reqParam = req.body
    changePasswordValidation(reqParam, res, async (validate) => {
      if (validate) {
        await Customer.findOne({
          where: {
            id: authCustomerId,
            status: ACTIVE,
          },
        })
          // eslint-disable-next-line consistent-return
          .then(async (customerData) => {
            if (customerData) {
              bcrypt.compare(
                reqParam.old_password,
                customerData.password,
                // eslint-disable-next-line consistent-return
                async (err, oldPasswordRes) => {
                  if (err) {
                    return Response.errorResponseData(
                      res,
                      res.__('somethingWentWrong')
                    )
                  }
                  if (oldPasswordRes) {
                    bcrypt.compare(
                      reqParam.password,
                      customerData.password,
                      // eslint-disable-next-line consistent-return
                      async (innerErr, newPasswordRes) => {
                        if (innerErr) {
                          return Response.errorResponseData(
                            res,
                            res.__('somethingWentWrong')
                          )
                        }
                        if (newPasswordRes) {
                          return Response.successResponseWithoutData(
                            res,
                            res.__('customerOldNewPasswordSame'),
                            FAIL
                          )
                        } else {
                          bcrypt.hash(
                            reqParam.password,
                            10,
                            // eslint-disable-next-line consistent-return
                            (bcryptErr, newPassword) => {
                              if (bcryptErr) {
                                return Response.errorResponseData(
                                  res,
                                  res.__('somethingWentWrong')
                                )
                              }
                              Customer.update(
                                {
                                  password: newPassword,
                                },
                                {
                                  where: {
                                    id: customerData.id,
                                  },
                                }
                              ).then((update) => {
                                if (update) {
                                  return Response.successResponseWithoutData(
                                    res,
                                    res.__('customerChangePasswordSuccess')
                                  )
                                } else {
                                  return Response.errorResponseData(
                                    res,
                                    res.__('somethingWentWrong')
                                  )
                                }
                              })
                            }
                          )
                        }
                      }
                    )
                  } else {
                    return Response.successResponseWithoutData(
                      res,
                      res.__('customerOldPasswordNotMatch'),
                      FAIL
                    )
                  }
                }
              )
            } else {
              return Response.successResponseWithoutData(
                res,
                res.locals.__('customerNotAvailable'),
                FAIL
              )
            }
          })
          .catch(() => {
            return Response.errorResponseData(res, res.__('somethingWentWrong'))
          })
      }
    })
  },

  /**
   * @description My Profile
   * @param req
   * @param res
   */
  myProfile: async (req, res) => {
    const { authCustomerId } = req
    await Customer.findOne({
      where: {
        id: authCustomerId,
        status: ACTIVE,
      },
    })
      .then(async (customerData) => {
        if (customerData) {
          const responseData = customerData
          responseData.image = helper.mediaUrlForS3(
            CUSTOMER_IMAGE,
            responseData.image
          )
          const data = new Transformer.Single(responseData, detail).parse()
          responseData.dob = responseData.dob ? responseData.dob : ''
          return Response.successResponseData(
            res,
            data,
            SUCCESS,
            res.locals.__('success')
          )
        } else {
          return Response.successResponseWithoutData(
            res,
            res.locals.__('customerNotAvailable'),
            FAIL
          )
        }
      })
      .catch(() => {
        return Response.errorResponseData(res, res.__('somethingWentWrong'))
      })
  },

  /**
   * @description Edit Profile
   * @param req
   * @param res
   */
  editProfile: async (req, res) => {
    const { authCustomerId } = req
    const reqParam = req.body
    editProfileValidation(reqParam, res, async (validate) => {
      if (validate) {
        try {
          let customerData = await Customer.findOne({
            where: {
              id: authCustomerId,
              status: ACTIVE,
            },
          })

          if (customerData) {
            const updateObj = {
              first_name: reqParam.first_name,
              last_name: reqParam.last_name,
              email: reqParam.email ? reqParam.email : customerData.email,
              gender: reqParam.gender,
              dob: reqParam.dob,
            }
            let isMobileChanged = false
            let data = await Customer.findAndCountAll({
              where: {
                mobile: reqParam.mobile,
                status: {
                  [Op.ne]: DELETE,
                },
              },
            })

            if (customerData.mobile !== reqParam.mobile) {
              if (data.count === 0) {
                isMobileChanged = true
                const verifyToken = await helper.generateMobileOtp(
                  4,
                  reqParam.mobile
                )
                updateObj.otp = verifyToken
                updateObj.new_mobile = reqParam.mobile

                const sendMsg = await helper.sendOtp(
                  reqParam.mobile,
                  verifyToken
                )

                if (!sendMsg) {
                  return Response.errorResponseData(
                    res,
                    res.__('somethingWentWrong')
                  )
                }
              } else {
                return Response.errorResponseData(
                  res,
                  res.__('mobileIsAlreadyRegisteredWithUs')
                )
              }
            }
            // else {
            Customer.update(updateObj, {
              where: { id: customerData.id },
            }).then(async (updateData) => {
              if (updateData) {
                const responseData = await Customer.findByPk(customerData.id)
                responseData.is_mobile_changed = isMobileChanged
                responseData.image = helper.mediaUrlForS3(
                  CUSTOMER_IMAGE,
                  responseData.image
                )
                return Response.successResponseData(
                  res,
                  new Transformer.Single(responseData, detail).parse(),
                  SUCCESS,
                  res.locals.__('customerProfileUpdateSuccess')
                )
              } else {
                return Response.errorResponseData(
                  res,
                  res.__('somethingWentWrong')
                )
              }
            })
            // }
          } else {
            return Response.successResponseWithoutData(
              res,
              res.locals.__('customerNotAvailable'),
              FAIL
            )
          }
        } catch (e) {
          return Response.errorResponseData(res, res.__('somethingWentWrong'))
        }
      }
    })
  },

  /**
   * @description Verify New Mobile
   * @param req
   * @param res
   */
  verifyNewMobile: async (req, res) => {
    const { authCustomerId } = req
    const reqParam = req.body
    verifyNewMobileValidation(reqParam, res, async (validate) => {
      if (validate) {
        await Customer.findOne({
          where: {
            id: authCustomerId,
            status: ACTIVE,
          },
        })
          .then(async (customerData) => {
            await Customer.findAndCountAll({
              where: {
                mobile: customerData.new_mobile,
                status: {
                  [Op.ne]: DELETE,
                },
              },
              // eslint-disable-next-line consistent-return
            }).then(async (data) => {
              if (data.count !== 0) {
                return Response.errorResponseData(
                  res,
                  res.__('mobileIsAlreadyRegisteredWithUs')
                )
              } else {
                if (customerData) {
                  if (customerData.otp === parseInt(reqParam.otp, 10)) {
                    Customer.update(
                      {
                        otp: null,
                        mobile: customerData.new_mobile,
                        new_mobile: null,
                      },
                      {
                        where: {
                          id: customerData.id,
                        },
                      }
                    )
                      .then(async (result) => {
                        if (result) {
                          return Response.successResponseWithoutData(
                            res,
                            res.locals.__('newMobileVerifiedSuccess'),
                            SUCCESS
                          )
                        }
                      })
                      .catch(() => {
                        return Response.errorResponseData(
                          res,
                          res.__('somethingWentWrong')
                        )
                      })
                  } else {
                    return Response.errorResponseWithoutData(
                      res,
                      res.locals.__('invalidOtp'),
                      FAIL
                    )
                  }
                } else {
                  return Response.successResponseWithoutData(
                    res,
                    res.locals.__('customerNotAvailable'),
                    FAIL
                  )
                }
              }
            })
          })
          .catch(() => {
            return Response.errorResponseData(res, res.__('somethingWentWrong'))
          })
      }
    })
  },

  /**
   * @description save device token
   * @param req
   * @param res
   */
  saveDeviceToken: async (req, res) => {
    const { authCustomerId } = req
    const reqParam = req.body
    // eslint-disable-next-line consistent-return
    saveDeviceTokenValidation(reqParam, res, async (validate) => {
      if (validate) {
        const customerDevice = await CustomerDevice.findOne({
          where: {
            customer_id: authCustomerId,
            device_token: reqParam.device_token,
          },
        }).then((customerDeviceData) => customerDeviceData)

        if (reqParam.is_logout === 1) {
          if (customerDevice) {
            await CustomerDevice.destroy({
              where: {
                id: customerDevice.id,
              },
            }).then((deleteData) => deleteData)
          }
        } else if (customerDevice) {
          // Update
          await CustomerDevice.update(
            { device_type: reqParam.device_type },
            { where: { id: customerDevice.id } }
          )
            .then()
            .catch(() => {
              return Response.errorResponseData(
                res,
                res.__('somethingWentWrong')
              )
            })
        } else {
          // Create
          await CustomerDevice.create({
            customer_id: authCustomerId,
            device_type: reqParam.device_type,
            device_token: reqParam.device_token,
          })
            .then()
            .catch(() => {
              return Response.errorResponseData(
                res,
                res.__('somethingWentWrong')
              )
            })
        }

        return Response.successResponseWithoutData(res, res.__('success'))
      }
    })
  },

  /**
   * @description customer wallet info
   * @param req
   * @param res
   */
  getWalletDetails: async (req, res) => {
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

    CustomerWallet.findAndCountAll({
      where: {
        customer_id: authCustomerId,
      },
      offset: offset,
      limit: limit,
      distinct: true,
    }).then((data) => {
      if (data.rows.length > 0) {
        const result = data.rows
        let totalAmount = 0
        let expiredNutricash = 0
        let usedNutricash = 0

        result.forEach((raw) => {
          totalAmount += raw.amount
          // expired
          raw.order_id = raw.order_id ? raw.order_id : ''
          raw.expiry = raw.expiry ? raw.expiry : ''
          if (raw.expiry && raw.expiry < new Date()) {
            expiredNutricash += raw.amount
          }
          // used cash
          if (
            raw.transaction_type === WALLET_REMOVE_BY_ADMIN ||
            raw.transaction_type === WALLET_PURCHASE
          ) {
            usedNutricash += raw.amount
          }
        })

        const extra = []
        extra.per_page = limit
        extra.total = data.count
        extra.page = pageNo
        extra.statistics = {
          totalAmount: totalAmount,
          expiredNutricash: expiredNutricash,
          usedNutricash: usedNutricash,
          availableNutricash:
            totalAmount - (expiredNutricash + usedNutricash) < 0
              ? 0
              : totalAmount - (expiredNutricash + usedNutricash),
        }
        return Response.successResponseData(
          res,
          new Transformer.List(result, walletDetail).parse(),
          SUCCESS,
          res.locals.__('success'),
          extra
        )
      } else {
        const extra = []
        extra.per_page = limit
        extra.total = data.count
        extra.page = pageNo
        extra.statistics = {
          totalAmount: 0,
          expiredNutricash: 0,
          usedNutricash: 0,
          availableNutricash: 0,
        }
        return Response.successResponseData(
          res,
          [],
          SUCCESS,
          res.locals.__('noDataFound'),
          extra
        )
      }
    })
  },
  /**
   * @description Resend OTP
   * @param req
   * @param res
   */
  resendNewMobileVerifyOTP: async (req, res) => {
    const { authCustomerId } = req

    await Customer.findOne({
      where: {
        id: authCustomerId,
        status: ACTIVE,
      },
      // eslint-disable-next-line consistent-return
    }).then(async (customerData) => {
      if (customerData) {
        if (new Date().getTime() <= customerData.last_otp_sent) {
          return Response.errorResponseWithoutData(
            res,
            res.locals.__('cantSendOTPWithin30seconds'),
            FAIL
          )
        }

        const minutesLater = new Date()
        const verifyToken = await helper.generateMobileOtp(
          4,
          customerData.new_mobile
        )
        const verifyTokenExpire = minutesLater.setMinutes(
          minutesLater.getMinutes() + 1440
        )

        // SEND OTP MSG
        const sendMsg = await helper
          .sendOtp(customerData.new_mobile, verifyToken)
          .then((msg) => msg)
        if (!sendMsg) {
          return Response.errorResponseData(res, res.__('somethingWentWrong'))
        }

        // add 30 sec in current time
        const secLater = new Date()
        const add30SecInCurrentTime = secLater.setSeconds(
          secLater.getSeconds() + 30
        )

        Customer.update(
          {
            otp: verifyToken,
            last_otp_sent: add30SecInCurrentTime,
            reset_expiry: verifyTokenExpire,
            resend_count: customerData.resend_count
              ? customerData.resend_count + 1
              : 1,
          },
          {
            where: {
              id: customerData.id,
            },
          }
        )
          // eslint-disable-next-line consistent-return
          .then(async (result) => {
            if (result) {
              return Response.successResponseWithoutData(
                res,
                res.locals.__('sentOtp'),
                SUCCESS
              )
            }
          })
          .catch(() => {
            return Response.errorResponseData(res, res.__('somethingWentWrong'))
          })
      } else {
        return Response.successResponseWithoutData(
          res,
          res.locals.__('customerNotAvailable'),
          FAIL
        )
      }
    })
  },
}
