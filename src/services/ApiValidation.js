const Joi = require('@hapi/joi')
const Response = require('./Response')
const Helper = require('./Helper')

module.exports = {
  resendOTPValidation: (req, res, callback) => {
    const schema = Joi.object({
      mobile: Joi.string()
        .trim()
        .min(5)
        .max(15)
        .regex(/^[0-9]*$/)
        .required(),
    })
    const { error } = schema.validate(req)
    if (error) {
      return Response.validationErrorResponseData(
        res,
        res.__(Helper.validationMessageKey('resendOTPValidation', error))
      )
    }
    return callback(true)
  },
  mobileExistValidation: (req, res, callback) => {
    const schema = Joi.object({
      mobile: Joi.string()
        .trim()
        .min(5)
        .max(15)
        .regex(/^[0-9]*$/)
        .required(),
    })
    const { error } = schema.validate(req)
    if (error) {
      return Response.validationErrorResponseData(
        res,
        res.__(Helper.validationMessageKey('mobileExistValidation', error))
      )
    }
    return callback(true)
  },
  normalLoginValidation: (req, res, callback) => {
    const reqObj = {
      type: Joi.number().valid(1, 2).required(),
      mobile: Joi.string()
        .trim()
        .min(5)
        .max(15)
        .regex(/^[0-9]*$/)
        .required(),
      password: Joi.string().optional(),
      otp: Joi.string().optional(),
    }
    if (req.type === 1) {
      reqObj.otp = Joi.string().trim().max(4).required()
    }

    if (req.type === 2) {
      reqObj.password = Joi.string().trim().required()
    }

    const schema = Joi.object(reqObj)
    const { error } = schema.validate(req)
    if (error) {
      return Response.validationErrorResponseData(
        res,
        res.__(Helper.validationMessageKey('normalLoginValidation', error))
      )
    }
    return callback(true)
  },
  signUpValidation: (req, res, callback) => {
    const reqObj = {
      first_name: Joi.string().trim().max(50).required(),
      last_name: Joi.string().trim(),
      mobile: Joi.string()
        .trim()
        .min(5)
        .max(15)
        .regex(/^[0-9]*$/)
        .required(),
      email: Joi.string().optional().allow(''),
      password: Joi.string().optional(),
      account_id: Joi.string().optional(),
      referrer_code: Joi.string().optional(),
      device_type: Joi.string().required().valid('ios', 'android', 'web'),
      account_type: Joi.string().required().valid(1, 2, 3, 4),
    }
    if (req.account_type && req.account_type !== 1) {
      reqObj.account_id = Joi.string().trim().max(150).required()
    } else {
      reqObj.password = Joi.string().min(8).max(100).required()
    }

    if (req.email && req.email !== '') {
      reqObj.email = Joi.string().email().max(200).required()
    }

    const schema = Joi.object(reqObj)
    const { error } = schema.validate(req)
    if (error) {
      return Response.validationErrorResponseData(
        res,
        res.__(Helper.validationMessageKey('signUpValidation', error))
      )
    }
    return callback(true)
  },
  socialLoginValidation: (req, res, callback) => {
    const reqObj = {
      account_type: Joi.string().required().valid(1, 2, 3, 4),
      account_id: Joi.string().trim().required(),
    }
    if (req.mobile && req.mobile !== '') {
      reqObj.mobile = Joi.string()
        .trim()
        .min(5)
        .max(15)
        .regex(/^[0-9]*$/)
        .required()
    }
    const schema = Joi.object(reqObj)
    const { error } = schema.validate(req)
    if (error) {
      return Response.validationErrorResponseData(
        res,
        res.__(Helper.validationMessageKey('socialLoginValidation', error))
      )
    }
    return callback(true)
  },
  verifyMobileValidation: (req, res, callback) => {
    const schema = Joi.object({
      mobile: Joi.string()
        .trim()
        .min(5)
        .max(15)
        .regex(/^[0-9]*$/)
        .required(),
      otp: Joi.string()
        .trim()
        .min(4)
        .max(4)
        .regex(/^[0-9]*$/)
        .required(),
    })
    const { error } = schema.validate(req)
    if (error) {
      return Response.validationErrorResponseData(
        res,
        res.__(Helper.validationMessageKey('verifyMobileValidation', error))
      )
    }
    return callback(true)
  },
  forgotPasswordValidation: (req, res, callback) => {
    const schema = Joi.object({
      mobile: Joi.string()
        .trim()
        .min(5)
        .max(15)
        .regex(/^[0-9]*$/)
        .required(),
    })
    const { error } = schema.validate(req)
    if (error) {
      return Response.validationErrorResponseData(
        res,
        res.__(Helper.validationMessageKey('forgotPasswordValidation', error))
      )
    }
    return callback(true)
  },
  resetPasswordValidation: (req, res, callback) => {
    const schema = Joi.object({
      mobile: Joi.string()
        .trim()
        .min(5)
        .max(15)
        .regex(/^[0-9]*$/)
        .required(),
      otp: Joi.string().trim().max(4).required(),
      password: Joi.string().trim().min(8).max(100).required(),
    })
    const { error } = schema.validate(req)
    if (error) {
      return Response.validationErrorResponseData(
        res,
        res.__(Helper.validationMessageKey('resetPasswordValidation', error))
      )
    }
    return callback(true)
  },
  checkPinCodeValidation: (req, res, callback) => {
    const schema = Joi.object({
      pincode: Joi.string()
        .trim()
        .min(6)
        .max(10)
        .regex(/^[0-9]*$/)
        .required(),
    })
    const { error } = schema.validate(req)
    if (error) {
      return Response.validationErrorResponseData(
        res,
        res.__(Helper.validationMessageKey('checkPinCodeValidation', error))
      )
    }
    return callback(true)
  },
  changePasswordValidation: (req, res, callback) => {
    const schema = Joi.object({
      old_password: Joi.string().trim().max(100).required(),
      password: Joi.string().trim().min(8).max(100).required(),
    })
    const { error } = schema.validate(req)
    if (error) {
      return Response.validationErrorResponseData(
        res,
        res.__(Helper.validationMessageKey('changePasswordValidation', error))
      )
    }
    return callback(true)
  },
  editProfileValidation: (req, res, callback) => {
    const requestObj = {
      first_name: Joi.string().trim().max(50).required(),
      last_name: Joi.string().trim().max(50).required(),
      mobile: Joi.string()
        .trim()
        .min(5)
        .max(15)
        .regex(/^[0-9]*$/)
        .required(),
      email: Joi.string().optional(),
      gender: Joi.number().required().valid(1, 2, 3, 4),
      dob: Joi.date().required(),
    }

    if (req.email && req.email !== '') {
      requestObj.email = Joi.string().email().max(200).required()
    }

    const schema = Joi.object(requestObj)
    const { error } = schema.validate(req)
    if (error) {
      return Response.validationErrorResponseData(
        res,
        res.__(Helper.validationMessageKey('editProfileValidation', error))
      )
    }
    return callback(true)
  },
  verifyNewMobileValidation: (req, res, callback) => {
    const schema = Joi.object({
      otp: Joi.string().trim().min(4).max(4).required(),
    })
    const { error } = schema.validate(req)
    if (error) {
      return Response.validationErrorResponseData(
        res,
        res.__(Helper.validationMessageKey('verifyNewMobileValidation', error))
      )
    }
    return callback(true)
  },
  addEditAddressValidation: (req, res, callback) => {
    const requestObj = {
      receiver_name: Joi.string().trim().required().max(100),
      address_1: Joi.string().trim().required().max(255),
      address_2: Joi.string().required().max(150),
      city: Joi.string().trim().required().max(150),
      state: Joi.string().required(),
      pincode: Joi.string()
        .regex(/^[0-9]*$/)
        .trim()
        .required()
        .min(6)
        .max(6),
      id: Joi.string().optional(),
      mobile_no: Joi.string()
        .trim()
        .min(5)
        .max(15)
        .regex(/^[0-9]*$/)
        .allow(null)
        .allow('')
        .optional(),
    }
    if (req.address_2 && req.address_2 !== '') {
      requestObj.address_2 = Joi.string().trim().required().max(255)
    }
    if (req.id && req.id !== '') {
      requestObj.id = Joi.number().required()
    }
    const schema = Joi.object(requestObj)
    const { error } = schema.validate(req)
    if (error) {
      return Response.validationErrorResponseData(
        res,
        res.__(Helper.validationMessageKey('addEditAddressValidation', error))
      )
    }
    return callback(true)
  },
  saveDeviceTokenValidation: (req, res, callback) => {
    const schema = Joi.object({
      is_logout: Joi.string().required().valid(0, 1),
      device_type: Joi.string().required().valid(1, 2, 3),
      device_token: Joi.string().trim().required(),
    })
    const { error } = schema.validate(req)
    if (error) {
      return Response.validationErrorResponseData(
        res,
        res.__(Helper.validationMessageKey('saveDeviceTokenValidation', error))
      )
    }
    return callback(true)
  },
  favoriteProductValidation: (req, res, callback) => {
    const schema = Joi.object({
      is_move: Joi.required(),
      slug: Joi.string().required(),
      is_favorite: Joi.required(),
      id: Joi.required(),
    })
    const { error } = schema.validate(req)
    if (error) {
      return Response.validationErrorResponseData(
        res,
        res.__(Helper.validationMessageKey('favoriteProductValidation', error))
      )
    }
    return callback(true)
  },
  CartValidations: (req, res, callback) => {
    const schema = Joi.object({
      slug: Joi.required(),
      product_stock_id: Joi.required(),
      product_stock_detail_id: Joi.required(),
      quantity: Joi.required(),
      page: Joi.optional(),
      per_page: Joi.optional(),
    })
    const { error } = schema.validate(req)
    if (error) {
      return Response.validationErrorResponseData(
        res,
        res.__(Helper.validationMessageKey('CartValidations', error))
      )
    }
    return callback(true)
  },
}
