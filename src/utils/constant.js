export const API_URL = "https://al-nuaimb2b.com:8443/alnuaim";
export const IMAGE_PATH = "https://al-nuaimb2b.com:8443"

// export const API_URL = "https://flintinfotech.com/alnuaim";
// export const IMAGE_PATH = "https://flintinfotech.com"


export const SEND_OTP  = `${API_URL}/auth/sendOtp`;
export const VERIFY_OTP = `${API_URL}/auth/otpVerify`;
export const MOBILE_LOGIN = `${API_URL}/auth/mobileLogin`;
export const GET_DROPDOWN_DATA = `${API_URL}/staticData/getStaticDataDD`;
export const GET_PRODUCT_LIST = `${API_URL}/product/getAllActiveProducts`;
export const GET_PRODUCTS_BY_ID = `${API_URL}/product/getProductsByLabelId`;
export const GET_PRODUCTS_BY_BRAND_ID = `${API_URL}/product/getProductsByBrandId`;
export const REGISTER_USER = `${API_URL}/auth/addCustomer`;
export const UPDATE_USER = `${API_URL}/customer/updateCustomerProfile`
export const REGISTER_OTP_VERIFY = `${API_URL}/auth/otpVerify`;
export const GET_LOGGEDIN_USER_DETAILS = `${API_URL}/customer/getProfileDataByUserName`
export const ADD_NEW_ADDRESS = `${API_URL}/address/addAddress`;
export const UPDATE_ADDRESS = `${API_URL}/address/updateAddress`;
export const GET_ADDREES_LIST = `${API_URL}/address/getAddressByCustomerId`;
export const GET_DISCOUNTS = `${API_URL}/discount/getAllActiveDiscounts`;
export const ADD_TO_CART = `${API_URL}/cart/addToCart`;
export const GET_CART = `${API_URL}/cart/getCartInfoByCustomerId`;
export const GET_BANNER_DATA = `${API_URL}/banner/getAllActiveBanners`;
export const GENERATE_ORDER_ID = `${API_URL}/order/generateOrder`;
export const CAPTURE_PAYMENT = `${API_URL}/order/capturePayment`;
export const GET_ORDER = `${API_URL}/order/getAllOrders?sort=orderInfoId,desc`;
export const GET_ORDER_DETAIL = `${API_URL}/order/getProductInfoByOrderId`;
export const GET_PRODUCT_BY_PRODUCT_ID = `${API_URL}/product/getProductById`;
export const GET_SUPPORT_NUMBERS = `${API_URL}/support/getSupportNumbers`;
export const SAVE_SUPPORT_TICKET = `${API_URL}/support/saveSupportTicket`;
export const GET_COUPONS = `${API_URL}/discount/getActiveCouponsData`;
export const GET_GST = `${API_URL}/order/getAvgGst`;
export const INVOICE_DOWNLOAD = `${API_URL}/invoice/downloadInvoiceByOrderId`;
export const DOWNLOAD_ATTACHMENTS = `${API_URL}/file/downloadFileById`;
export const NOTIFICATION = `${API_URL}/notification/getUnreadNotificationsByCustomerId`;
export const UPDATE_NOTIFICATION = `${API_URL}/notification/updateNotificationAsRead`;

export const BASE64 = "data:image/png;base64, "