const router = require('express').Router()
const formidableMiddleware = require('express-formidable')
const connect = require('connect')
const { apiTokenAuth, apiOptionalTokenAuth } = require('../../middlewares/api')
const BrandController = require('../../controllers/api/v1/BrandController')
const BlogController = require('../../controllers/api/v1/BlogController')
const AuthController = require('../../controllers/api/v1/AuthController')
const UserController = require('../../controllers/api/v1/UserController')
const MasterController = require('../../controllers/api/v1/MasterController')
const CategoryController = require('../../controllers/api/v1/CategoryController')
const AddressController = require('../../controllers/api/v1/AddressController')
const VideoController = require('../../controllers/api/v1/VideoController')
const BannerController = require('../../controllers/api/v1/BannerController')
const CommonController = require('../../controllers/commonController')
const HomePageController = require('../../controllers/api/v1/HomePageController')
const OffersController = require('../../controllers/api/v1/OffersController')
const ProductController = require('../../controllers/api/v1/ProductController')
const CartController = require('../../controllers/api/v1/CartController')
const FeatureCategoryController = require('../../controllers/api/v1/FeatureCategoryController')
const PaymentController = require('../../controllers/api/v1/PaymentController')

const authMiddlewareWithFormidable = (() => {
  const chain = connect()
  ;[formidableMiddleware(), apiTokenAuth].forEach((middleware) => {
    chain.use(middleware)
  })
  return chain
})()

const authOptionalMiddleware = (() => {
  const chain = connect()
  ;[apiOptionalTokenAuth].forEach((middleware) => {
    chain.use(middleware)
  })
  return chain
})()

const authMiddleware = (() => {
  const chain = connect()
  ;[apiTokenAuth].forEach((middleware) => {
    chain.use(middleware)
  })
  return chain
})()

module.exports = router

router.get('/cms/:seo_url?', MasterController.cms)
router.post('/brand-list', BrandController.get)

// Category
router.post('/category', CategoryController.get)

router.post(
  '/sub-category/:slug',
  authOptionalMiddleware,
  CategoryController.detailOnSubCategory
)

router.get('/blogs', BlogController.get)
router.get('/blogs/:slug', BlogController.detail)

// Sign up
router.post('/check-mobile', AuthController.checkMobile)
router.post('/sign-up', AuthController.signUp)
router.post('/login', AuthController.normalLogin)
router.post('/social-login', AuthController.socialLogin)
router.post('/verify-mobile', AuthController.verifyMobile)
router.post('/resend-otp', AuthController.resendOTP)
router.post('/forgot-password', AuthController.forgotPassword)
router.post('/reset-password', AuthController.resetPassword)

// AFTER LOGIN
router.post('/check-pincode', authMiddleware, UserController.checkPinCode)
router.post('/change-password', authMiddleware, UserController.changePassword)
router.get('/wallet', authMiddleware, UserController.getWalletDetails)
router.post(
  '/save-device-token',
  authMiddleware,
  UserController.saveDeviceToken
)
router.get('/profile', authMiddleware, UserController.myProfile)
router.post('/edit-profile', authMiddleware, UserController.editProfile)
router.post(
  '/verify-new-mobile',
  authMiddleware,
  UserController.verifyNewMobile
)
router.post(
  '/send-new-mobile-otp',
  authMiddleware,
  UserController.resendNewMobileVerifyOTP
)

// Address
router.post(
  '/address/add-edit',
  authMiddleware,
  AddressController.addEditAddress
)
router.get('/address', authMiddleware, AddressController.get)
router.get('/address/:id', authMiddleware, AddressController.detail)
router.delete('/address/:id', authMiddleware, AddressController.delete)

// Config
router.get('/config', authMiddleware, MasterController.config)

// Video
router.get('/video/:video_category?', authMiddleware, VideoController.get)

// Banner
router.get('/banner', authMiddleware, BannerController.bannersList)

// Image Upload
router.post(
  '/upload-image',
  authMiddlewareWithFormidable,
  CommonController.imageUpload
)

router.get('/home', authMiddleware, HomePageController.getHomeContant)
router.get('/blog-category', BlogController.getBlogCategory)
router.post('/blog-by-category', BlogController.getBlogByCategory)

router.get('/offers', OffersController.getOffresListByType)
router.get('/offer-detail/:id', OffersController.offerDetail)
router.get('/coupon-code-detail/:name', OffersController.couponCodeDetail)
router.post(
  '/product-by-offers/:id',
  authMiddleware,
  OffersController.getProductListByOffer
)
router.post(
  '/get-favorite-product',
  authMiddleware,
  ProductController.getFavoriteProduct
)
router.get(
  '/get-product/:slug',
  authMiddleware,
  ProductController.displayProduct
)
router.post(
  '/add-favorite',
  authMiddleware,
  ProductController.addFavoriteProduct
)
router.post('/brand/:slug', authMiddleware, BrandController.getBrandDetail)
router.post('/add-edit-cart', authMiddleware, CartController.addProductToCart)
router.delete(
  '/delete-cart',
  authMiddleware,
  CartController.deleteProductInCart
)
router.post('/get-cart', authMiddleware, CartController.getCart)
router.post('/get-cart-total', CartController.getCartTotal)
router.post(
  '/get-feturecategory-product',
  authMiddleware,
  FeatureCategoryController.fixFetureCategoryProduct
)
/*router.post(
  '/add-remove-nutricash',
  authMiddleware,
  CartController.addRemoveNutricash
)*/

router.get(
  '/payment-gateway-list',
  authMiddleware,
  PaymentController.paymentList
)
router.get('/bank-list', authMiddleware, PaymentController.bankList)
