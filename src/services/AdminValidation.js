const Joi = require('@hapi/joi')
const Response = require('./Response')
const Helper = require('./Helper')
const Constants = require('../services/Constants')

module.exports = {
  loginValidation: (req, res, callback) => {
    const schema = Joi.object({
      email: Joi.string().trim().email().max(150).required(),
      password: Joi.string().trim().required(),
    })
    const { error } = schema.validate(req)
    if (error) {
      return Response.validationErrorResponseData(
        res,
        res.__(Helper.validationMessageKey('loginValidation', error))
      )
    }
    return callback(true)
  },

  forgotPasswordValidation: (req, res, callback) => {
    const schema = Joi.object({
      email: Joi.string().trim().email().max(150).required(),
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
      email: Joi.string().trim().email().max(150).required(),
      otp: Joi.string().trim().min(6).max(6).required(),
      password: Joi.string()
        .trim()
        .min(6)
        .required()
        .regex(/^(?=.*[0-9])(?=.*[a-zA-Z])[a-zA-Z0-9!@#$%^&*]{6,}$/),
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

  cmsEditValidation: (req, res, callback) => {
    const schema = Joi.object().keys({
      id: Joi.number().integer().required(),
      title: Joi.string().trim().max(70).required(),
      description: Joi.string().trim().required(),
    })
    const { error } = schema.validate(req)
    if (error) {
      return Response.validationErrorResponseData(
        res,
        res.__(Helper.validationMessageKey('cmsEditValidation', error))
      )
    }
    return callback(true)
  },

  addEditValidationForAdmin: (req, res, callback) => {
    const requestObj = {
      id: Joi.string().optional(),
      name: Joi.string().trim().required(),
      mobile: Joi.string().min(5).max(15).required(),
      email: Joi.string().trim().email().max(150).required(),
      address: Joi.string().required(),
      status: Joi.number()
        .valid(Constants.ACTIVE, Constants.INACTIVE)
        .required(),
      password: Joi.string().allow('').trim(),
      modules: Joi.string().required(),
    }

    if (req.password !== null) {
      requestObj.password = Joi.string()
        .trim()
        .min(6)
        .regex(/^(?=.*[0-9])(?=.*[a-zA-Z])[a-zA-Z0-9!@#$%^&*]{6,}$/)
    }

    if (!req.id) {
      requestObj.password = Joi.string()
        .trim()
        .min(6)
        .required()
        .regex(/^(?=.*[0-9])(?=.*[a-zA-Z])[a-zA-Z0-9!@#$%^&*]{6,}$/)
    }

    const schema = Joi.object(requestObj)
    const { error } = schema.validate(req)
    if (error) {
      return Response.validationErrorResponseData(
        res,
        res.__(Helper.validationMessageKey('addEditAdminValidation', error))
      )
    }
    return callback(true)
  },

  subAdminChangeStatusValidation: (req, res, callback) => {
    const schema = Joi.object().keys({
      status: Joi.number()
        .valid(Constants.ACTIVE, Constants.INACTIVE, Constants.DELETE)
        .required(),
      id: Joi.number().required(),
    })
    const { error } = schema.validate(req)
    if (error) {
      return Response.validationErrorResponseData(
        res,
        res.__(Helper.validationMessageKey('subAdminUpdateStatus', error))
      )
    }
    return callback(true)
  },

  changePasswordValidation: (req, res, callback) => {
    const schema = Joi.object().keys({
      old_password: Joi.string().trim().required(),
      password: Joi.string()
        .trim()
        .min(6)
        .required()
        .regex(/^(?=.*[0-9])(?=.*[a-zA-Z])[a-zA-Z0-9!@#$%^&*]{6,}$/),
    })
    const { error } = schema.validate(req)
    if (error) {
      return Response.validationErrorResponseData(
        res,
        res.__(Helper.validationMessageKey('changePassword', error))
      )
    }
    return callback(true)
  },

  addEditValidationForBrand: (req, res, callback) => {
    const schema = Joi.object({
      id: Joi.string().optional(),
      name: Joi.string().max(100).trim().required(),
      description: Joi.string().required(),
      image: Joi.string().allow('').trim(),
      banner_image: Joi.string().allow('').trim(),
      app_image: Joi.string().allow('').trim(),
      status: Joi.number()
        .valid(Constants.ACTIVE, Constants.INACTIVE)
        .required(),
    })
    const { error } = schema.validate(req)
    if (error) {
      return Response.validationErrorResponseData(
        res,
        res.__(Helper.validationMessageKey('addEditAdminValidation', error))
      )
    }
    return callback(true)
  },

  brandChangeStatusValidation: (req, res, callback) => {
    const schema = Joi.object().keys({
      status: Joi.number()
        .valid(Constants.ACTIVE, Constants.INACTIVE, Constants.DELETE)
        .required(),
      id: Joi.number().required(),
    })
    const { error } = schema.validate(req)
    if (error) {
      return Response.validationErrorResponseData(
        res,
        res.__(Helper.validationMessageKey('brandUpdateStatus', error))
      )
    }
    return callback(true)
  },

  blogChangeStatusValidation: (req, res, callback) => {
    const schema = Joi.object().keys({
      status: Joi.number()
        .valid(Constants.ACTIVE, Constants.INACTIVE, Constants.DELETE)
        .required(),
      id: Joi.number().required(),
    })
    const { error } = schema.validate(req)
    if (error) {
      return Response.validationErrorResponseData(
        res,
        res.__(Helper.validationMessageKey('blogUpdateStatus', error))
      )
    }
    return callback(true)
  },

  blogCategoryChangeStatusValidation: (req, res, callback) => {
    const schema = Joi.object().keys({
      status: Joi.number()
        .valid(Constants.ACTIVE, Constants.INACTIVE, Constants.DELETE)
        .required(),
      id: Joi.number().required(),
    })
    const { error } = schema.validate(req)
    if (error) {
      return Response.validationErrorResponseData(
        res,
        res.__(Helper.validationMessageKey('blogCategoryUpdateStatus', error))
      )
    }
    return callback(true)
  },

  customerChangeStatusValidation: (req, res, callback) => {
    const schema = Joi.object().keys({
      status: Joi.number()
        .valid(Constants.ACTIVE, Constants.INACTIVE, Constants.DELETE)
        .required(),
      id: Joi.number().required(),
    })
    const { error } = schema.validate(req)
    if (error) {
      return Response.validationErrorResponseData(
        res,
        res.__(Helper.validationMessageKey('customerUpdateStatus', error))
      )
    }
    return callback(true)
  },

  productChangeStatusValidation: (req, res, callback) => {
    const schema = Joi.object().keys({
      status: Joi.number()
        .valid(Constants.ACTIVE, Constants.INACTIVE)
        .required(),
      ids: Joi.string().regex(/[0-9]$/),
    })
    const { error } = schema.validate(req)
    if (error) {
      return Response.validationErrorResponseData(
        res,
        res.__(Helper.validationMessageKey('productUpdateStatus', error))
      )
    }
    return callback(true)
  },

  addEditValidationForBlog: (req, res, callback) => {
    const schema = Joi.object({
      id: Joi.string().optional(),
      blog_category_id: Joi.number().integer().required(),
      image: Joi.string().allow('').trim(),
      title: Joi.string().required().max(100).trim(),
      description: Joi.string(),
      reading_minute: Joi.number().integer().required(),
      author_name: Joi.string().required().max(150),
      // mimetype: Joi.string().allow('/').max(10).optional(),
    })
    const { error } = schema.validate(req)
    if (error) {
      return Response.validationErrorResponseData(
        res,
        res.__(Helper.validationMessageKey('addEditBlogValidation', error))
      )
    }
    return callback(true)
  },
  addEditValidationForBlogCategory: (req, res, callback) => {
    const schema = Joi.object({
      id: Joi.string().optional(),
      title: Joi.string().required().max(100).trim(),
      status: Joi.number()
        .valid(Constants.ACTIVE, Constants.INACTIVE)
        .required(),
    })
    const { error } = schema.validate(req)
    if (error) {
      return Response.validationErrorResponseData(
        res,
        res.__(
          Helper.validationMessageKey('addEditBlogCategoryValidation', error)
        )
      )
    }
    return callback(true)
  },

  faqEditValidation: (req, res, callback) => {
    const schema = Joi.object().keys({
      id: Joi.number().integer().optional(),
      title: Joi.string().trim().max(250).required(),
      description: Joi.string().trim().required(),
    })
    const { error } = schema.validate(req)
    if (error) {
      return Response.validationErrorResponseData(
        res,
        res.__(Helper.validationMessageKey('faqEditValidation', error))
      )
    }
    return callback(true)
  },

  addEditValidationForCategory: (req, res, callback) => {
    const requestObj = {
      id: Joi.number().optional(),
      parent_id: Joi.number().optional(),
      name: Joi.string().required().max(50).trim(),
      image: Joi.string().allow('').trim(),
      app_image: Joi.string().allow('').trim(),
      web_image: Joi.string().allow('').trim(),
      description: Joi.string().required().trim(),
      status: Joi.number()
        .valid(Constants.ACTIVE, Constants.INACTIVE)
        .required(),
    }
    const schema = Joi.object(requestObj)
    const { error } = schema.validate(req)
    if (error) {
      return Response.validationErrorResponseData(
        res,
        res.__(Helper.validationMessageKey('categoryValidation', error))
      )
    }
    return callback(true)
  },

  categoryChangeStatusValidation: (req, res, callback) => {
    const schema = Joi.object().keys({
      status: Joi.number()
        .valid(Constants.ACTIVE, Constants.INACTIVE, Constants.DELETE)
        .required(),
      id: Joi.number().required(),
    })
    const { error } = schema.validate(req)
    if (error) {
      return Response.validationErrorResponseData(
        res,
        res.__(Helper.validationMessageKey('blogUpdateStatus', error))
      )
    }
    return callback(true)
  },

  featuredCategoryChangeStatusValidation: (req, res, callback) => {
    const schema = Joi.object().keys({
      status: Joi.number()
        .valid(Constants.ACTIVE, Constants.INACTIVE)
        .required(),
      id: Joi.number().required(),
    })
    const { error } = schema.validate(req)
    if (error) {
      return Response.validationErrorResponseData(
        res,
        res.__(Helper.validationMessageKey('blogUpdateStatus', error))
      )
    }
    return callback(true)
  },

  addEditValidationForSubCategory: (req, res, callback) => {
    const requestObj = {
      id: Joi.string().optional(),
      category_id: Joi.number().required(),
      name: Joi.string().required().max(50).trim(),
      status: Joi.number()
        .valid(Constants.ACTIVE, Constants.INACTIVE)
        .required(),
    }
    const schema = Joi.object(requestObj)
    const { error } = schema.validate(req)
    if (error) {
      return Response.validationErrorResponseData(
        res,
        res.__(Helper.validationMessageKey('subCategoryValidation', error))
      )
    }
    return callback(true)
  },

  addEditValidationForConfig: (req, res, callback) => {
    const validateObj = {
      nutricash_expiry_days: Joi.number().required(),
      refer_earn_type: Joi.number()
        .valid(Constants.NUTRICASH, Constants.FIRST_ORDER_DISCOUNT)
        .required(),
      promo_message: Joi.string().required().max(1000),
      refer_earn_value: Joi.string().allow('').trim(),
    }

    if (
      req.refer_earn_type === Constants.NUTRICASH ||
      req.refer_earn_type === Constants.NUTRICASH.toString()
    ) {
      validateObj.refer_earn_value = Joi.number().required()
    }

    const schema = Joi.object(validateObj)
    const { error } = schema.validate(req)
    if (error) {
      return Response.validationErrorResponseData(
        res,
        res.__(Helper.validationMessageKey('configValidation', error))
      )
    }
    return callback(true)
  },

  addEditValidationForPincode: (req, res, callback) => {
    const requestObj = {
      id: Joi.string().optional(),
      zone: Joi.string().required(),
      pincode: Joi.string().required().max(10),
      is_cod: Joi.number()
        .valid(Constants.ACTIVE, Constants.INACTIVE)
        .required(),
      status: Joi.number()
        .valid(Constants.ACTIVE, Constants.INACTIVE)
        .required(),
    }
    const schema = Joi.object(requestObj)
    const { error } = schema.validate(req)
    if (error) {
      return Response.validationErrorResponseData(
        res,
        res.__(Helper.validationMessageKey('pincodeValidation', error))
      )
    }
    return callback(true)
  },

  pincodeChangeStatusValidation: (req, res, callback) => {
    const schema = Joi.object().keys({
      status: Joi.number()
        .valid(Constants.ACTIVE, Constants.INACTIVE, Constants.DELETE)
        .required(),
      id: Joi.number().required(),
    })
    const { error } = schema.validate(req)
    if (error) {
      return Response.validationErrorResponseData(
        res,
        res.__(Helper.validationMessageKey('pincodeStatus', error))
      )
    }
    return callback(true)
  },

  codChangeStatusValidation: (req, res, callback) => {
    const schema = Joi.object().keys({
      is_cod: Joi.number()
        .valid(Constants.ACTIVE, Constants.INACTIVE, Constants.DELETE)
        .required(),
      id: Joi.string().required(),
    })
    const { error } = schema.validate(req)
    if (error) {
      return Response.validationErrorResponseData(
        res,
        res.__(Helper.validationMessageKey('codValidation', error))
      )
    }
    return callback(true)
  },

  customerCodChangeStatusValidation: (req, res, callback) => {
    const schema = Joi.object().keys({
      is_cod_active: Joi.number().valid(Constants.YES, Constants.NO).required(),
      customer_id: Joi.number().required(),
    })
    const { error } = schema.validate(req)
    if (error) {
      return Response.validationErrorResponseData(
        res,
        res.__(Helper.validationMessageKey('customerCodUpdateStatus', error))
      )
    }
    return callback(true)
  },

  addEditValidationForCustomerWallet: (req, res, callback) => {
    const requestObj = {
      customer_id: Joi.number().integer().required(),
      transaction_type: Joi.number()
        .integer()
        .valid(Constants.WALLET_ADD_BY_ADMIN, Constants.WALLET_REMOVE_BY_ADMIN)
        .required(),
      amount: Joi.number().integer().required(),
      description: Joi.string().required(),
    }
    const schema = Joi.object(requestObj)
    const { error } = schema.validate(req)
    if (error) {
      return Response.validationErrorResponseData(
        res,
        res.__(Helper.validationMessageKey('customerWalletValidation', error))
      )
    }
    return callback(true)
  },

  addEditValidationForCustomerAddress: (req, res, callback) => {
    const requestObj = {
      id: Joi.number().integer(11).optional(),
      customer_id: Joi.number().integer(11).default(0).required(),
      receiver_name: Joi.string().required().max(100).trim(),
      address_1: Joi.string().required().max(255).trim(),
      address_2: Joi.string().optional().max(255).trim(),
      city: Joi.string().required().max(150).trim(),
      pincode: Joi.number().integer(10).required(),
      state: Joi.string().required(),
      mobile_no: Joi.string()
        .regex(/^[0-9]*$/)
        .allow('')
        .optional(),
      status: Joi.number()
        .valid(Constants.ACTIVE, Constants.INACTIVE)
        .required(),
    }
    const schema = Joi.object(requestObj)
    const { error } = schema.validate(req)
    if (error) {
      return Response.validationErrorResponseData(
        res,
        res.__(Helper.validationMessageKey('customerAddressValidation', error))
      )
    }
    return callback(true)
  },

  addEditValidationForBanner: (req, res, callback) => {
    const schema = Joi.object({
      id: Joi.string().optional(),
      title: Joi.string().max(50).trim().required(),
      display_location: Joi.number()
        .valid(Constants.LOCATION_TYPEHOME, Constants.LOCATION_TYPEDEAL)
        .required(),
      image: Joi.string().allow('').trim(),
      app_image: Joi.string().allow('').trim(),
      responsive_image: Joi.string().allow('').trim(),
      link: Joi.string().max(255).required(),
      sequence_number: Joi.number().required(),
      status: Joi.number()
        .valid(Constants.ACTIVE, Constants.INACTIVE)
        .required(),
    })
    const { error } = schema.validate(req)
    if (error) {
      return Response.validationErrorResponseData(
        res,
        res.__(Helper.validationMessageKey('addEditBannerValidation', error))
      )
    }
    return callback(true)
  },

  bannerChangeStatusValidation: (req, res, callback) => {
    const schema = Joi.object().keys({
      status: Joi.number()
        .valid(Constants.ACTIVE, Constants.INACTIVE, Constants.DELETE)
        .required(),
      id: Joi.number().required(),
    })
    const { error } = schema.validate(req)
    if (error) {
      return Response.validationErrorResponseData(
        res,
        res.__(Helper.validationMessageKey('bannerUpdateStatus', error))
      )
    }
    return callback(true)
  },
  addEditValidationForVideo: (req, res, callback) => {
    const requestObj = {
      id: Joi.string().optional(),
      name: Joi.string().required().max(100).trim(),
      link: Joi.string().required().trim(),
      status: Joi.number()
        .valid(Constants.ACTIVE, Constants.INACTIVE)
        .required(),
      video_category: Joi.number()
        .valid(Constants.UNBOXING, Constants.PRODUCT_REVIEW, Constants.TEASOR)
        .required(),
    }
    const schema = Joi.object(requestObj)
    const { error } = schema.validate(req)
    if (error) {
      return Response.validationErrorResponseData(
        res,
        res.__(Helper.validationMessageKey('videoValidation', error))
      )
    }
    return callback(true)
  },
  videoChangeStatusValidation: (req, res, callback) => {
    const schema = Joi.object().keys({
      status: Joi.number()
        .valid(Constants.ACTIVE, Constants.INACTIVE, Constants.DELETE)
        .required(),
      id: Joi.number().required(),
    })
    const { error } = schema.validate(req)
    if (error) {
      return Response.validationErrorResponseData(
        res,
        res.__(Helper.validationMessageKey('videoStatus', error))
      )
    }
    return callback(true)
  },

  addEditValidationForProduct: (req, res, callback) => {
    const requestObj = {
      id: Joi.number().integer(11).optional(),
      name: Joi.string().required().max(250).trim(),
      category_id: Joi.number().required(),
      sub_category_id: Joi.number().required(),
      brand_id: Joi.number().required(),
      how_to_use: Joi.string().required(),
      description: Joi.string().required(),
      authenticity: Joi.string().required(),
      is_cod: Joi.number()
        .valid(Constants.AVAILABLE, Constants.NOT_AVAILABLE)
        .required(),
      delivery_charge: Joi.number().max(10000000).required(),
      ingredients: Joi.array().items(Joi.object().keys().required()).required(),
      return_policy: Joi.string().required(),
      specification_details: Joi.array()
        .items(
          Joi.object({
            key: Joi.string().required().disallow('').trim(),
            value: Joi.string().required().disallow('').trim(),
          })
        )
        .required(),
      country_of_origin: Joi.string().required().disallow('').trim(),
    }
    const schema = Joi.object(requestObj)
    const { error } = schema.validate(req)
    if (error) {
      return Response.validationErrorResponseData(
        res,
        res.__(Helper.validationMessageKey('addEditProductValidation', error))
      )
    }
    return callback(true)
  },
  addEditValidationForProductImageUpload: (req, res, callback) => {
    const schema = Joi.object().keys({
      id: Joi.string().optional(),
      product_id: Joi.number().integer().required(),
      product_stock_id: Joi.number().integer().required(),
      image: Joi.string().allow('').trim().required(),
      sort_order: Joi.number().integer().required(),
      media_type: Joi.number().integer().required(),
    })
    const { error } = schema.validate(req)
    if (error) {
      return Response.validationErrorResponseData(
        res,
        res.__(
          Helper.validationMessageKey('productImageUploadValidation', error)
        )
      )
    }
    return callback(true)
  },
  addEditValidationForFeaturedCategory: (req, res, callback) => {
    const schema = Joi.object({
      id: Joi.string().optional(),
      name: Joi.string().required().max(40).trim(),
      image: Joi.string().allow('').trim(),
      product_ids: Joi.string().required(),
      start_date: Joi.date().iso().required(),
      end_date: Joi.date().iso().greater(Joi.ref('start_date')).required(),
      status: Joi.number()
        .valid(Constants.ACTIVE, Constants.INACTIVE, Constants.DELETE)
        .required(),
      type: Joi.number()
        .valid(
          Constants.TIMER_BASED_FEATURED_CATEGORY,
          Constants.OTHERS_FEATURED_CATEGORY
        )
        .required(),
    })
    const { error } = schema.validate(req)
    if (error) {
      return Response.validationErrorResponseData(
        res,
        res.__(
          Helper.validationMessageKey(
            'addEditFeaturedCategoryValidation',
            error
          )
        )
      )
    }
    return callback(true)
  },

  editValidationForProductDetail: (req, files, res, callback) => {
    const requestObj = {
      product_id: Joi.number().required(),
      tax: Joi.number().max(10000000).required(),
      hsn: Joi.string().allow('').trim().strict(),
      discount_type: Joi.number()
        .valid(Constants.NUTRICASH, Constants.FIRST_ORDER_DISCOUNT)
        .required(),
      freebie: Joi.string().allow('').optional(),
      discount_value: Joi.number().max(10000000).required(),
      deleted_image_ids: Joi.string().allow('').optional(),
      deleted_stock_ids: Joi.string().allow('').optional(),
      deleted_stock_details_ids: Joi.string().allow('').optional(),
      product_stocks: Joi.array()
        .items(
          Joi.object({
            product_stock_id: Joi.number().optional(),
            flavor_id: Joi.number().required(),
            is_default: Joi.number().required(),
            variants: Joi.array().items(
              Joi.object({
                product_stock_detail_id: Joi.number().optional(),
                sku: Joi.string().allow('').trim().strict(),
                upc_code: Joi.string().allow('').trim().strict(),
                size: Joi.string().required().disallow('').trim(),
                serving_day: Joi.number().required(),
                mrp_price: Joi.number().max(9999999).required(),
                customer_price: Joi.number()
                  .max(Joi.ref('mrp_price'))
                  .required(),
                weight: Joi.number().greater(0).required(),
                quantity: Joi.number().max(10000000).optional(),
              })
            ),
          })
        )
        .required(),
    }
    const schema = Joi.object(requestObj)
    const { error } = schema.validate(req)
    if (error) {
      return Response.validationErrorResponseData(
        res,
        res.__(
          Helper.validationMessageKey('editProductDetailsValidation', error)
        )
      )
    }
    return callback(true)
  },
  productInventoryUpdateStatusValidation: (req, res, callback) => {
    const schema = Joi.object().keys({
      status: Joi.number()
        .valid(Constants.ACTIVE, Constants.INACTIVE)
        .required(),
      id: Joi.number().required(),
    })
    const { error } = schema.validate(req)
    if (error) {
      return Response.validationErrorResponseData(
        res,
        res.__(
          Helper.validationMessageKey(
            'productInventoryUpdateStatusValidation',
            error
          )
        )
      )
    }
    return callback(true)
  },

  addEditValidationForOffers: (req, res, callback) => {
    let additionalObj = {}
    const commonObj = {
      id: Joi.number().integer().optional(),
      offer_type: Joi.number().required(),
      name: Joi.string().trim().required(),
      discount_unit: Joi.number()
        .valid(Constants.PERCENTAGE, Constants.FLAT_OFF)
        .required(),
      terms_condition: Joi.string().trim().required(),
      start_date: Joi.date().iso().required(),
      end_date: Joi.date().iso().greater(Joi.ref('start_date')).required(),
      device: Joi.number().integer().required(),
      user_type: Joi.number().integer().required(),
      image: Joi.string().allow('').trim(),
      status: Joi.number()
        .valid(Constants.ACTIVE, Constants.INACTIVE)
        .required(),
    }

    if (parseInt(req.offer_type, 10) === Constants.BULK_OFFER) {
      additionalObj = {
        ...commonObj,
        product_id: Joi.string().required(),
        bulk_product_number: Joi.string().required(),
      }
    }

    if (parseInt(req.offer_type, 10) === Constants.PAYMENT_OFFER) {
      additionalObj = {
        ...commonObj,
        discount: Joi.number().integer().required(),
        minimum_order_amount: Joi.number().integer().required(),
        maximum_discount: Joi.number().integer().required(),
        maximum_usage: Joi.number().integer().required(),
        payment_method_ids: Joi.string().required(),
      }
    }

    if (parseInt(req.offer_type, 10) === Constants.COUPON_CODE_OFFER) {
      additionalObj = {
        ...commonObj,
        discount: Joi.number().integer().required(),
        coupon_code: Joi.string().trim().required(),
        maximum_usage: Joi.number().integer().required(),
        minimum_order_amount: Joi.number().required(),
        maximum_discount: Joi.number().required(),
        product_category_id: Joi.string().required(),
        product_subcategory_id: Joi.string().required(),
        product_brand_id: Joi.string().required(),
      }
    }
    const schema = Joi.object(additionalObj)
    const { error } = schema.validate(req)
    if (error) {
      return Response.validationErrorResponseData(
        res,
        res.__(Helper.validationMessageKey('OfferValidation', error))
      )
    }
    return callback(true)
  },

  imageUploadValidation: (req, res, callback) => {
    const requestObj = {
      id: Joi.string().trim().required(),
      type: Joi.number().required(),
      image: Joi.string().allow('').trim().required(),
      module: Joi.string()
        .valid(
          Constants.MODEL_NAME.BRAND,
          Constants.MODEL_NAME.BLOG,
          Constants.MODEL_NAME.BlOG_CATEGORY,
          Constants.MODEL_NAME.BANNER,
          Constants.MODEL_NAME.FEATURE_CATEGORY,
          Constants.MODEL_NAME.PRODUCT,
          Constants.MODEL_NAME.CATEGORY,
          Constants.MODEL_NAME.OFFERS,
          Constants.MODEL_NAME.CUSTOMER
        )
        .required(),
    }
    const schema = Joi.object(requestObj)
    const { error } = schema.validate(req)
    if (error) {
      return Response.validationErrorResponseData(
        res,
        res.__(Helper.validationMessageKey('imageUploadValidation', error))
      )
    }
    return callback(true)
  },
  addProductInventoryValidation: (req, res, callback) => {
    const schema = Joi.object().keys({
      data: Joi.array()
        .items({
          product_id: Joi.number().required(),
          flavor_id: Joi.number().required(),
          product_stock_detail_id: Joi.number().required(),
          total_quantity: Joi.number().max(10000000).required(),
          expiry: Joi.string().required(),
          batch_no: Joi.string().required(),
          sale_offline: Joi.number()
            .valid(Constants.ACTIVE, Constants.INACTIVE)
            .required(),
        })
        .required(),
    })
    const { error } = schema.validate(req)
    if (error) {
      return Response.validationErrorResponseData(
        res,
        res.__(
          Helper.validationMessageKey('addProductInventoryValidation', error)
        )
      )
    }
    return callback(true)
  },
  deductProductInventoryValidation: (req, res, callback) => {
    const schema = Joi.object().keys({
      party_name: Joi.string().trim().required(),
      data: Joi.array()
        .items({
          product_id: Joi.number().required(),
          flavor_id: Joi.number().required(),
          product_stock_detail_id: Joi.number().required(),
          total_quantity: Joi.number().max(10000000).required(),
          batch_no: Joi.string().required(),
          expiry_date: Joi.string().allow('').optional(),
        })
        .required(),
    })
    const { error } = schema.validate(req)
    if (error) {
      return Response.validationErrorResponseData(
        res,
        res.__(
          Helper.validationMessageKey('deductProductInventoryValidation', error)
        )
      )
    }
    return callback(true)
  },
  addScanProductValidation: (req, res, callback) => {
    const schema = Joi.object().keys({
      name: Joi.string().trim().required(),
      flavor_id: Joi.number().required(),
      quantity: Joi.number().max(10000000).required(),
      upc_code: Joi.string().trim().required(),
      size: Joi.string().trim().required(),
      batch_no: Joi.string().trim().required(),
      expiry: Joi.string().trim().required(),
    })
    const { error } = schema.validate(req)
    if (error) {
      return Response.validationErrorResponseData(
        res,
        res.__(Helper.validationMessageKey('addScanProductValidation', error))
      )
    }
    return callback(true)
  },
  sendPushNotificationValidation: (req, res, callback) => {
    let additionalObj = {}
    const commonObj = {
      specific_type: Joi.string().required(),
      order_csv: Joi.string().allow('').trim(),
      customer_csv: Joi.string().allow('').trim(),
      push_notification_content: Joi.string().trim().required(),
      push_notification_title: Joi.string().trim().required(),
    }
    if (
      parseInt(req.specific_type, 10) ===
      Constants.SEND_NOTIFICATION.CUSTOMER_SPECIFIC
    ) {
      additionalObj = {
        ...commonObj,
        customer_type: Joi.number()
          .valid(
            Constants.SEND_NOTIFICATION_USER_TYPE.SPECIFIC_CUSTOMER,
            Constants.SEND_NOTIFICATION_USER_TYPE.NEW_CUSTOMER,
            Constants.SEND_NOTIFICATION_USER_TYPE.ALL_CUSTOMER,
            Constants.SEND_NOTIFICATION_USER_TYPE.OLD_CUSTOMER
          )
          .required(),
      }
    }

    additionalObj = {
      ...additionalObj,
      ...commonObj,
    }

    const schema = Joi.object(additionalObj)
    const { error } = schema.validate(req)
    if (error) {
      return Response.validationErrorResponseData(
        res,
        res.__(Helper.validationMessageKey('NotificationValidation', error))
      )
    }
    return callback(true)
  },
}
