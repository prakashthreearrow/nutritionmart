const requestIp = require('request-ip')
const bcrypt = require('bcrypt')
const Transformer = require('object-transformer')
const { Op } = require('sequelize')
const Response = require('../../../services/Response')
const helper = require('../../../services/Helper')
const jwToken = require('../../../services/jwTokenCustomer')
const {
  CUSTOMER_IMAGE,
  DELETE,
  SIGN_UP_REDIRECTION,
  SUCCESS,
  FAIL,
  INACTIVE,
  ACTIVE,
  UN_VERIFY,
  UNAUTHORIZED,
  WALLET_REFFER,
} = require('../../../services/Constants')
const {
  resendOTPValidation,
  signUpValidation,
  mobileExistValidation,
  normalLoginValidation,
  socialLoginValidation,
  verifyMobileValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
} = require('../../../services/ApiValidation')
const { detail } = require('../../../transformers/api/CustomerTransformer')
const {
  Customer,
  CustomerAccount,
  CustomerLoginToken,
  CustomerReferral,
  CustomerWallet,
} = require('../../../models')
// eslint-disable-next-line no-var,no-multi-assign
var self = (module.exports = {
  /**
   * @description this API is for check mobile number exist or not
   * @param req
   * @param res
   */
  checkMobile: async (req, res) => {
    const reqParam = req.body
    // eslint-disable-next-line consistent-return
    mobileExistValidation(reqParam, res, async (validate) => {
      if (validate) {
        const isMobileNoExist = await Customer.findOne({
          where: {
            mobile: reqParam.mobile,
            status: {
              [Op.not]: DELETE,
            },
          },
        }).then((userMobileExistData) => userMobileExistData)

        if (isMobileNoExist) {
          if (isMobileNoExist.status === INACTIVE) {
            return Response.errorResponseData(
              res,
              res.locals.__('customerInActiveAccount'),
              UNAUTHORIZED
            )
          }
          if (isMobileNoExist.status === UN_VERIFY) {
            return Response.successResponseData(
              res,
              { is_mobile_verified: 0 },
              SUCCESS,
              res.locals.__('mobileIsNotVerified')
            )
          }

          return Response.successResponseWithoutData(
            res,
            res.locals.__('success'),
            SUCCESS
          )
        } else {
          return Response.successResponseWithoutData(
            res,
            res.locals.__('mobileNotRegisteredWithUs'),
            SIGN_UP_REDIRECTION
          )
        }
      }
    })
  },
  /**
   * @description Normal login
   * @param req
   * @param res
   */
  normalLogin: async (req, res) => {
    const reqParam = req.body
    // eslint-disable-next-line consistent-return
    normalLoginValidation(reqParam, res, async (validate) => {
      if (validate) {
        const customer = await Customer.findOne({
          where: {
            mobile: reqParam.mobile,
            status: {
              [Op.not]: DELETE,
            },
          },
        }).then((customerData) => customerData)

        if (!customer) {
          return Response.successResponseWithoutData(
            res,
            res.locals.__('mobileNotRegisteredWithUs'),
            FAIL
          )
        }

        if (reqParam.type === 1) {
          // Login wih OTP

          if (customer.status === INACTIVE) {
            return Response.errorResponseData(
              res,
              res.locals.__('customerInActiveAccount'),
              UNAUTHORIZED
            )
          } else if (customer.otp === parseInt(reqParam.otp, 10)) {
            Customer.update(
              {
                status: ACTIVE,
                otp: null,
                last_otp_sent: 0,
                reset_expiry: null,
                resend_count: 0,
              },
              {
                where: {
                  id: customer.id,
                },
              }
            )
              // eslint-disable-next-line consistent-return
              .then(async (result) => {
                if (result) {
                  const meta = {
                    token: jwToken.issue(customer.id),
                  }
                  // save token
                  const signUpDetails = JSON.parse(customer.signup_details)

                  await self
                    .saveDeviceToken(
                      customer.id,
                      meta.token,
                      signUpDetails.device_type
                    )
                    .catch(() => {
                      return Response.errorResponseData(
                        res,
                        res.__('somethingWentWrong')
                      )
                    })
                  customer.image = helper.mediaUrlForS3(
                    CUSTOMER_IMAGE,
                    customer.image
                  )
                  customer.account_type = 1
                  return Response.successResponseData(
                    res,
                    new Transformer.Single(customer, detail).parse(),
                    SUCCESS,
                    res.locals.__('success'),
                    meta
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
          if (customer.status === UN_VERIFY) {
            return Response.successResponseData(
              res,
              { is_mobile_verified: 0 },
              SUCCESS,
              res.locals.__('mobileIsNotVerified')
            )
          } else if (customer.status === INACTIVE) {
            return Response.errorResponseData(
              res,
              res.locals.__('customerInActiveAccount'),
              UNAUTHORIZED
            )
          } else {
            bcrypt.compare(
              reqParam.password,
              customer.password,
              async (err, result) => {
                if (err) {
                  return Response.successResponseWithoutData(
                    res,
                    res.locals.__('mobilePasswordNotMatch'),
                    FAIL
                  )
                }
                if (result) {
                  const meta = {
                    token: jwToken.issue(customer.id),
                  }
                  // save token
                  const signUpDetails = JSON.parse(customer.signup_details)
                  await self
                    .saveDeviceToken(
                      customer.id,
                      meta.token,
                      signUpDetails.device_type
                    )
                    .catch(() => {
                      return Response.errorResponseData(
                        res,
                        res.__('somethingWentWrong')
                      )
                    })
                  customer.image = helper.mediaUrlForS3(
                    CUSTOMER_IMAGE,
                    customer.image
                  )
                  customer.account_type = 1
                  return Response.successResponseData(
                    res,
                    new Transformer.Single(customer, detail).parse(),
                    SUCCESS,
                    res.locals.__('success'),
                    meta
                  )
                } else {
                  return Response.successResponseWithoutData(
                    res,
                    res.locals.__('mobilePasswordNotMatch'),
                    FAIL
                  )
                }
              }
            )
          }
        }
      }
    })
  },
  /**
   * @description sign-up controller
   * @param req
   * @param res
   */
  signUp: async (req, res) => {
    const reqParam = req.body
    // eslint-disable-next-line consistent-return
    signUpValidation(reqParam, res, async (validate) => {
      if (validate) {
        const clientIp = requestIp.getClientIp(req)
        /* if (reqParam.email && reqParam.email !== '') {
          const userEmailExist = await Customer.findOne({
            where: {
              email: reqParam.email,
              status: {
                [Op.not]: DELETE,
              },
            },
          }).then((userEmailData) => userEmailData)

          if (userEmailExist) {
            return Response.successResponseWithoutData(
              res,
              res.locals.__('emailAddressIsAlreadyRegisteredWithUs'),
              FAIL
            )
          }
        } */

        const user = await Customer.findOne({
          where: {
            mobile: reqParam.mobile,
            status: {
              [Op.not]: DELETE,
            },
          },
        }).then((userMobileExistData) => userMobileExistData)

        if (user) {
          return Response.successResponseWithoutData(
            res,
            res.locals.__('mobileIsAlreadyRegisteredWithUs'),
            FAIL
          )
        }
        let checkReferrerCode = null
        if (reqParam.referrer_code && reqParam.referrer_code !== '') {
          checkReferrerCode = await Customer.findOne({
            where: {
              referrer_code: reqParam.referrer_code,
              status: {
                [Op.not]: DELETE,
              },
            },
          }).then((referrerCodeData) => referrerCodeData)

          if (!checkReferrerCode) {
            return Response.successResponseWithoutData(
              res,
              res.locals.__('referrerCodeNotExits'),
              FAIL
            )
          }
        }

        try {
          const reqBase = req.baseUrl !== '' ? req.baseUrl.split('/') : []
          const signUpDetails = {
            device_type: reqParam.device_type ? reqParam.device_type : '',
            version: reqBase.length === 3 ? reqBase[2] : 'v1',
            ip: clientIp,
          }
          const verifyToken = await helper.generateMobileOtp(4, reqParam.mobile)
          const minutesLater = new Date()
          const verifyTokenExpire = minutesLater.setMinutes(
            minutesLater.getMinutes() + 1440
          )

          // add 30 sec in current time
          const secLater = new Date()
          const add30SecInCurrentTime = secLater.setSeconds(
            secLater.getSeconds() + 30
          )

          // SEND OTP MSG
          const sendMsg = await helper
            .sendOtp(reqParam.mobile, verifyToken)
            .then((msg) => msg)
          if (!sendMsg) {
            return Response.errorResponseData(res, res.__('somethingWentWrong'))
          }

          let password = ''
          if (reqParam.account_type === 1) {
            password = await helper
              .generatePassword(reqParam.password)
              .then((data) => data)
          }
          const customerObj = {
            first_name: reqParam.first_name,
            last_name: reqParam.last_name,
            email: reqParam.email ? reqParam.email : '',
            mobile: reqParam.mobile,
            password: password,
            signup_details: JSON.stringify(signUpDetails),
            is_use_app:
              reqParam.device_type && reqParam.device_type === 'web' ? 0 : 1,
            status: UN_VERIFY,
            gender: 4,
            otp: verifyToken,
            last_otp_sent: add30SecInCurrentTime,
            reset_expiry: verifyTokenExpire,
            resend_count: 1,
            referrer_code: helper.generateReferrerCode(reqParam.mobile),
          }

          await Customer.create(customerObj)
            .then(async (result) => {
              if (result) {
                await CustomerAccount.create({
                  customer_id: result.id,
                  account_type: reqParam.account_type,
                  account_id:
                    reqParam.account_type === 1 ? null : reqParam.account_id,
                  status: ACTIVE,
                })
                  // eslint-disable-next-line consistent-return
                  .then(async (customerAccountData) => {
                    if (customerAccountData) {
                      // save customer referral
                      if (
                        reqParam.referrer_code &&
                        reqParam.referrer_code !== ''
                      ) {
                        await CustomerReferral.create({
                          customer_id: result.id,
                          ref_customer_id: checkReferrerCode.id,
                        }).then()
                      }

                      return Response.successResponseData(
                        res,
                        { is_mobile_verified: 0 },
                        SUCCESS,
                        res.locals.__('sentOtp')
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
            })
            .catch(() => {
              return Response.errorResponseData(
                res,
                res.__('somethingWentWrong')
              )
            })
        } catch (e) {
          return Response.errorResponseData(res, res.__('somethingWentWrong'))
        }
      }
    })
  },

  /**
   * @description Social Login
   * @param req
   * @param res
   */
  socialLogin: async (req, res) => {
    const reqParam = req.body
    // eslint-disable-next-line consistent-return
    socialLoginValidation(reqParam, res, async (validate) => {
      if (validate) {
        const customerAccount = await CustomerAccount.findOne({
          where: {
            account_id: reqParam.account_id,
            status: {
              [Op.not]: DELETE,
            },
          },
          order: [['id', 'DESC']],
        })
          .then((customerAccountData) => customerAccountData)
          .catch(() => {
            return Response.errorResponseData(res, res.__('somethingWentWrong'))
          })
        let customerExist
        if (customerAccount) {
          customerExist = await Customer.findOne({
            where: {
              id: customerAccount.customer_id,
              status: {
                [Op.not]: DELETE,
              },
            },
            order: [['id', 'DESC']],
          })
            .then((customerData) => customerData)
            .catch(() => {
              return Response.errorResponseData(
                res,
                res.__('somethingWentWrong')
              )
            })

          if (!customerExist) {
            return Response.errorResponseWithoutData(
              res,
              res.locals.__('customerNotRegisterThisAccount'),
              SIGN_UP_REDIRECTION
            )
          }
          if (customerExist.status === INACTIVE) {
            return Response.errorResponseData(
              res,
              res.locals.__('customerInActiveAccount'),
              UNAUTHORIZED
            )
          }
          if (customerExist.status === UN_VERIFY) {
            return Response.successResponseData(
              res,
              {
                is_mobile_verified: 0,
                mobile: customerExist.mobile,
              },
              SUCCESS,
              res.locals.__('mobileIsNotVerified')
            )
          }
        }

        if (!customerAccount) {
          if (!reqParam.mobile || reqParam.mobile === '') {
            return Response.successResponseWithoutData(
              res,
              res.locals.__('customerNotRegisterThisAccount'),
              SIGN_UP_REDIRECTION
            )
          }

          customerExist = await Customer.findOne({
            where: {
              mobile: reqParam.mobile,
              status: {
                [Op.not]: DELETE,
              },
            },
            order: [['id', 'DESC']],
          }).then((customerData) => customerData)

          if (!customerExist) {
            return Response.successResponseWithoutData(
              res,
              res.locals.__('customerNotRegisterThisAccount'),
              SIGN_UP_REDIRECTION
            )
          }
          if (customerExist.status === INACTIVE) {
            return Response.errorResponseData(
              res,
              res.locals.__('customerInActiveAccount'),
              UNAUTHORIZED
            )
          }
          if (customerExist.status === UN_VERIFY) {
            return Response.successResponseData(
              res,
              {
                is_mobile_verified: 0,
              },
              SUCCESS,
              res.locals.__('mobileIsNotVerified')
            )
          }

          await CustomerAccount.create({
            customer_id: customerExist.id,
            account_id: reqParam.account_id,
            account_type: reqParam.account_type,
          })
            .then((createCustomerAccount) => createCustomerAccount)
            .catch(() => {
              return Response.errorResponseData(
                res,
                res.__('somethingWentWrong')
              )
            })
        }

        if (customerExist) {
          const meta = { token: jwToken.issue(customerExist.id) }

          // save token
          const signUpDetails = JSON.parse(customerExist.signup_details)
          await self
            .saveDeviceToken(
              customerExist.id,
              meta.token,
              signUpDetails.device_type
            )
            .catch(() => {
              return Response.errorResponseData(
                res,
                res.__('somethingWentWrong')
              )
            })

          customerExist.image = helper.mediaUrlForS3(
            CUSTOMER_IMAGE,
            customerExist.image
          )
          customerExist.account_type = reqParam.account_type
          return Response.successResponseData(
            res,
            new Transformer.Single(customerExist, detail).parse(),
            SUCCESS,
            res.locals.__('success'),
            meta
          )
        } else {
          return Response.errorResponseWithoutData(
            res,
            res.locals.__('customerNotRegisterThisAccount'),
            SIGN_UP_REDIRECTION
          )
        }
      }
    })
  },

  /**
   * @description Resend OTP
   * @param req
   * @param res
   */
  resendOTP: async (req, res) => {
    const reqParam = req.body
    // eslint-disable-next-line consistent-return
    resendOTPValidation(reqParam, res, async (validate) => {
      if (validate) {
        const isMobileNoExist = await Customer.findOne({
          where: {
            mobile: reqParam.mobile,
            status: {
              [Op.not]: DELETE,
            },
          },
        }).then((userMobileExistData) => userMobileExistData)

        if (isMobileNoExist) {
          if (isMobileNoExist.status === INACTIVE) {
            return Response.errorResponseData(
              res,
              res.locals.__('customerInActiveAccount'),
              UNAUTHORIZED
            )
          }
          if (new Date().getTime() <= isMobileNoExist.last_otp_sent) {
            return Response.errorResponseWithoutData(
              res,
              res.locals.__('cantSendOTPWithin30seconds'),
              FAIL
            )
          }
          const minutesLater = new Date()
          const verifyToken = await helper.generateMobileOtp(4, reqParam.mobile)
          const verifyTokenExpire = minutesLater.setMinutes(
            minutesLater.getMinutes() + 1440
          )

          // SEND OTP MSG
          const sendMsg = await helper
            .sendOtp(reqParam.mobile, verifyToken)
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
              resend_count: isMobileNoExist.resend_count
                ? isMobileNoExist.resend_count + 1
                : 1,
            },
            {
              where: {
                id: isMobileNoExist.id,
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
              return Response.errorResponseData(
                res,
                res.__('somethingWentWrong')
              )
            })
        } else {
          return Response.successResponseWithoutData(
            res,
            res.locals.__('mobileNotRegisteredWithUs'),
            FAIL
          )
        }
      }
    })
  },

  /**
   * @description Verify Mobile
   * @param req
   * @param res
   */
  verifyMobile: async (req, res) => {
    const reqParam = req.body
    verifyMobileValidation(reqParam, res, async (validate) => {
      if (validate) {
        await Customer.findOne({
          where: {
            mobile: reqParam.mobile,
            status: {
              [Op.not]: DELETE,
            },
          },
        })
          // eslint-disable-next-line consistent-return
          .then(async (customerData) => {
            if (customerData) {
              if (customerData.otp === parseInt(reqParam.otp, 10)) {
                const currentTime = new Date().getTime()
                const resetExpiry = new Date(
                  customerData.reset_expiry
                ).getTime()
                if (currentTime > resetExpiry) {
                  return Response.successResponseWithoutData(
                    res,
                    res.locals.__('otpExpired'),
                    FAIL
                  )
                }

                Customer.update(
                  {
                    status: ACTIVE,
                    otp: null,
                    last_otp_sent: null,
                    reset_expiry: null,
                    resend_count: 0,
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
                      const meta = {
                        token: jwToken.issue(customerData.id),
                      }
                      // save token
                      const signUpDetails = JSON.parse(
                        customerData.signup_details
                      )
                      await self
                        .saveDeviceToken(
                          customerData.id,
                          meta.token,
                          signUpDetails.device_type
                        )
                        .catch(() => {
                          return Response.errorResponseData(
                            res,
                            res.__('somethingWentWrong')
                          )
                        })

                      // eslint-disable-next-line no-param-reassign
                      customerData.image = helper.mediaUrlForS3(
                        CUSTOMER_IMAGE,
                        customerData.image
                      )
                      customerData.dob = customerData.dob
                        ? customerData.dob
                        : ''
                      const customer = await CustomerReferral.findOne({
                        where: {
                          customer_id: customerData.id,
                        },
                      })
                      if (customer) {
                        const customerWallet = {
                          customer_id: customer.ref_customer_id,
                          transaction_type: WALLET_REFFER,
                          description: `${customerData.first_name} use your referral code`,
                          //TODO amount
                          amount: 100,
                        }
                        CustomerWallet.create(customerWallet).then(
                          async (result) => {
                            if (!result) {
                              return Response.errorResponseData(
                                res,
                                res.__('somethingWentWrong')
                              )
                            }
                          }
                        )
                      }

                      return Response.successResponseData(
                        res,
                        new Transformer.Single(customerData, detail).parse(),
                        SUCCESS,
                        res.locals.__('success'),
                        meta
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
                res.locals.__('mobileNotRegisteredWithUs'),
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

  saveDeviceToken: async function (customerId, token, deviceType) {
    return new Promise((resolve, reject) => {
      let deviceTypeStatus
      if (deviceType === 'android') {
        deviceTypeStatus = 1
      } else if (deviceType === 'ios') {
        deviceTypeStatus = 2
      } else {
        deviceTypeStatus = 3
      }
      CustomerLoginToken.findOne({
        where: {
          customer_id: customerId,
          device_type: deviceTypeStatus,
        },
      })
        .then(async (createCustomerLoginToken) => {
          if (createCustomerLoginToken) {
            // Update
            CustomerLoginToken.update(
              {
                token: token,
              },
              {
                where: {
                  id: createCustomerLoginToken.id,
                },
              }
            )
              .then(async () => {
                resolve()
              })
              .catch(() => {
                reject()
              })
          } else {
            // Add
            CustomerLoginToken.create({
              customer_id: customerId,
              token: token,
              device_type: deviceTypeStatus,
            })
              .then(() => {
                resolve()
              })
              .catch(() => {
                reject()
              })
          }
        })
        .catch(() => {
          reject()
        })
    })
  },

  /**
   * @description Forgot password
   * @param req
   * @param res
   */
  forgotPassword: async (req, res) => {
    const reqParam = req.body
    // eslint-disable-next-line consistent-return
    forgotPasswordValidation(reqParam, res, async (validate) => {
      if (validate) {
        const isMobileNoExist = await Customer.findOne({
          where: {
            mobile: reqParam.mobile,
            status: {
              [Op.not]: DELETE,
            },
          },
        }).then((userMobileExistData) => userMobileExistData)

        if (isMobileNoExist) {
          if (isMobileNoExist.status === INACTIVE) {
            return Response.errorResponseData(
              res,
              res.locals.__('customerInActiveAccount'),
              UNAUTHORIZED
            )
          }

          const minutesLater = new Date()
          const resetToken = await helper.generateResetToken(4, reqParam.mobile)
          const resetTokenExpire = minutesLater.setMinutes(
            minutesLater.getMinutes() + 1440
          )

          // SEND OTP MSG
          const sendMsg = await helper
            .sendOtp(reqParam.mobile, resetToken)
            .then((msg) => msg)
          if (!sendMsg) {
            return Response.errorResponseData(res, res.__('somethingWentWrong'))
          }

          Customer.update(
            {
              reset_token: resetToken,
              reset_expiry: resetTokenExpire,
            },
            {
              where: {
                id: isMobileNoExist.id,
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
              return Response.errorResponseData(
                res,
                res.__('somethingWentWrong')
              )
            })
        } else {
          return Response.successResponseWithoutData(
            res,
            res.locals.__('mobileNotRegisteredWithUs'),
            FAIL
          )
        }
      }
    })
  },

  /**
   * @description Reset password
   * @param req
   * @param res
   */
  resetPassword: async (req, res) => {
    const reqParam = req.body
    // eslint-disable-next-line consistent-return
    resetPasswordValidation(reqParam, res, async (validate) => {
      if (validate) {
        const mobile = await Customer.findOne({
          where: {
            mobile: reqParam.mobile,
            status: {
              [Op.not]: DELETE,
            },
          },
        })

        if (mobile) {
          if (mobile.status === ACTIVE) {
            if (mobile.reset_token !== reqParam.otp) {
              return Response.errorResponseData(
                res,
                res.locals.__('invalidOtp'),
                UNAUTHORIZED
              )
            }
            if (
              new Date().getTime() > new Date(mobile.reset_expiry).getTime()
            ) {
              return Response.successResponseWithoutData(
                res,
                res.locals.__('otpExpired'),
                FAIL
              )
            }

            const password = await helper
              .generatePassword(reqParam.password)
              .then((data) => data)
            Customer.update(
              {
                password: password,
                reset_token: null,
                reset_expiry: null,
              },
              {
                where: {
                  id: mobile.id,
                },
              }
            )
              // eslint-disable-next-line consistent-return
              .then(async (result) => {
                if (result) {
                  return Response.successResponseWithoutData(
                    res,
                    res.locals.__('resetPasswordSuccess'),
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
            return Response.successResponseWithoutData(
              res,
              res.locals.__('customerInActiveAccount'),
              FAIL
            )
          }
        } else {
          return Response.successResponseWithoutData(
            res,
            res.locals.__('mobileNotRegisteredWithUs'),
            FAIL
          )
        }
      }
    })
  },
})
