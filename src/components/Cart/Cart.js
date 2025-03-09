import { Button, Divider, HStack, Heading, Input, Modal, ScrollView, Skeleton, Spinner, Text, View, useToast } from "native-base";
import React, { useEffect, useRef, useState } from "react";
import { Dimensions, Pressable, StyleSheet, Image, Alert, KeyboardAvoidingView, Platform, SafeAreaView } from "react-native";
import Back from "../../../assets/back.svg";
import { rMS } from "../../utils/responsive";
import { ADD_TO_CART, CAPTURE_PAYMENT, GENERATE_ORDER_ID, GET_ADDREES_LIST, GET_CART, GET_COUPONS, GET_DISCOUNTS, GET_GST, GET_LOGGEDIN_USER_DETAILS, GET_PRODUCT_BY_PRODUCT_ID, IMAGE_PATH } from "../../utils/constant";
import { getCustomerId, getUserInfo, setCartDataInGlobal } from "../../utils/helper";
import { HTTP_GET, HTTP_POST } from "../../utils/http-service";
import Star from "../../../assets/star.svg";
import RBSheet from 'react-native-raw-bottom-sheet';
import RazorpayCheckout from 'react-native-razorpay';
import DefaultImage from "../../../assets/images/default-product-image.png";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import SubcatHeaderLogo from "../../../assets/subcatLogo.svg";
import RemoveProduct from "../../../assets/remove.svg";
import EmptyCartLogo from "../../../assets/emptycart.svg";
import AsyncStorage from '@react-native-async-storage/async-storage';
import CouponSvg from "../../../assets/coupon.svg";
import { BadgePercent, Castle, DiamondPercent, ReceiptText, ShoppingBag, ShoppingCart, TicketPercent } from "lucide-react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import ArrowDown from "../../../assets/arrow-down - cart.svg";
import NoImage from "../../../assets/images/No-Image-Placeholder.png";
import { SliderBox } from "react-native-image-slider-box";
import FastImage from "react-native-fast-image";

const win = Dimensions.get('window');

const Cart = ({ route, navigation }) => {

    const [productList, setProductList] = useState(route.params ? route.params.productList : []);
    const [grandTotal, setGrandTotal] = useState(route.params ? route.params.grandTotal : 0);
    const [totalAmount, setTotalAmount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isBtnLoader, setIsBtnLoader] = useState(false);
    const [cartData, setCartData] = useState(null);
    const [couponList, setCouponList] = useState([]);
    const [userData, setUserData] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [customerSpecificDiscount, setCustomerSpecificDiscount] = useState(0);
    const [gstAmount, setGstAmount] = useState(0);
    const [isCustomerDiscountApply, setIsCustomerDiscountApply] = useState(false);
    const [checkIsPaymentGatway, setIsPaymentGateway] = useState(true);
    const [isClickOnRemoveProduct, setIsClickOnRemoveProduct] = useState(false);
    const [discountList, setDiscountList] = useState([]);
    const [appliedCouponData, setAppliedCouponData] = useState(null);
    const [nextAvailableDiscount, setNextAvailableDiscount] = useState(null);
    const [avgGST, setAvgGST] = useState(0);
    const [applicableDiscountInfo, setApplicableDiscountInfo] = useState(null);
    const [productValidModal, setProductValidModal] = useState(false);
    const [itemToaddAndRemove, setItemsToAddandRemove] = useState({
        itemsToAdd: 0,
        itemsToRemove: 0
    });
    const [productInfoLoading, setProductInfoLoading] = useState(false);
    const [productDetailModal, setProductDetailModal] = useState(false);
    const [productDetailInfo, setProductDetailInfo] = useState(null);
    const toast = useToast();
    const NO_IMAGE = Image.resolveAssetSource(NoImage).uri;
    const refRBSheet = useRef();
    const DEFAULT_PRODUCT_IMAGE = Image.resolveAssetSource(DefaultImage).uri;

    useEffect(() => {
        getUserData();
        getCouponList();
        getDiscountList();

        return () => {
            toast.closeAll();
        }
    }, []);

    useEffect(() => {
        if (userData) {
            getCart();

            setTimeout(() => {
                setIsLoading(false);
            }, 3000);
        }
    }, [userData])


    useEffect(() => {
        let calc = async () => {
            if (cartData) {
                await calculateFinalAmount();
            }
        }
        calc();
    }, [{ ...cartData }]);

    useEffect(() => {
        if (productList.length) {
            updateCartValue([...productList]);
        }
    }, [productList]);

    useEffect(() => {
        if (appliedCouponData) {
            updateCartValue([...productList]);
        }
    }, [appliedCouponData]);


    const getUserData = async () => {
        const user = await AsyncStorage.getItem("user");
        const URL = `${GET_LOGGEDIN_USER_DETAILS}/${JSON.parse(user).userName}`;
        const data = await HTTP_GET(URL);

        if (data != null && data["status"] !== undefined) {
            if (data["status"] === "invalid") {
                toast.show({ description: "Oops! Something went wrong while fetching your details." }, 3000);
            } else if (data["status"] === "error") {
                toast.show({ description: "Oops! Something went wrong while fetching your details. " }, 3000);
            }
            setIsLoading(false);
        } else {
            setUserData(data);
        }
    }

    const updateCart = async () => {

        setIsBtnLoader(true);
        if (!validateCartonSize(productList)) {
            setShowModal(true);
            setIsBtnLoader(false);
            return;
        }

        const isAllProductsValid = productList.every(subCategory =>
            subCategory.products.every(product => product.isProductValid)
        );

        if (!isAllProductsValid) {
            setProductValidModal(true);
            setIsBtnLoader(false);
            return;
        } else {
            setProductValidModal(false);
        }


        let prod_list = [];

        productList.forEach(subCategory => {
            subCategory.products.forEach(product => {
                prod_list.push({
                    productId: product.productId,
                    quantity: (+product.unit)
                });
            });
        });

        if (prod_list.every(ele => (+ele?.unit) > 0)) {
            toast.show({
                description: "Please fill in the quantity to proceed with checkout."
            }, 3000);

            setIsBtnLoader(false);

            return;
        }

        const Obj = {
            customerId: await getCustomerId(),
            subcategories: [{ "products": prod_list }],
            totalBillAmount: cartData?.totalBillAmount
            // billAmountDiscountCode: cartData?.billAmountDiscountCode,
            // totalBillAmountAfterDiscount: parseFloat(cartData?.totalBillAmountAfterDiscount).toFixed(2),
            // couponCode: appliedCouponData != null ? appliedCouponData?.couponDiscountCode : null
        }

        const URL = `${ADD_TO_CART}`;
        const data = await HTTP_POST(URL, Obj);
        if (data != null && data["status"] !== undefined) {
            if (data["status"] === "invalid") {
                toast.show({ description: "Uh-oh! 🚫 Update cart failed. Please try again. 🛒" }, 3000);
            } else if (data["status"] === "error") {
                toast.show({ description: "Something went wrong!!" }, 3000);
            }
            setIsBtnLoader(false);
        } else {
            orderPlaced()
        }


    }

    const orderPlaced = async () => {


        // if (!validateCartonSize()) {
        //     Alert.alert("")
        //     return;
        // }


        let prod_list = [];

        productList.forEach(subCategory => {
            subCategory.products.forEach(product => {
                prod_list.push({
                    productId: product.productId,
                    quantity: (+product.unit)
                });
            });
        });

        if (grandTotal > 500000 && (userData?.isCreditCustomer == "N" || userData?.isCreditCustomer == null)) {
            toast.show({
                "description": "Error: The amount exceeds the permissible limit of ₹ 500,000. Please enter a lower amount."
            }, 3000);

            setTimeout(() => {
                toast.closeAll();
            }, 3000);
            setIsBtnLoader(false);
            return;
        }

        let isCustomerDiscountApplicable = userData?.isDiscountActive;
        let finalAmount = await calculateFinalAmount();
        setIsBtnLoader(false);

        setCartDataInGlobal({
            prod_list: prod_list,
            cartData: cartData,
            discountInfo: applicableDiscountInfo ? calculateDiscountApply(finalAmount, applicableDiscountInfo) : null,
            isCustomerDiscountApplicable: isCustomerDiscountApplicable,
            finalAmount: finalAmount,
            grandTotal: grandTotal,
            gst: avgGST,
            customerSpecificDiscount: customerSpecificDiscount,
            isCustomerDiscountApply: isCustomerDiscountApply,
            checkIsPaymentGatway: checkIsPaymentGatway,
            couponInfo: appliedCouponData != null ? appliedCouponData : null
        });

        navigation.navigate("Payment", {
            prod_list: prod_list,
            cartData: cartData,
            discountInfo: applicableDiscountInfo ? calculateDiscountApply(finalAmount, applicableDiscountInfo) : null,
            isCustomerDiscountApplicable: isCustomerDiscountApplicable,
            finalAmount: finalAmount,
            grandTotal: grandTotal,
            gst: avgGST,
            customerSpecificDiscount: customerSpecificDiscount,
            isCustomerDiscountApply: isCustomerDiscountApply,
            checkIsPaymentGatway: checkIsPaymentGatway,
            couponInfo: appliedCouponData != null ? appliedCouponData : null
        })
    }

    const calculateFinalAmount = async () => {

        let isCustomerDiscountApplicable = userData?.isDiscountActive == "Y" ? true : false;
        setIsCustomerDiscountApply(isCustomerDiscountApplicable);
        let customerDiscount = userData?.discountPercent;

        let finalAmt = 0;
        if (isCustomerDiscountApplicable) {
            setCustomerSpecificDiscount((parseFloat(cartData?.totalBillAmountAfterDiscount) * (customerDiscount / 100)).toFixed(2))
            let discountedCustomerAmount = ((cartData?.totalBillAmountAfterDiscount.toFixed(2) * (customerDiscount / 100).toFixed(2))).toFixed(2);
            let amountAfterCustomerDiscount = parseFloat(cartData?.totalBillAmountAfterDiscount).toFixed(2) - parseFloat(discountedCustomerAmount).toFixed(2);
            setGstAmount(amountAfterCustomerDiscount * parseFloat(avgGST / 100).toFixed(2));
            finalAmt = (
                (amountAfterCustomerDiscount) + (amountAfterCustomerDiscount * parseFloat(avgGST / 100).toFixed(2))).toFixed(2);
        } else {
            setGstAmount(cartData?.totalBillAmountAfterDiscount * (avgGST / 100).toFixed(2));
            finalAmt = (cartData?.totalBillAmountAfterDiscount + (cartData?.totalBillAmountAfterDiscount * (avgGST / 100).toFixed(2))).toFixed(2)
        }
        if (appliedCouponData) {
            setGstAmount((cartData?.totalBillAmountAfterDiscount - appliedCouponData?.couponAmount) * (avgGST / 100).toFixed(2));
            finalAmt = ((cartData?.totalBillAmountAfterDiscount - appliedCouponData?.couponAmount) + ((cartData?.totalBillAmountAfterDiscount - appliedCouponData?.couponAmount) * (avgGST / 100).toFixed(2))).toFixed(2)
        }
        setGrandTotal(finalAmt);

        let creditAmount = parseFloat(userData?.balCreditAmount).toFixed(2);
        if (userData?.isCreditCustomer == "Y" && +creditAmount >= +finalAmt) {
            setIsPaymentGateway(false);
        } else {
            setIsPaymentGateway(true);
        }

        return +parseFloat(finalAmt).toFixed(2);

    }

    const back = () => {
        navigation.navigate("BulkOrder");
    }

    const getAverageGST = async (subCategoryList) => {
        const body = {
            subCategoryIds: subCategoryList
        };

        const URL = `${GET_GST}`;
        const data = await HTTP_POST(URL, body);
        if (data != null && data["status"] !== undefined) {
            if (data["status"] === "invalid") {
                toast.show({ description: "Oops! It seems something went wrong while getting Cart data" }, 3000);
            } else if (data["status"] === "error") {
                toast.show({ description: "Something went wrong!!" }, 3000);
            }
        } else {
            if (data != null) {
                setAvgGST(data?.avgGst);
                setCartData({ ...cartData, avgGstPercent: data?.avgGst });
            } else {
                setAvgGST(0);
            }

        }


    }

    const getCart = async () => {
        const customerId = await getCustomerId();
        const URL = `${GET_CART}/${customerId}`;


        const data = await HTTP_GET(URL);

        if (data != null && data["status"] !== undefined) {
            if (data["status"] === "invalid") {
                toast.show({ description: "Oops! It seems something went wrong while getting Cart data" }, 3000);
            } else if (data["status"] === "error") {
                toast.show({ description: "Something went wrong!!" }, 3000);
            }
            setIsLoading(false);
        } else {
            if (data != null) {
                let modifiedCartData = data?.subcategories.map(item => {
                    item["currentCartonSize"] = 0;
                    item["countMismatch"] = false;
                    return item;
                });

                data["subcategories"] = modifiedCartData;
                setCartData(() => data);

                let tmpProductList = data?.subcategories.map((subcategory, index) => {
                    let obj = {
                        subCategoryId: subcategory?.subcategoryId,
                        subCategoryName: subcategory?.subcategoryName,
                        cartonSize: subcategory?.cartonSize,
                        currentCartonSize: 0,
                        isValidCartonSize: true,
                        isExpand: true,
                        products: subcategory.products.map((product, index) => {
                            return {
                                productId: product?.productId,
                                productName: product?.productName,
                                productImages: product?.images,
                                // productImages: "",
                                rating: product?.rating,
                                price: product?.price,
                                unit: product?.quantity.toString(),
                                subCategoryId: subcategory?.subcategoryId,
                                isDiscountActive: product?.isDiscountActive,
                                discountedPrice: product?.discountedPrice,
                                stock: product?.stockSize,
                                minQuantityForOrder: product?.minQuantityForOrder,
                                isProductValid: (product?.quantity > product?.stockSize) ? false : true,
                            }
                        })
                    }
                    return obj;


                });

                await getAverageGST(data?.subcategories.map(ele => ele?.subcategoryId))

                setProductList(tmpProductList);
                calculateCurrentCartonSize(tmpProductList);
                setIsLoading(false);
            } else {
                setIsLoading(false);
            }
        }
    }

    const getDiscountList = async () => {
        const URL = `${GET_DISCOUNTS}`;
        const data = await HTTP_POST(URL, {});

        if (data != null && data["status"] !== undefined) {
            if (data["status"] === "invalid") {
                toast.show({ description: "Error..!!" }, 3000);
            } else if (data["status"] === "error") {
                toast.show({ description: "Something went wrong!!" }, 3000);
            }
        } else {
            if (data != null) {
                setDiscountList(data);
            } else {
                setDiscountList([]);
            }
        }
    }

    const validateCartonSize = (product_list) => {
        let prod_list = product_list.map(subcategory => {
            let total = 0;
            let cartonSize = subcategory?.cartonSize;
            // let currentCartonSize = subcategory?.currentCartonSize;


            subcategory.products.forEach(product => {
                total = total + (+product?.unit);
            });

            if (total % (cartonSize / 12) == 0) {
                subcategory["isValidCartonSize"] = true;
                subcategory["countMismatch"] = false;

                // return true;
            } else {
                let itemsToAdd = (cartonSize / 12) - Math.trunc(total % (cartonSize / 12));
                let itemsToRemove = Math.trunc(total % (cartonSize / 12));
                setItemsToAddandRemove({ ...itemToaddAndRemove, itemsToAdd: itemsToAdd, itemsToRemove: itemsToRemove });
                // Alert.alert(`Please add ${itemsToAdd} Dozen or remove ${itemsToRemove} Dozen to match the required carton size`);
                subcategory["isValidCartonSize"] = false;
                subcategory["countMismatch"] = true;

            }

            return subcategory;
        });
        setProductList([...prod_list]);
        return prod_list.every(ele => ele?.isValidCartonSize && !ele?.countMismatch)
    }

    const calculateCurrentCartonSize = (prodList) => {
        let total_amount = 0;
        let prod_list = prodList.map(subcategory => {
            let total = 0;
            subcategory.products.forEach(product => {
                total = total + (+product?.unit);
                total_amount = total_amount + (+product?.unit * 12) * (product?.isDiscountActive == "Y" ? parseFloat(product?.discountedPrice).toFixed(2) : parseFloat(product?.price).toFixed(2));
            });
            subcategory["currentCartonSize"] = Math.trunc(total / (subcategory?.cartonSize / 12));
            return subcategory;
        });

        setProductList(prod_list);
        // validateCartonSize();
    }


    const findDiscountApply = async (totalPrice) => {
        let applicableDiscount = null;
        let maxNumber = 0;
        let discountInfo = {};
        let nextAvailableDiscount = null;

        for (let i = 0; i < discountList.length; i++) {
            const discount = discountList[i];
            // Check if the discount is applicable based on its type and conditions
            if (totalPrice >= discount.number && discount.number > maxNumber) {
                applicableDiscount = discount;
                maxNumber = discount.number;
                setApplicableDiscountInfo(applicableDiscount);
            } else {
                setApplicableDiscountInfo(null);
            }
        }

        for (let i = 0; i < discountList.length; i++) {
            const discount = discountList[i];
            // Find the next available discount which is higher than the current total price
            if (discount.number > totalPrice && (!nextAvailableDiscount || discount.number < nextAvailableDiscount.number)) {
                nextAvailableDiscount = discount;
                setNextAvailableDiscount(nextAvailableDiscount);
            } else {
                setNextAvailableDiscount(null)
            }
        }

        if (applicableDiscount != null) {
            discountInfo["code"] = applicableDiscount?.couponDiscountCode
            const new_discount_info = calculateDiscountApply(totalPrice, applicableDiscount);
            discountInfo["discountAmount"] = new_discount_info?.discountAmount;
            discountInfo["discountData"] = applicableDiscount;

            return discountInfo;

        }

        return null;

        // if (applicableDiscount != null) {
        //     return {
        //         code: applicableDiscount?.couponDiscountCode,
        //         amount: maxNumber
        //     }
        // }

        // return null;

    }


    const calculateDiscountApply = (total_price, discountApply) => {
        let discount = {};
        if (discountApply !== null) {

            if (discountApply?.discountCategory == "Percentage") {
                if (discountApply?.maxDiscountAmount && discountApply?.maxDiscountAmount != 0) {
                    discount["finalAmount"] = +(total_price - discountApply?.maxDiscountAmount).toFixed(2);
                    discount["discountAmount"] = discountApply?.maxDiscountAmount;
                } else {
                    discount["finalAmount"] = +(total_price - (total_price * (discountApply?.discountInPer / 100))).toFixed(2);
                    discount["discountAmount"] = +(total_price * (discountApply?.discountInPer / 100)).toFixed(2);
                }
            } else if (discountApply?.discountCategory == "Flat") {
                discount["finalAmount"] = +(total_price - discountApply?.flatDiscountAmount).toFixed(2);
                discount["discountAmount"] = +(discountApply?.flatDiscountAmount).toFixed(2);
            }

        } else {
            discount["finalAmount"] = (+total_price).toFixed(2);
            discount["discountAmount"] = 0;
        }
        discount["discountCode"] = discountApply?.couponDiscountCode;


        return discount;
    }

    const debounce = (func, wait) => {
        let timeout;
        return function (...args) {
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                func.apply(context, args);
            }, wait);
        };
    };


    const onProductUnitChange = async (e, product, subcategory) => {
        if (e != "" && +e > Math.floor(product.stock)) {
            product.isProductValid = false;
        } else if ((e != "" && +e < product?.minQuantityForOrder)) {
            product.isProductValid = false;
        } else {
            // product?.isStockAvailable = true;
            product.isProductValid = true;
        }


        const updatedProduct = { ...product, unit: e };

        const updatedProdList = productList.map(ele => {
            if (ele.subCategoryId === subcategory.subCategoryId) {
                return {
                    ...ele,
                    products: ele.products.map(item =>
                        item.productId === updatedProduct.productId ? { ...updatedProduct, unit: e } : item
                    )
                };
            }
            return ele;
        });
        setProductList(updatedProdList);
        calculateCurrentCartonSize(updatedProdList);

        if (e != "" && +e > Math.floor(product.stock)) {
            toast.show({
                description: `Only ${Math.floor(product.stock)} Dozen are available in stock.`
            }, 3000);
            return;
        }


        let isValidData = validateCartonSize(updatedProdList);

        // debouncedUpdateCartValue(updatedProdList, true);
        if (isValidData == true) {
            if (e != "") {
                toast.show({
                    description: "Updating cart prices, please wait..."
                }, 3000);
                toast.closeAll();
                setTimeout(() => {
                    toast.closeAll();
                    debounce(updateCartValue(updatedProdList, true), 3000);
                }, 3000);
            }
        }
    }



    const getCouponList = async () => {
        const URL = `${GET_COUPONS}`;
        const data = await HTTP_POST(URL, {});

        if (data != null && data["status"] !== undefined) {
            if (data["status"] === "invalid") {
                toast.show({ description: "Error..!!" }, 3000);
            } else if (data["status"] === "error") {
                toast.show({ description: "Something went wrong!!" }, 3000);
            }
        } else {
            if (data) {
                setCouponList(data);
            } else {
                setCouponList([]);
            }
        }
    }

    const removeProduct = async (product, subCategory) => {
        toast.show({
            description: "Updating cart prices, please wait..."
        }, 3000);
        const foundSubcategoryIndex = productList.findIndex(item => item?.subCategoryId === subCategory?.subCategoryId);
        if (foundSubcategoryIndex != -1) {
            productList[foundSubcategoryIndex].products.forEach((ele, index) => {
                if (ele.productId == product.productId) {
                    productList[foundSubcategoryIndex].products.splice(index, 1);
                }
            });

        }

        if (productList[foundSubcategoryIndex].products.length == 0) {
            productList.splice(foundSubcategoryIndex, 1);
        }

        setProductList([...productList]);
        setIsClickOnRemoveProduct(true);

        await getAverageGST([...productList].map(ele => ele?.subCategoryId));

        calculateCurrentCartonSize([...productList]);

        updateCartValue([...productList], true);
    }


    const updateCartValue = async (prod_list, isCallUpdateCartApi = false) => {
        let totalAmount = 0;
        let amountAfterDiscount = 0;
        prod_list.forEach(subCategory => {
            subCategory.products.forEach(ele => {
                totalAmount = totalAmount + (ele?.isDiscountActive == "Y" ? (+parseFloat(ele?.discountedPrice).toFixed(2) * +(ele?.unit * 12)) : (ele?.price * +(ele?.unit * 12)))
            });
        });
        const discountData = await findDiscountApply(+parseFloat(totalAmount).toFixed(2));

        if (discountData) {

            amountAfterDiscount = discountData != null ? totalAmount - discountData?.discountAmount : 0
            setCartData({ ...cartData, billAmountDiscountCode: discountData?.code, totalBillDiscountAmount: discountData?.discountAmount, totalBillAmount: totalAmount, totalBillAmountAfterDiscount: amountAfterDiscount, discountAllInfo: discountData?.discountData });
        } else
        //  if (appliedCouponData) {
        //     setCartData({ ...cartData, billAmountDiscountCode: null, totalBillDiscountAmount: 0, totalBillAmount: totalAmount, totalBillAmountAfterDiscount: amountAfterDiscount - appliedCouponData?.couponAmount });
        // }
        //  else
        {
            setCartData({ ...cartData, billAmountDiscountCode: null, totalBillDiscountAmount: 0, totalBillAmount: totalAmount, totalBillAmountAfterDiscount: totalAmount, discountAllInfo: discountData?.discountData });
        }

        setTotalAmount(totalAmount);

        const discountCode = discountData != null ? discountData?.code : null;

        if (isCallUpdateCartApi) {
            updateCartWhenProductRemoved([...prod_list], discountCode, amountAfterDiscount != 0 ? amountAfterDiscount : totalAmount);
        }
    }

    const updateCartWhenProductRemoved = async (prod_list_new, discountCode = null, amountAfterDiscount = 0) => {
        toast.closeAll();
        let prod_list = [];
        let total_amount = 0;
        prod_list_new.forEach(subCategory => {
            subCategory.products.forEach(product => {
                let product_total = product?.isDiscountActive == "Y" ? parseFloat(product?.unit * 12 * +parseFloat(product?.discountedPrice).toFixed(2)).toFixed(2) : parseFloat(product?.unit * 12 * product?.price).toFixed(2)
                total_amount = total_amount + (+product_total);

                prod_list.push({
                    productId: product.productId,
                    quantity: (+product.unit)
                })
            });
        });


        const Obj = {
            customerId: await getCustomerId(),
            subcategories: [{ "products": prod_list }],
            totalBillAmount: parseFloat(total_amount).toFixed(2)
        }

        const URL = `${ADD_TO_CART}`;
        const data = await HTTP_POST(URL, Obj);
        if (data != null && data["status"] !== undefined) {
            if (data["status"] === "invalid") {
                toast.show({ description: "Uh-oh! 🚫 Update cart failed. Please try again. 🛒" }, 3000);
            } else if (data["status"] === "error") {
                toast.show({ description: "Something went wrong!!" }, 3000);
            }
            setIsBtnLoader(false);
        } else {
            toast.closeAll();
            toast.show({
                description: "Cart Updated Successfully...!!"
            }, 2000);
            setIsClickOnRemoveProduct(false);

        }
    }


    const applyCoupon = (coupon) => {
        let code = coupon?.couponDiscountCode;
        let couponType = coupon?.discountCategory;
        let couponAmount = 0;
        if (couponType == "Flat") {
            couponAmount = coupon?.flatDiscountAmount;
        } else {
            if (coupon?.maxDiscountAmount && coupon?.maxDiscountAmount > 0) {
                couponAmount = parseFloat(coupon?.maxDiscountAmount).toFixed(2);
            } else {
                couponAmount = parseFloat(totalAmount * (coupon?.discountInPer / 100)).toFixed(2);
            }
        }
        let couponData = {
            couponDiscountCode: code,
            discountCategory: couponType,
            couponAmount
        };
        setAppliedCouponData(couponData);
        refRBSheet.current.close()
    }

    const removeCoupon = () => {
        setAppliedCouponData(null);
        calculateFinalAmount();
    }

    const expandItem = async (item) => {
        // item.isExpand = !item.isExpand;
        setProductList(prevItem =>
            prevItem.map(ele => ele?.subCategoryId == item?.subCategoryId ? item : ele)
        )
        // console.log('Item Expanded',item);
    }

    const openProductDetail = async (product) => {
        // console.log(product,'product'); 
        await getProductDetail(product.productId);
    }

    async function getProductDetail(productId) {
        console.log('enter');

        setProductDetailModal(true);
        setProductInfoLoading(true);
        try {
            const URL = `${GET_PRODUCT_BY_PRODUCT_ID}/${productId}`;
            console.log('url', URL);
            const data = await HTTP_GET(URL);
            console.log(data, 'data');

            if (data != null && data["status"] !== undefined) {
                if (data["status"] === "invalid") {
                    toast.show({ description: "Oops! Something went wrong while fetching your details." });
                } else if (data["status"] === "error") {
                    toast.show({ description: "Oops! Something went wrong while fetching your details. " });
                }
                setProductInfoLoading(false);
            } else {
                setProductInfoLoading(false);
                console.log('enter in else');
                if (data != null) {
                    setProductDetailInfo(data);
                }
            }
        } catch (error) {
            console.log(error, 'error');

        }

    }

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <View style={[styles.container, Platform.OS === "ios" ? { paddingTop: "0%" } : { paddingTop: "5%" }]}>
                <View style={styles.bulkTitleWrapper}>
                    <View style={styles.button}><Back width={40} height={40} onPress={() => back()} /></View>
                    <Text style={styles.title}>Cart</Text>
                </View>
                <ScrollView contentContainerStyle={{ paddingBottom: rMS(50), marginTop: rMS(10) }} showsVerticalScrollIndicator={false}>
                    {
                        !isLoading && productList.length == 0 &&

                        (<View style={styles.cartEmptyWrapper}>
                            <View>
                                <EmptyCartLogo />
                            </View>
                            <Text style={styles.cartEmptyLbl}>Your Cart is Empty 🛒✨</Text>
                        </View>)
                    }

                    {

                        isLoading && productList.length == 0 &&
                        <View style={{ marginTop: rMS(15) }}>
                            <ScrollView horizontal="false">
                                <View style={{ flexDirection: "column", gap: 10, }}>
                                    <Skeleton h={40} rounded={"md"} />
                                    <Skeleton h={40} rounded={"md"} />
                                    <Skeleton h={40} rounded={"md"} />
                                    <Skeleton h={40} rounded={"md"} />
                                </View>
                            </ScrollView>
                        </View>

                    }
                    {
                        !isLoading && productList.length != 0 &&
                        <View>
                            <KeyboardAwareScrollView enableOnAndroid={true}
                                contentContainerStyle={{ flex: 1 }} contentInset={{ top: 0, bottom: 0 }}
                                behavior={Platform.OS === "ios" ? "position" : undefined}>
                                <View >
                                    <ScrollView horizontal="false" showsVerticalScrollIndicator={false} contentContainerStyle={{ height: "auto" }}>
                                        <View style={{ flex: 1, flexDirection: "column", justifyContent: "space-between" }}>

                                            <View style={{ flexDirection: "column", justifyContent: "space-between" }}>
                                                {
                                                    productList.map(item => {
                                                        return (
                                                            <Pressable key={item?.subCategoryId} onPress={() => expandItem(item)}>
                                                                <View style={styles.subCategoryWrapper}>
                                                                    <View style={[styles.labelBgColor, { paddingVertical: "3%" }]}>
                                                                        <View style={{ flexDirection: "row", gap: rMS(10), alignItems: "center" }}>
                                                                            <View style={{ paddingHorizontal: rMS(5) }}>
                                                                                <SubcatHeaderLogo />
                                                                            </View>
                                                                            <View style={{ paddingVertical: rMS(5) }}>
                                                                                <Text w={wp("30%")} style={styles.lbl} numberOfLines={1}>{item?.subCategoryName}</Text>
                                                                                {/* <Text style={styles.lbl}>1 Carton = {item?.cartonSize / 12} Dozen</Text> */}
                                                                            </View>
                                                                        </View>
                                                                        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: "2%", gap: 5 }}>
                                                                            <Text style={styles.lbl}>1 Carton = {item?.cartonSize / 12} Dozen</Text>
                                                                            {
                                                                                item.isExpand ?
                                                                                    <ArrowDown /> :
                                                                                    <View style={{ transform: [{ rotate: '180deg' }] }}>
                                                                                        <ArrowDown />
                                                                                    </View>

                                                                            }
                                                                            {/* <Text textAlign="right" style={styles.lbl}>Your Carton Size: {item?.currentCartonSize}</Text> */}
                                                                        </View>
                                                                    </View>

                                                                    {
                                                                        item.isExpand &&
                                                                        <View style={styles.productWrapper}>
                                                                            {item?.products.map((ele, index) => {
                                                                                return (
                                                                                    <Pressable onPress={() => openProductDetail(ele)}>
                                                                                        <View style={ele?.isProductValid ? styles.productValid : styles.productInvalid} key={[ele?.productId, "_", index].join()} >
                                                                                            <View style={styles.productItemWrapper}>
                                                                                                <View style={styles.productTitleWrapper}>
                                                                                                    <Text style={styles.productTitle} numberOfLines={1}>{ele?.productName}</Text>
                                                                                                    {/* <View style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 5 }}><Star /><Text   style={styles.productRating}>{ele?.rating}</Text></View> */}
                                                                                                </View>

                                                                                                <View style={styles.productPriceWrapper}>
                                                                                                    <View style={styles.qtyBtnWrapper}>
                                                                                                        {/* <Text   style={styles.qtyInput}>{ele?.unit}</Text> */}
                                                                                                        <Input value={ele?.unit} w="45%" h={hp("5%")} style={styles.qtyInput} onChangeText={(e) => onProductUnitChange(e, ele, item)} keyboardType="numeric" size="xs" />
                                                                                                        <Text style={styles.unit}>Dozen</Text>
                                                                                                    </View>

                                                                                                    {
                                                                                                        ele?.isDiscountActive == "Y" ?
                                                                                                            <Text style={[styles.productPrice, [styles.productPrice, ((ele?.discountedPrice * (ele?.unit * 12)).toFixed(2)).toString().length >= 10 ? { fontSize: rMS(11) } : { fontSize: Platform.OS === 'ios' ? rMS(9) : rMS(12) }]]}>₹ {(+parseFloat(ele?.discountedPrice).toFixed(2) * (ele?.unit * 12)).toFixed(2)}</Text> :
                                                                                                            <Text style={[styles.productPrice, ((ele?.price * (ele?.unit * 12)).toFixed(2)).toString().length >= 10 ? { fontSize: rMS(11) } : { fontSize: Platform.OS === 'ios' ? rMS(9) : rMS(12) }]}>₹ {(+parseFloat(ele?.price).toFixed(2) * (ele?.unit * 12)).toFixed(2)}</Text>

                                                                                                    }

                                                                                                    <View>
                                                                                                        <Pressable onPress={() => removeProduct(ele, item)}>
                                                                                                            <RemoveProduct />
                                                                                                        </Pressable>
                                                                                                    </View>

                                                                                                </View>

                                                                                            </View>
                                                                                            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                                                                                                {
                                                                                                    (ele?.minQuantityForOrder > 1) &&
                                                                                                    <Text style={{ fontFamily: "Inter-Regular", fontSize: rMS(12), color: "#566573", paddingHorizontal: rMS(5) }}>Minimum Order Quantity: {ele?.minQuantityForOrder}</Text>
                                                                                                }
                                                                                                {
                                                                                                    (+ele?.unit > ele?.stock) &&
                                                                                                    <Text style={{ fontFamily: "Inter-Regular", fontSize: rMS(12), color: "red", fontWeight: "600", paddingHorizontal: rMS(5) }}>Available Stock: {ele?.stock}</Text>
                                                                                                }
                                                                                            </View>
                                                                                        </View>
                                                                                    </Pressable>
                                                                                )
                                                                            })}
                                                                        </View>
                                                                    }

                                                                    {
                                                                        item?.countMismatch &&
                                                                        <View style={styles.warnningView}>
                                                                            <Text style={styles.warrningMsg}>Warning: {`Please add ${itemToaddAndRemove.itemsToAdd} Dozen or remove ${itemToaddAndRemove.itemsToRemove} Dozen to match the required carton size`}</Text>
                                                                        </View>
                                                                    }

                                                                    {
                                                                        item?.currentCartonSize != 0 && !item?.isValidCartonSize && !item?.countMismatch &&
                                                                        <View style={styles.errorView}>
                                                                            <Text style={styles.warrningMsg}>Alert: Carton size and product quantity (in dozens) do not match and will not be considered for checkout.</Text>
                                                                        </View>
                                                                    }
                                                                </View>
                                                            </Pressable>
                                                        )
                                                    })
                                                }

                                            </View>

                                            <View>
                                                {
                                                    (userData?.isDiscountActive == null || userData?.isDiscountActive == "N") &&
                                                    <View style={styles.applyCouponWrapper}>
                                                        {
                                                            appliedCouponData == null ?
                                                                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                                                                    <Pressable>
                                                                        <Text style={styles.couponLbl}>Available Coupons</Text>
                                                                    </Pressable>

                                                                    <Pressable style={styles.applyBtn} onPress={() => refRBSheet.current.open()}>
                                                                        <Text style={styles.applyLbl}>View Coupons</Text>
                                                                    </Pressable>
                                                                </View>

                                                                :

                                                                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                                                                    <View>
                                                                        <Text style={{ fontFamily: "Inter-Regular", fontWeight: "600", fontSize: rMS(14), color: "#3498DB" }}>You saved ₹{appliedCouponData?.couponAmount} on '{appliedCouponData?.couponDiscountCode}'</Text>
                                                                        <Pressable style={{ marginTop: "3%" }} onPress={() => refRBSheet.current.open()}>
                                                                            <Text style={{ fontFamily: "Inter-Regular", fontWeight: "600", fontSize: rMS(14), color: "#808B96", marginTop: "3%" }}>View all coupons</Text>
                                                                        </Pressable>
                                                                    </View>
                                                                    <View>
                                                                        <Pressable onPress={() => removeCoupon()}>
                                                                            <Text style={{ fontFamily: "Inter-Regular", color: "red", fontWeight: "600", fontSize: rMS(14) }}>Remove</Text>
                                                                        </Pressable>
                                                                    </View>

                                                                </View>
                                                        }

                                                        <RBSheet height={rMS(600)} ref={refRBSheet}
                                                            useNativeDriver={false}
                                                            customStyles={{
                                                                container: styles.sheet
                                                            }}
                                                            customModalProps={{
                                                                animationType: 'slide',
                                                                statusBarTranslucent: true,
                                                            }}
                                                            customAvoidingViewProps={{
                                                                enabled: false,
                                                            }}>

                                                            <ScrollView horizontal="false" showsVerticalScrollIndicator={false}>
                                                                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#EAECEE", paddingVertical: rMS(25) }}>
                                                                    <Text style={{ fontFamily: "Inter-Regular", fontSize: rMS(16), color: "#808B96" }}>BEST OFFERS FOR YOU</Text>
                                                                </View>
                                                                {
                                                                    couponList.map(item => {
                                                                        return (
                                                                            <View key={item?.discountId} style={styles.couponContainer}>
                                                                                <View style={styles.couponItemWrapper}>
                                                                                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                                                                                        <CouponSvg />
                                                                                        <View style={styles.code}>
                                                                                            <Text style={styles.codeLbl}>{item?.couponDiscountCode}</Text>
                                                                                        </View>
                                                                                    </View>
                                                                                    <Text style={styles.couponMessage}>{item?.discountMessage}</Text>
                                                                                </View>
                                                                                {
                                                                                    appliedCouponData?.couponDiscountCode === item?.couponDiscountCode ?
                                                                                        <Button style={styles.appliedBtn}>
                                                                                            <Text style={styles.appliedText}>APPLIED</Text>
                                                                                        </Button>
                                                                                        :
                                                                                        <Button style={styles.tapToApply} onPress={() => applyCoupon(item)}>
                                                                                            <Text style={styles.tapToApplyLbl}>TAP TO APPLY</Text>
                                                                                        </Button>
                                                                                }
                                                                            </View>
                                                                        )
                                                                    })
                                                                }

                                                            </ScrollView>

                                                        </RBSheet>

                                                    </View>
                                                }


                                                {
                                                    userData?.isCreditCustomer == "Y" &&
                                                    <View style={styles.creditWrapper}>
                                                        <View style={{ width: "100%", flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                                                            <Text style={styles.couponLbl}>Credit Balance</Text>
                                                            <Text style={{ fontFamily: "Inter-Regular", fontSize: rMS(16), fontWeight: "700" }}>₹ {parseFloat(userData?.balCreditAmount).toFixed(2)}</Text>
                                                        </View>


                                                        {
                                                            checkIsPaymentGatway &&
                                                            <Text style={{ fontFamily: "Inter-Regular", fontSize: rMS(12), color: "#2C3E50" }}>Warning: Your available credit amount is less than the grand total. You will be redirected to the payment gateway to complete your order.
                                                            </Text>
                                                        }


                                                    </View>
                                                }

                                                <View style={styles.priceWrapper}>

                                                    <View style={styles.calc_item}>
                                                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                                                            <ShoppingCart color="#566573" size={16} />
                                                            <Text style={styles.tot_lbl}>Total Carton Size:</Text>
                                                        </View>
                                                        <Text style={styles.val}>{productList.reduce((count, acc) => {
                                                            return count + acc.currentCartonSize;
                                                        }, 0)}</Text>
                                                    </View>

                                                    <View style={styles.calc_item}>
                                                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                                                            <ShoppingBag color="#566573" size={16} />
                                                            <Text style={styles.tot_lbl}>Total:</Text>
                                                        </View>
                                                        <Text style={styles.val}>₹ {parseFloat(cartData?.totalBillAmount).toFixed(2)}</Text>
                                                    </View>

                                                    <View style={styles.calc_item}>
                                                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                                                            <TicketPercent color="#566573" size={16} />
                                                            <Text style={styles.tot_lbl}>Discount  {
                                                                cartData?.billAmountDiscountCode != null && <Text  >({cartData?.discountAllInfo?.discountCategory == "Percentage" ? cartData?.discountAllInfo?.maxDiscountAmount != null ? `${cartData?.discountAllInfo?.discountInPer}% upto ${cartData?.discountAllInfo?.maxDiscountAmount}` : `${cartData?.discountAllInfo?.discountInPer}%` : `Flat ₹${cartData?.discountAllInfo?.flatDiscountAmount} Off`})</Text>
                                                            }:</Text>
                                                        </View>
                                                        <Text style={styles.val}>- ₹ {parseFloat(cartData?.totalBillDiscountAmount).toFixed(2)}</Text>
                                                    </View>
                                                    {
                                                        appliedCouponData != null &&
                                                        <View style={styles.calc_item}>
                                                            <View style={{ flexDirection: "row", alignItems: "center" }}>
                                                                <BadgePercent color="#566573" size={16} />
                                                                <Text style={styles.tot_lbl}>Coupon - ({appliedCouponData?.couponDiscountCode}):</Text>
                                                            </View>
                                                            <Text style={styles.val}>- ₹ {appliedCouponData?.couponAmount}</Text>
                                                        </View>
                                                    }

                                                    {
                                                        isCustomerDiscountApply &&
                                                        <View style={styles.calc_item}>
                                                            <View style={{ flexDirection: "row", alignItems: "center" }}>
                                                                <DiamondPercent color="#566573" size={16} />
                                                                <Text style={styles.tot_lbl}>Customer Discount:</Text>
                                                            </View>
                                                            <Text style={styles.val}>- ₹ {parseFloat(customerSpecificDiscount).toFixed(2)}</Text>
                                                        </View>
                                                    }

                                                    <View style={styles.calc_item}>
                                                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                                                            <Castle color="#566573" size={16} />
                                                            <Text style={styles.tot_lbl}>GST ({avgGST}%):</Text>
                                                        </View>
                                                        <Text style={styles.val}>+ ₹ {parseFloat(gstAmount).toFixed(2)}</Text>
                                                    </View>

                                                    <View style={styles.calc_item}>
                                                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                                                            <ReceiptText color="#566573" size={16} />
                                                            <Text style={styles.tot_lbl}>Grand Total:</Text>
                                                        </View>
                                                        <Text style={styles.val}>₹ {grandTotal} </Text>
                                                    </View>

                                                    {
                                                        nextAvailableDiscount != null &&
                                                        <Text style={{ fontFamily: "Inter-Regular", fontSize: rMS(12), paddingHorizontal: rMS(5), paddingVertical: rMS(10), color: "#3498DB" }}>{nextAvailableDiscount?.discountMessage}</Text>
                                                    }

                                                    <View style={{ paddingHorizontal: rMS(5) }}>
                                                        <Button style={styles.cartBtn} onPress={() => updateCart()}>
                                                            <HStack space={3}>
                                                                <View>
                                                                    {
                                                                        checkIsPaymentGatway ?
                                                                            <Text style={styles.cart_lbl}>Continue with Payment Gateway</Text> :
                                                                            <Text style={styles.cart_lbl}>Continue with Wallet Payment</Text>
                                                                    }
                                                                </View>
                                                                {
                                                                    isBtnLoader &&
                                                                    <Spinner color="#ffffff" />
                                                                }
                                                            </HStack>
                                                        </Button>
                                                    </View>
                                                </View>
                                            </View>
                                        </View>

                                    </ScrollView>
                                </View>
                            </KeyboardAwareScrollView>
                        </View>
                    }

                    <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
                        <Modal.Content maxWidth="400px">
                            <Modal.CloseButton />
                            <Modal.Header>
                                <Text style={[styles.modalHeader, { width: "90%" }]}>Warning: Carton Size and Product Quantity Mismatch

                                </Text></Modal.Header>
                            <Modal.Body>
                                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: rMS(10) }}>
                                    <Text style={styles.phoneNumberLbl}
                                    >The quantity of products you have selected (in dozens) does not match the required carton size. This discrepancy means that your order cannot be processed for checkout. Please adjust the product quantity to match the carton size requirements.</Text>


                                </View>
                            </Modal.Body>
                        </Modal.Content>
                    </Modal>

                    <Modal isOpen={productValidModal} onClose={() => setProductValidModal(false)}>
                        <Modal.Content maxWidth="400px">
                            <Modal.CloseButton />
                            <Modal.Header>
                                <Text style={styles.modalHeader}>Warning: Product Quantity Not Valid

                                </Text></Modal.Header>
                            <Modal.Body>
                                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: rMS(10) }}>
                                    {
                                        <Text style={styles.phoneNumberLbl}
                                        >The quantity you have entered is not valid. Please enter a valid quantity.</Text>

                                    }
                                </View>
                            </Modal.Body>
                        </Modal.Content>
                    </Modal>

                    <Modal size={'full'} isOpen={productDetailModal} closeOnOverlayClick="true" onClose={() => setProductDetailModal(false)}>
                        <Modal.Content maxH="full">
                            <Modal.CloseButton />
                            <Modal.Header>
                                <Text adjustsFontSizeToFit={true} style={styles.modalHeader}><Text style={[styles.productTitle, { width: "60%" }]} numberOfLines={1}>Product Information</Text></Text>
                            </Modal.Header>
                            <Modal.Body>
                                {
                                    productInfoLoading ? <View style={{ flexDirection: "row", justifyContent: "center" }}>
                                        <HStack space={2} alignItems="center">
                                            <Text style={{ color: "black", fontSize: 16 }}>Getting Product Info</Text><Spinner color="#B6974E" size={"sm"} accessibilityLabel="Loading posts" />
                                        </HStack>
                                    </View> :

                                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: rMS(10) }}>
                                            <SafeAreaView>
                                                <View>
                                                    <View style={{ width: wp("100%"), height: hp("30%") }}>
                                                        {
                                                            (productDetailInfo != null && productDetailInfo?.images.length) ?
                                                                <SliderBox images={productDetailInfo?.images.map(ele => `${IMAGE_PATH}${ele.documentPath}`)} ImageComponent={(props) => (
                                                                    <FastImage
                                                                        {...props}

                                                                        resizeMode={FastImage.resizeMode.contain}
                                                                    />
                                                                )} dotColor="#B6974E" inactieDotColor="black"
                                                                    ImageComponentStyle={{ objectFit: "contain" }} imageLoadingColor="#B6974E"
                                                                /> :
                                                                <Image style={{ width: "100%", height: "100%", objectFit: "contain" }} resizeMode="contain" source={{
                                                                    uri: NO_IMAGE
                                                                }} />
                                                        }
                                                        {/* <Image style={{ width: "100%", height: "100%", objectFit: "contain" }} resizeMode="contain" source={{
                                                                uri: `${IMAGE_PATH}${productDetailInfo?.images[0].documentPath}`
                                                            }} /> */}


                                                    </View>

                                                    {
                                                        productDetailInfo != null &&
                                                        <View style={styles.productInfoWrapper}>
                                                            <ScrollView horizontal={false} showsVerticalScrollIndicator={false}>
                                                                <View style={{ flexDirection: "column", gap: 20 }}>
                                                                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                                                                        <Text style={[styles.productTitle, { width: "60%" }]} numberOfLines={2}>{productDetailInfo?.productName}</Text>
                                                                        <View style={{ flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
                                                                            <Text adjustsFontSizeToFit={true} style={{ color: "#B6974E", fontFamily: "Inter-Regular" }}>Price</Text>
                                                                            <Text adjustsFontSizeToFit={true} style={styles.productTitle}>₹ {productDetailInfo?.isDiscountActive == "Y" ? parseFloat(productDetailInfo?.discountedPrice).toFixed(2) : parseFloat(productDetailInfo?.price).toFixed(2)}</Text>
                                                                        </View>
                                                                    </View>

                                                                    <View style={{ flexDirection: "row", gap: 10 }}>
                                                                        <Star />
                                                                        <Text adjustsFontSizeToFit={true} style={styles.ratingLbl}>{productDetailInfo?.rating}</Text>
                                                                    </View>

                                                                    {
                                                                        productDetailInfo?.description &&
                                                                        <View>
                                                                            <Text adjustsFontSizeToFit={true} style={styles.descriptionLbl}>{productDetailInfo?.description}</Text>
                                                                        </View>
                                                                    }

                                                                    <View>
                                                                        <Text adjustsFontSizeToFit={true} style={styles.productTitle}>Product Detail</Text>

                                                                        <View style={{ flexDirection: "column", gap: 10, marginTop: rMS(10) }}>

                                                                            {
                                                                                productDetailInfo?.categoryName &&
                                                                                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                                                                                    <Text adjustsFontSizeToFit={true} style={styles.lbl}>Category</Text>
                                                                                    <Text adjustsFontSizeToFit={true} style={styles.vallbl}>{productDetailInfo?.categoryName}</Text>
                                                                                </View>
                                                                            }

                                                                            {
                                                                                productDetailInfo?.subCategoryName &&
                                                                                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                                                                                    <Text adjustsFontSizeToFit={true} style={styles.lbl}>Sub Category</Text>
                                                                                    <Text adjustsFontSizeToFit={true} style={[styles.vallbl]} numberOfLines={2}>{productDetailInfo?.subCategoryName}</Text>
                                                                                </View>
                                                                            }

                                                                            {
                                                                                // productDetailInfo?.stockQuantity &&
                                                                                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                                                                                    <Text adjustsFontSizeToFit={true} style={styles.lbl}>Stock</Text>
                                                                                    <Text adjustsFontSizeToFit={true} style={styles.vallbl}>{productDetailInfo?.stockQuantity} Piece</Text>
                                                                                </View>
                                                                            }
                                                                        </View>

                                                                    </View>
                                                                </View>
                                                            </ScrollView>
                                                        </View>
                                                    }
                                                </View>
                                            </SafeAreaView>
                                        </View>
                                }
                            </Modal.Body>
                        </Modal.Content>
                    </Modal>

                </ScrollView>
            </View>

            {
                isLoading &&
                <View style={styles.overlay}>
                    <HStack space={2} alignItems="center">
                        <Spinner color="#B6974E" size={"lg"} accessibilityLabel="Loading posts" />
                    </HStack>
                </View>
            }

        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    overlay: {
        height: "100%",
        position: "absolute",
        // backgroundColor: "rgba(0,0,0, 0.9)",
        opacity: 0.5,
        zIndex: 1,
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center"

    },

    container: {
        paddingHorizontal: "3%",
        paddingBottom: "12%",
        position: "relative"
    },
    bulkTitleWrapper: {
        display: "flex",
        flexDirection: "row",
        alignItems: "center"
    },

    title: {
        color: "#272727",
        fontWeight: "700",
        fontSize: 16,
        marginLeft: "30%",
        width: "100%",
        fontFamily: "Inter-Regular"
    },

    button: {
        backgroundColor: "#F4F4F4",
        borderRadius: 50,
        width: 40,
        height: 40,
        borderWidth: 1,
        borderStyle: "solid",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",

    },
    subCategoryWrapper: {
        borderRadius: 8,
        backgroundColor: 'white',
        height: "100",
        marginBottom: rMS(10),
        borderColor: "#566573",
    },
    labelBgColor: {
        backgroundColor: "#B6974E",
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center"
    },
    lbl: {
        fontSize: rMS(14),
        fontFamily: "Inter-Regular",
        color: "#FFFFFF",
        // padding: rMS(5)
        paddingHorizontal: rMS(5)
    },
    productWrapper: {

    },

    productValid: {
        paddingBottom: rMS(5)
    },

    productInvalid: {
        paddingBottom: rMS(5),
        borderWidth: 1,
        borderColor: "#E74C3C",
        // backgroundColor: "#FADBD8"
    },

    productItemWrapper: {
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        marginVertical: 5,
        paddingHorizontal: rMS(5),
        width: "100%",
        height: hp("5%"),
    },
    productImage: {
        width: 60,
        height: 60,
        borderRadius: 60
    },
    productImageWrapper: {
        width: "20%"
    },
    productTitleWrapper: {
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: 5,
        width: wp("30%")
    },

    productTitle: {
        fontSize: rMS(14),
        color: "#272727",
        fontFamily: "Inter-Regular"
    },

    productPriceWrapper: {
        display: "flex",
        flexDirection: "row",
        justifyContent: "flex-end",
        alignItems: "center",
        // // marginLeft: "3%",
        gap: 15,
        width: wp("63%"),
        paddingHorizontal: rMS(10)
    },

    productPrice: {
        fontWeight: "700",
        textAlign: "right",
        width: "30%"
        // textDecorationLine: "underline"

    },

    qtyBtnWrapper: {
        display: "flex",
        flexDirection: "row",
        justifyContent: "flex-end",
        alignItems: "center",
    },
    qty: {
        marginHorizontal: 15,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center"
    },
    unit: {
        color: "#272727",
        fontSize: 14,
        opacity: 0.5,
        marginLeft: 5,
        fontWeight: "700",
        fontFamily: "Inter-Regular"
    },
    calc_item: {
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingLeft: rMS(5)
    },
    priceWrapper: {
        marginTop: rMS(5),
        backgroundColor: 'white',
        paddingVertical: rMS(10),
        borderRadius: 6,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
    },
    tot_lbl: {
        fontSize: rMS(16),
        fontFamily: "Inter-Regular",
        color: "#B6974E",
        padding: rMS(5)
    },
    val: {
        fontSize: rMS(16),
        fontFamily: "Inter-Regular",
        color: "#2C3E50",
        padding: rMS(5),
        fontWeight: "700"
    },
    cartBtn: {
        backgroundColor: '#B6974F',
        color: '#FFFFFF',
        // borderRadius: 60,
        // paddingVertical: 12,
        // paddingHorizontal: 48,
        display: 'flex',
        alignItems: 'center',
        marginTop: 10,
        fontSize: 16,
        fontFamily: "Inter-Regular"
    },

    cart_lbl: {
        display: "flex",
        fontSize: rMS(18),
        alignItems: "center",
        justifyContent: "center",
        gap: 3,
        flexDirection: "row",
        // fontWeight: "700",
        color: '#FFFFFF',
        fontFamily: "Inter-Regular"
    },
    qtyInput: {
        fontSize: 11,
        fontWeight: "700",
        textAlign: "center",
        fontFamily: "Inter-Regular"
    },
    applyCouponWrapper: {
        // marginTop: rMS(5),
        backgroundColor: 'white',
        display: "flex",
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: rMS(5),
        borderRadius: 6,
        paddingHorizontal: rMS(5)
    },
    sheet: {
        borderTopLeftRadius: 14,
        borderTopRightRadius: 14
    },
    couponLbl: {
        color: "#B6974F",
        // fontWeight: "700",
        fontSize: rMS(16),
        fontFamily: "Inter-Regular"
    },
    applyBtn: {
        backgroundColor: '#FFFFFF',
        paddingVertical: rMS(5),
        paddingHorizontal: rMS(10),
        display: 'flex',
        alignItems: 'center',
        flexDirection: "row",
        // marginTop: rMS(10),
        borderWidth: 1,
        borderColor: "#B6974F",
        borderRadius: 4
        // height: "20"


    },
    tapToApply: {
        backgroundColor: '#D6EAF8',
        paddingVertical: rMS(5),
        paddingHorizontal: rMS(10),
        display: 'flex',
        alignItems: 'center',
        flexDirection: "row",
        borderRadius: 4
    },
    tapToApplyLbl: {
        fontSize: rMS(14),
        color: '#3498DB',
    },
    appliedBtn: {
        backgroundColor: '#FFFFFF',
        paddingVertical: rMS(5),
        paddingHorizontal: rMS(10),
        display: 'flex',
        alignItems: 'center',
        flexDirection: "row",
        borderRadius: 4,
        borderTopWidth: 1,
        borderColor: "lightgrey"
    },
    appliedText: {
        fontSize: rMS(14),
        color: '#28B463',
    },
    applyLbl: {
        fontSize: rMS(12),
        color: '#B6974F',
        // fontWeight: "700"
    },
    cartEmptyWrapper: {
        height: hp("80%"),
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
    },
    cartEmptyLbl: {
        fontSize: rMS(20),
        color: '#B6974F',
        fontFamily: "Inter-Regular",
        paddingHorizontal: rMS(20),
        textAlign: "center",
        marginTop: rMS(20)
    },
    couponContainer: {
        borderRadius: 6,
        borderColor: "lightgrey",
        borderWidth: 1,
        marginVertical: rMS(10),
        marginHorizontal: rMS(10)
    },
    couponItemWrapper: {
        paddingHorizontal: rMS(20),
        paddingVertical: rMS(10),

    },
    code: {
        // borderWidth: 1,
        // borderStyle: "dashed"
        backgroundColor: "#F4F4F4",
        width: "25%",
        borderWidth: 1,
        borderStyle: "solid",
        borderColor: "#000000",
        borderRadius: 6,
        paddingVertical: rMS(8)
    },
    codeLbl: {
        width: "100%",
        textAlign: "center",
        color: "#000000",
        fontFamily: "Inter-Regular",
        fontWeight: "700"
    },
    couponMessage: {
        color: "#3498DB",
        paddingVertical: rMS(10)
    },
    addressWrapper: {
        // marginTop: rMS(5),
        backgroundColor: 'white',
        paddingVertical: rMS(5),
        borderRadius: 6,
        paddingHorizontal: rMS(5),
        marginTop: rMS(10)
    },
    deliverToLbl: {
        fontSize: rMS(16),
        color: '#B6974F',
        fontWeight: "700",
        marginBottom: rMS(5)
    },

    billingLbl: {
        fontSize: rMS(15),
        color: '#B6974F',
        marginBottom: rMS(5)
    },

    addressTxt: {
        fontSize: rMS(14),
        color: 'grey',
    },
    changeBtn: {
        borderWidth: 1,
        borderRadius: 4,
        padding: rMS(2),
        borderColor: "#B6974F",
        paddingHorizontal: rMS(5)
    },
    changeBtnLbl: {
        fontSize: rMS(10),
        color: "#B6974F"
    },
    warrningMsg: {
        color: "#000000",
        fontSize: rMS(12),
        fontFamily: "Inter-Regular"
    },
    warnningView: {
        backgroundColor: "#fff3cd",
        paddingHorizontal: rMS(5),
        paddingVertical: rMS(5)
    },
    errorView: {
        backgroundColor: "#f8d7da",
        paddingHorizontal: rMS(5),
        paddingVertical: rMS(5)
    },
    modalHeader: {
        fontFamily: "Inter-Regular",
        fontSize: rMS(14),
        fontWeight: "700",
        color: "#E74C3C"
    },
    creditWrapper: {
        marginTop: rMS(5),
        backgroundColor: "#FFFFFF",
        flexDirection: "column",
        gap: 10,
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: rMS(10),
        paddingHorizontal: rMS(5),
        borderRadius: 6
    },
    productInfoWrapper: {
        // height: hp("55%"),
        width: "93%",
        borderTopLeftRadius: rMS(20),
        borderTopRightRadius: rMS(20),
        marginTop: "-5%",
        paddingTop: rMS(30),
        paddingBottom: rMS(10),
        paddingHorizontal: rMS(10),
        backgroundColor: "#EDEDED"
    },
    ratingLbl: {
        fontFamily: "Inter-Regular",
        fontSize: rMS(16),
        fontWeight: "700",
        color: "rgb(86, 101, 115)"
    },
    descriptionLbl: {
        fontFamily: "Inter-Regular",
        fontSize: rMS(16),
        color: "#6B7280"
    },
    lbl: {
        fontFamily: "Inter-Regular",
        fontSize: rMS(15),
        color: "#000000"
    },
    vallbl: {
        fontFamily: "Inter-Regular",
        fontSize: rMS(15),
        color: "#6B7280"
    },
});

export default Cart;