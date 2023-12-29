module.exports = {
  YES: 1,
  NO: 0,
  SUPER_ADMIN: 1,
  SUB_ADMIN: 2,
  SIGN_UP_REDIRECTION: 10,
  SUCCESS: 1,
  FAIL: 0,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  PAGE_NOT_FOUND: 404,
  NOT_ACCEPTABLE: 406,
  ACTIVE: 1,
  UN_VERIFY: 4,
  INACTIVE: 0,
  DELETE: 2,
  INTERNAL_SERVER: 500,
  PER_PAGE: 10,
  HOME_PER_PAGE: 8,
  DEFAULT_PAGE: 1,
  NOT_VERIFIED: 0,
  VERIFIED: 1,
  WALLET_ADD_BY_ADMIN: 1,
  WALLET_REMOVE_BY_ADMIN: 2,
  WALLET_PURCHASE: 3,
  WALLET_REFFER: 4,
  WALLET_ORDER_REFFER: 5,
  PENDING: 3,
  AVAILABLE: 1,
  NOT_AVAILABLE: 0,
  EMAIL_TEMPLATE: {
    ADMIN_FORGOT_PASSWORD: 'forgot-password-for-admin',
    GENERATE_PASSWORD: 'generate-password-for-sub-admin',
  },
  NUTRICASH: 1,
  FIRST_ORDER_DISCOUNT: 2,
  BRAND_IMAGE: 'brand',
  CUSTOMER_IMAGE: 'customer',
  BRAND_BANNER_IMAGE: 'brand/banner',
  BRAND_APP_IMAGE: 'brand/app',
  BLOG_IMAGE: 'blog',
  CATEGORY_IMAGE: 'category',
  //CATEGORY_BANNER_IMAGE: 'category/banner',
  CATEGORY_APP_IMAGE: 'category/app',
  CATEGORY_WEB_IMAGE: 'category/web',
  CATEGORY_ICON_IMAGE: 'category/icon',
  PINCODE: 'pincode',
  NOTIFICATION: 'notification/csv',
  PRODUCT_DISPLAY_IMAGE: 'product',
  PRODUCT_STOCKS_DETAIL_IMAGE: 'product/stocks',
  IMAGE: 'image',
  MODULE: {
    BRAND: 'brand',
    DASHBOARD: 'dashboard',
    BLOG: 'blog',
    BlOG_CATEGORY: 'blog_category',
    ADMIN: 'admin',
    CATEGORY: 'category',
    CMS: 'cms',
    SUB_ADMIN: 'sub_admin',
    SUB_CATEGORY: 'sub_category',
    VENDOR: 'vendor',
    CUSTOMER: 'customer',
    PRODUCT_CATEGORY: 'product_category',
    PRODUCTS: 'products',
    INVENTORY: 'inventory',
    ORDERS: 'orders',
    OFFERS: 'offers',
    REFUNDS: 'refunds',
  },
  MODEL_NAME: {
    BRAND: 'Brand',
    BLOG: 'Blog',
    BlOG_CATEGORY: 'BlogCategory',
    FEATURE_CATEGORY: 'FeatureCategory',
    CATEGORY: 'Category',
    CUSTOMER: 'Customer',
    PRODUCT: 'Product',
    BANNER: 'banner',
    OFFERS: 'Offers',
  },
  ONLY_CATEGORY: 0,
  UNBOXING: 1,
  PRODUCT_REVIEW: 2,
  TEASOR: 3,
  PAYMENT_GATEWAY: 'payment_images/payment_gateways',
  PAYMENT_GATEWAY_BANK: 'payment_images/banks',
  BANNER_IMAGE: 'banner',
  BANNER_APP_IMAGE: 'banner/app',
  BANNER_RESPONSIVE_IMAGE: 'banner/responsive',
  ACTIVE_PRODUCT_LIMIT: 30,
  FEATURED_CATEGORIES_IMAGE: 'featured-category',
  TIMER_BASED_FEATURED_CATEGORY: 1,
  OTHERS_FEATURED_CATEGORY: 0,
  TRUE: 'true',
  FALSE: 'false',
  APP: 1,
  WEBSITE: 2,
  BOTH: 3,
  ALL_USER: 1,
  NEW_USER: 2,
  BULK_OFFER: 1,
  PAYMENT_OFFER: 2,
  COUPON_CODE_OFFER: 3,
  OFFER_IMAGE: 'offer',
  NORMAL_UPLOAD_IMAGE: 1,
  BANNER_UPLOAD_IMAGE: 2,
  APP_UPLOAD_IMAGE: 3,
  RESPONSIVE_UPLOAD_IMAGE: 4,
  ICON_UPLOAD_IMAGE: 5,
  WEB_UPLOAD_IMAGE: 6,
  PERCENTAGE: 1,
  FLAT_OFF: 2,
  IMAGE_FILE: 1,
  VIDEO_FILE: 2,
  IMAGE_MAX_SIZE: 3000,
  VIDEO_MAX_SIZE: 5000,
  IMAGE_VIDEO_LIMIT: 5,
  USER_TYPE: {
    NEW_CUSTOMER: 1,
    OLD_CUSTOMER: 2,
    NEW_CUSTOMER_WITH_UNSUCCESSFUL_ORDER: 3,
    RETAILS_CUSTOMER: 4,
  },
  SEND_NOTIFICATION: {
    ORDER_SPECIFIC: 1,
    CUSTOMER_SPECIFIC: 2,
  },
  SEND_NOTIFICATION_USER_TYPE: {
    OLD_CUSTOMER: 1,
    NEW_CUSTOMER: 2,
    ALL_CUSTOMER: 3,
    SPECIFIC_CUSTOMER: 4,
    ORDER_BASE: 5,
  },
  LOCATION_TYPEHOME: 1,
  LOCATION_TYPEDEAL: 2,
  DEFAULT_IMAGE: 1,
  LOG_TYPE: {
    INWARD: 1,
    OUTWARD: 2,
  },
}