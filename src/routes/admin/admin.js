const router = require('express').Router()
const formidableMiddleware = require('express-formidable')
const connect = require('connect')
const helper = require('../../services/Helper')
const {
  adminTokenAuth,
  privilegeMiddleware,
} = require('../../middlewares/admin')
const {
  login,
  forgotPassword,
  resetPassword,
  changePassword,
  adminModuleList,
  adminDetail,
} = require('../../controllers/admin/AuthController')
const {
  subAdminAddEdit,
  subAdminList,
  subAdminDetail,
  subAdminUpdateStatus,
} = require('../../controllers/admin/SubAdminController')
const {
  cmsList,
  cmsEdit,
  cmsDetail,
} = require('../../controllers/admin/CmsController')
const {
  faqList,
  faqAddEdit,
  deleteFaq,
  faqDetails,
} = require('../../controllers/admin/FaqsController')
const { MODULE } = require('../../services/Constants')
const {
  brandList,
  brandAddEdit,
  brandUpdateStatus,
  brandDetail,
  activeBrandList,
} = require('../../controllers/admin/BrandController')
const {
  blogList,
  blogAddEdit,
  blogUpdateStatus,
  blogDetail,
} = require('../../controllers/admin/BlogController')
const {
  pincodeList,
  pincodeAddEdit,
  UpdateStatus,
  pincodeDetails,
  UpdateCODStatus,
  ImportPincode,
  downloadSamplePincode,
} = require('../../controllers/admin/PincodeController')
const {
  customerWalletHistory,
  CustomerWalletAddRemove,
} = require('../../controllers/admin/CustomerWalletController')
const {
  productList,
  addEditProduct,
  activeProductList,
  productUpdateStatus,
  deleteProduct,
  productDetail,
  viewEditProductDetail,
  updateProductSequenceInBrand,
  updateProductSequenceInSubCategory,
  sortedProductsInSubCategory,
  sortedProductsInBrand,
  flavourList,
  editProductDetail,
  productUploadImage,
} = require('../../controllers/admin/ProductController')
const {
  featureProducts,
  deleteFeaturedProduct,
  featuredCategoryAddEdit,
  featuredCategoryDetail,
  featuredCategoryList,
  featuredCategoryUpdateStatus,
  updateFeaturedProductSequence,
} = require('../../controllers/admin/FeatureCategoryController')
const {
  bannersList,
  bannerAddEdit,
  bannerDetail,
  bannerUpdateStatus,
} = require('../../controllers/admin/BannerController')
const {
  authenticityVideoList,
  authenticityVideoAddEdit,
  authenticityVideoDetails,
  UpdateAuthenticityVideoStatus,
} = require('../../controllers/admin/AuthenticityVideoController')
const {
  categoryList,
  categoryAddEdit,
  categoryUpdateStatus,
  subCategoryList,
  categoryDetail,
  activeCategoryList,
  activeSubCategoryList,
  activeSubCategoryListFromParentID,
} = require('../../controllers/admin/CategoryController')
const {
  getConfig,
  setConfig,
} = require('../../controllers/admin/ConfigController')
const {
  customerList,
  customerUpdateStatus,
  customerDetail,
  customerCodUpdateStatus,
  customerAddressAddEdit,
  customerAddressList,
  customerAddressDetail,
} = require('../../controllers/admin/CustomerController')
const {
  blogCategoryList,
  blogCategoryAddEdit,
  blogCategoryUpdateStatus,
  activeBlogCategoryList,
  blogCategoryDetail,
} = require('../../controllers/admin/BlogCategoryController')

const {
  productInventorySearch,
  productInventoryList,
  productInventoryUpdateStatus,
  productInventoryLogList,
  outOfStockProductInventoryList,
  addProductInventory,
  deductProductInventory,
  addScanProduct,
} = require('../../controllers/admin/ProductInventoryController')

const {
  offersList,
  offerAddEdit,
  deleteOffers,
  offerDetail,
  paymentGatewayList,
} = require('../../controllers/admin/OffersController')
const {
  imageUpload,
  getUploadURL,
} = require('../../controllers/commonController')
const {
  notificationList,
  notificationDelete,
  sendNotification,
  downloadCustomerCsv,
  downloadOrderCsv,
} = require('../../controllers/admin/NotificationController')
const { dashboard } = require('../../controllers/admin/DashboardController')

const authMiddleware = (() => {
  const chain = connect()
  ;[formidableMiddleware(), adminTokenAuth].forEach((middleware) => {
    chain.use(middleware)
  })
  return chain
})()

const authMiddlewareWithoutFormidable = (() => {
  const chain = connect()
  ;[adminTokenAuth].forEach((middleware) => {
    chain.use(middleware)
  })
  return chain
})()

router.post('/login', formidableMiddleware(), login)
router.post('/forgot-password', formidableMiddleware(), forgotPassword)
router.post('/reset-password', formidableMiddleware(), resetPassword)
router.post('/change-password', authMiddleware, changePassword)
router.get('/modules', authMiddleware, adminModuleList)
router.get('/admin-detail', authMiddleware, adminDetail)

router.get('/faq-list', authMiddleware, faqList)
router.post('/faq-add-edit', authMiddleware, faqAddEdit)
router.post('/faq/delete', authMiddleware, deleteFaq)
router.get('/faq-detail/:id', authMiddleware, faqDetails)

router.get('/cms', authMiddleware, privilegeMiddleware(MODULE.CMS), cmsList)
router.post('/cms', authMiddleware, privilegeMiddleware(MODULE.CMS), cmsEdit)
router.get(
  '/cms/:id',
  authMiddleware,
  privilegeMiddleware(MODULE.CMS),
  cmsDetail
)

router.post(
  '/sub-admin',
  authMiddleware,
  privilegeMiddleware(MODULE.SUB_ADMIN),
  subAdminAddEdit
)
router.get(
  '/sub-admin',
  authMiddleware,
  privilegeMiddleware(MODULE.SUB_ADMIN),
  subAdminList
)
router.get(
  '/sub-admin/:id',
  authMiddleware,
  privilegeMiddleware(MODULE.SUB_ADMIN),
  subAdminDetail
)
router.post(
  '/sub-admin-update-status',
  authMiddleware,
  privilegeMiddleware(MODULE.SUB_ADMIN),
  subAdminUpdateStatus
)

router.get(
  '/brand',
  authMiddleware,
  privilegeMiddleware(MODULE.BRAND),
  brandList
)
router.post(
  '/brand',
  authMiddleware,
  privilegeMiddleware(MODULE.BRAND),
  brandAddEdit
)
router.post(
  '/brand-update-status',
  authMiddleware,
  privilegeMiddleware(MODULE.BRAND),
  brandUpdateStatus
)
router.get(
  '/brand/:id',
  authMiddleware,
  privilegeMiddleware(MODULE.BRAND),
  brandDetail
)

router.get('/blog', authMiddleware, privilegeMiddleware(MODULE.BLOG), blogList)
router.post(
  '/blog',
  authMiddleware,
  privilegeMiddleware(MODULE.BLOG),
  blogAddEdit
)
router.post(
  '/blog-update-status',
  authMiddleware,
  privilegeMiddleware(MODULE.BLOG),
  blogUpdateStatus
)
router.get(
  '/blog/:id',
  authMiddleware,
  privilegeMiddleware(MODULE.BLOG),
  blogDetail
)

router.get(
  '/blog-category',
  authMiddleware,
  privilegeMiddleware(MODULE.BlOG_CATEGORY),
  blogCategoryList
)
router.post(
  '/blog-category',
  authMiddleware,
  privilegeMiddleware(MODULE.BlOG_CATEGORY),
  blogCategoryAddEdit
)
router.post(
  '/blog-category-update-status',
  authMiddleware,
  privilegeMiddleware(MODULE.BlOG_CATEGORY),
  blogCategoryUpdateStatus
)

router.get(
  '/blog-category/:id',
  authMiddleware,
  privilegeMiddleware(MODULE.BlOG_CATEGORY),
  blogCategoryDetail
)

router.get(
  '/active-blog-category',
  authMiddleware,
  privilegeMiddleware(MODULE.BlOG_CATEGORY),
  activeBlogCategoryList
)

router.get(
  '/category',
  authMiddleware,
  privilegeMiddleware(MODULE.PRODUCT_CATEGORY),
  categoryList
)
router.post(
  '/category',
  authMiddleware,
  privilegeMiddleware(MODULE.PRODUCT_CATEGORY),
  categoryAddEdit
)
router.post(
  '/category-update-status',
  authMiddleware,
  privilegeMiddleware(MODULE.PRODUCT_CATEGORY),
  categoryUpdateStatus
)
router.get(
  '/category/:id',
  authMiddleware,
  privilegeMiddleware(MODULE.PRODUCT_CATEGORY),
  categoryDetail
)
router.get(
  '/sub-category',
  authMiddleware,
  privilegeMiddleware(MODULE.PRODUCT_CATEGORY),
  subCategoryList
)

router.get('/get-config', authMiddleware, getConfig)
router.post('/set-config', authMiddleware, setConfig)

router.get(
  '/customer-address-list/:id',
  authMiddleware,
  privilegeMiddleware(MODULE.CUSTOMER),
  customerAddressList
)
router.get(
  '/customer-address-detail/:id',
  authMiddleware,
  privilegeMiddleware(MODULE.CUSTOMER),
  customerAddressDetail
)

router.get(
  '/customer',
  authMiddleware,
  privilegeMiddleware(MODULE.CUSTOMER),
  customerList
)

router.post(
  '/customer-update-status',
  authMiddleware,
  privilegeMiddleware(MODULE.CUSTOMER),
  customerUpdateStatus
)

router.get(
  '/customer/:id',
  authMiddleware,
  privilegeMiddleware(MODULE.PRODUCT_CATEGORY),
  customerDetail
)
router.post(
  '/customer-update-cod',
  privilegeMiddleware(MODULE.CUSTOMER),
  authMiddleware,
  customerCodUpdateStatus
)

router.get('/pincode-list', authMiddleware, pincodeList)
router.post('/pincode', authMiddleware, pincodeAddEdit)
router.post('/pincode-status', authMiddleware, UpdateStatus)
router.get('/pincode/:id', authMiddleware, pincodeDetails)
router.post('/pincode-cod', authMiddleware, UpdateCODStatus)
router.post('/import-pincode', authMiddleware, ImportPincode)

router.get(
  '/wallet-history',
  authMiddleware,
  privilegeMiddleware(MODULE.CUSTOMER),
  customerWalletHistory
)
router.post(
  '/customer-wallet',
  authMiddleware,
  privilegeMiddleware(MODULE.CUSTOMER),
  CustomerWalletAddRemove
)
router.post(
  '/customer-address',
  authMiddleware,
  privilegeMiddleware(MODULE.CUSTOMER),
  customerAddressAddEdit
)

router.get('/banner', authMiddleware, bannersList)
router.post('/banner', authMiddleware, bannerAddEdit)
router.get('/banner/:id', authMiddleware, bannerDetail)
router.post('/banner-status', authMiddleware, bannerUpdateStatus)

router.get(
  '/products',
  authMiddleware,
  privilegeMiddleware(MODULE.PRODUCTS),
  productList
)

router.get(
  '/active-products',
  authMiddleware,
  privilegeMiddleware(MODULE.PRODUCTS),
  activeProductList
)

router.post(
  '/product',
  authMiddlewareWithoutFormidable,
  privilegeMiddleware(MODULE.PRODUCTS),
  addEditProduct
)

router.post(
  '/edit-product-detail',
  authMiddlewareWithoutFormidable,
  privilegeMiddleware(MODULE.PRODUCTS),
  editProductDetail
)

router.post(
  '/product-update-status',
  authMiddleware,
  privilegeMiddleware(MODULE.PRODUCTS),
  productUpdateStatus
)

router.get(
  '/delete-product/:id',
  authMiddleware,
  privilegeMiddleware(MODULE.PRODUCTS),
  deleteProduct
)

router.get(
  '/product-detail/:id',
  authMiddleware,
  privilegeMiddleware(MODULE.PRODUCTS),
  productDetail
)

router.get(
  '/view-edit-product-detail/:id',
  authMiddleware,
  privilegeMiddleware(MODULE.PRODUCTS),
  viewEditProductDetail
)

router.post(
  '/update-product-sequence-in-brand',
  authMiddlewareWithoutFormidable,
  privilegeMiddleware(MODULE.BRAND),
  updateProductSequenceInBrand
)
router.post(
  '/update-product-sequence-in-sub-category',
  authMiddlewareWithoutFormidable,
  privilegeMiddleware(MODULE.CATEGORY),
  updateProductSequenceInSubCategory
)

router.get(
  '/sorted-products-in-category/:sub_category_id',
  authMiddlewareWithoutFormidable,
  privilegeMiddleware(MODULE.BRAND),
  sortedProductsInSubCategory
)
router.get(
  '/sorted-products-in-brand/:brand_id',
  authMiddleware,
  privilegeMiddleware(MODULE.PRODUCTS),
  sortedProductsInBrand
)

router.get(
  '/feature-products',
  authMiddleware,
  privilegeMiddleware(MODULE.PRODUCTS),
  featureProducts
)
router.get(
  '/delete-featured-product/:id',
  authMiddleware,
  privilegeMiddleware(MODULE.PRODUCTS),
  deleteFeaturedProduct
)

router.post(
  '/feature-category',
  authMiddleware,
  privilegeMiddleware(MODULE.PRODUCTS),
  featuredCategoryAddEdit
)

router.get(
  '/featured-category-list',
  authMiddleware,
  privilegeMiddleware(MODULE.PRODUCT_CATEGORY),
  featuredCategoryList
)

router.get(
  '/featured-category/:id',
  authMiddleware,
  privilegeMiddleware(MODULE.PRODUCT_CATEGORY),
  featuredCategoryDetail
)

router.post(
  '/featured-category-update-status',
  authMiddleware,
  privilegeMiddleware(MODULE.PRODUCT_CATEGORY),
  featuredCategoryUpdateStatus
)

router.post(
  '/featured-product-update-sequence',
  authMiddlewareWithoutFormidable,
  privilegeMiddleware(MODULE.PRODUCT_CATEGORY),
  updateFeaturedProductSequence
)

router.get(
  '/active-category',
  authMiddleware,
  privilegeMiddleware(MODULE.PRODUCTS),
  activeCategoryList
)

router.get(
  '/active-sub-category',
  authMiddleware,
  privilegeMiddleware(MODULE.PRODUCTS),
  activeSubCategoryList
)

router.post(
  '/active-sub-category-from-parent-id',
  authMiddleware,
  privilegeMiddleware(MODULE.PRODUCTS),
  activeSubCategoryListFromParentID
)

router.get(
  '/active-brands',
  authMiddleware,
  privilegeMiddleware(MODULE.PRODUCTS),
  activeBrandList
)

router.get('/video-list', authMiddleware, authenticityVideoList)
router.post('/video', authMiddleware, authenticityVideoAddEdit)
router.get('/video/:id', authMiddleware, authenticityVideoDetails)
router.post('/video-status', authMiddleware, UpdateAuthenticityVideoStatus)

router.get('/inventory/search', authMiddleware, productInventorySearch)
router.get('/inventory', authMiddleware, productInventoryList)
router.post(
  '/inventory/change-status',
  authMiddleware,
  productInventoryUpdateStatus
)
router.get('/inventory/log/:logType', authMiddleware, productInventoryLogList)
router.post(
  '/inventory/product/scan',
  authMiddlewareWithoutFormidable,
  addScanProduct
)
router.get(
  '/inventory/out-of-stock',
  authMiddleware,
  outOfStockProductInventoryList
)
router.post(
  '/inventory/add',
  authMiddlewareWithoutFormidable,
  addProductInventory
)
router.post(
  '/inventory/deduct',
  authMiddlewareWithoutFormidable,
  deductProductInventory
)

router.get(
  '/offers',
  authMiddleware,
  privilegeMiddleware(MODULE.OFFERS),
  offersList
)

router.post(
  '/offer',
  authMiddleware,
  privilegeMiddleware(MODULE.OFFERS),
  offerAddEdit
)

router.post('/upload-image', formidableMiddleware(), imageUpload)

router.get(
  '/delete-offers/:id',
  authMiddleware,
  privilegeMiddleware(MODULE.OFFERS),
  deleteOffers
)

router.get(
  '/flavour-list',
  authMiddleware,
  privilegeMiddleware(MODULE.PRODUCTS),
  flavourList
)

router.get(
  '/offer/:id',
  authMiddleware,
  privilegeMiddleware(MODULE.OFFERS),
  offerDetail
)

router.get('/get-sign-url/:type', authMiddleware, getUploadURL)
router.post(
  '/product-upload-image',
  authMiddleware,
  privilegeMiddleware(MODULE.PRODUCTS),
  productUploadImage
)

router.get(
  '/notification-list',
  authMiddleware,
  privilegeMiddleware(MODULE.ADMIN),
  notificationList
)

router.get(
  '/notification-delete/:id',
  authMiddleware,
  privilegeMiddleware(MODULE.ADMIN),
  notificationDelete
)
router.post(
  '/send-notification',
  authMiddleware,
  privilegeMiddleware(MODULE.ADMIN),
  sendNotification
)
router.get(
  '/dashboard',
  authMiddleware,
  privilegeMiddleware(MODULE.DASHBOARD),
  dashboard
)
router.get(
  '/payment-gateways',
  authMiddleware,
  privilegeMiddleware(MODULE.OFFERS),
  paymentGatewayList
)
module.exports = router
