import { Platform, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { Button, Divider, HStack, ScrollView, Skeleton, Spinner, useToast } from 'native-base'
import RazorpayCheckout from 'react-native-razorpay';
import { rMS } from '../../utils/responsive';
import Back from "../../../assets/back.svg";
import RBSheet from 'react-native-raw-bottom-sheet';
import { CAPTURE_PAYMENT, GENERATE_ORDER_ID, GET_ADDREES_LIST } from '../../utils/constant';
import { getCartDataInGlobal, getCustomerId, getUserInfo, isAccountBack, setAccountBack } from '../../utils/helper';
import { HTTP_GET, HTTP_POST } from '../../utils/http-service';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { BadgePercent, Castle, DiamondPercent, ReceiptText, ShoppingBag, TicketPercent } from 'lucide-react-native';


const Payment = ({ route, navigation }) => {
    if(route.params === undefined){
        route.params = getCartDataInGlobal();
    }

    const [defaultAddress, setDefaultAddress] = useState(null);
    const [shippingAddress, setShippingAddress] = useState(null);
    const [addressList, setAddressList] = useState([]);
    const [isAddressLoading, setIsAddressLoading] = useState(false);
    const [params, setParams] = useState(route.params ? route.params : null);
    const [cartData, setCartData] = useState(route.params ? route.params.cartData : null);
    const [grandTotal, setGrandTotal] = useState(route.params ? route.params.grandTotal : 0);
    const [isLoading, setIsLoading] = useState(false);
    const [gstAmount, setGstAmount] = useState(0);

    const refShippingAddress = useRef();
    const refBillingAddress = useRef();

    const toast = useToast();

    useEffect(() => {
        getAllAddress();
    }, []);

    useEffect(() => {
        if (cartData != null) {
            let amt = cartData?.totalBillAmount;
            if (params?.discountInfo) {
                amt = amt - cartData?.totalBillDiscountAmount;
            }
            if (params?.couponInfo) {
                amt = amt - params?.couponInfo?.couponAmount;
            };
            amt = amt * (params.gst / 100);
            setGstAmount(amt);
        }
    }, []);

    const getAllAddress = async () => {
        setIsAddressLoading(true);
        const customerId = await getCustomerId();
        const URL = `${GET_ADDREES_LIST}/${customerId}`;
        const data = await HTTP_GET(URL);
        if (data != null && data["status"] !== undefined) {
            if (data["status"] === "invalid") {
                toast.show({ description: "Oops! Something went wrong while fetching your details." });
            } else if (data["status"] === "error") {
                toast.show({ description: "Oops! Something went wrong while fetching your details. " });
            }
            setIsAddressLoading(false);
        } else {
            data.forEach(address => {
                if (address.isDefault === "Y") {
                    setDefaultAddress(address);
                    setShippingAddress(address);
                }
            });
            setAddressList(data);
            // setAddressList([]);
            // setDefaultAddress(null);
            // setShippingAddress(null);
            setIsAddressLoading(false);
        }

    }

    const changeBillingAddress = (address) => {
        setDefaultAddress(address);
        refBillingAddress.current.close();
    }

    const changeShippingAddress = (address) => {
        setShippingAddress(address);
        refShippingAddress.current.close();
    }

    const placeCreditOrder = async () => {
        setIsLoading(true);

        const { prod_list, cartData, finalAmount } = route.params;

        let body = {
            customerId: await getCustomerId(),
            subcategories: [{ "products": prod_list }],
            billAmountDiscountCode: cartData?.billAmountDiscountCode,
            couponCode: params?.couponInfo ? params?.couponInfo?.couponDiscountCode : null,
            finalAmount: finalAmount,
            shippingAddressId: shippingAddress.addressId,
            billingAddressId: defaultAddress.addressId,
            avgGstPercent: params?.gst,
            paymentType: params.checkIsPaymentGatway ? 'razorpay' : 'credit'
        }

        const URL = `${GENERATE_ORDER_ID}`;
        const data = await HTTP_POST(URL, body);
        
        if (data != null && data["orderInfoId"] && body.paymentType == "credit") {
            navigation.navigate("PaymentSuccess");
        } else {
            navigation.navigate("PaymentFailed");
        }

        setIsLoading(false);
    }


    const placeOrder = async () => {

        setIsLoading(true);

        const { prod_list, cartData, isCustomerDiscountApplicable, finalAmount } = route.params;

        let body = {
            customerId: await getCustomerId(),
            subcategories: [{ "products": prod_list }],
            billAmountDiscountCode: cartData?.billAmountDiscountCode,
            couponCode: params?.couponInfo ? params?.couponInfo?.couponDiscountCode : null,
            finalAmount: +parseFloat(finalAmount).toFixed(2),
            shippingAddressId: shippingAddress.addressId,
            billingAddressId: defaultAddress.addressId,
            avgGstPercent: params?.gst,
            paymentType: params.checkIsPaymentGatway ? 'razorpay' : 'credit'
        }


        const URL = `${GENERATE_ORDER_ID}`;
        const data = await HTTP_POST(URL, body);

        if (data == null) {
            toast.show({ description: "Uh-oh! 🚫 Failed to placed order. Please try again. 🛒" });
            setIsLoading(false);
            return;
        }
        if (data != null && data["status"] !== undefined && (data["status"] == "invalid" || data["status"] == "error")) {
            if (data["status"] === "invalid") {
                toast.show({ description: "Uh-oh! 🚫 Failed to placed order. Please try again. 🛒" });
            } else if (data["status"] === "error") {
                toast.show({ description: "Something went wrong!!" });
            }
            setIsLoading(false);
        } else {
            callRazorpay(data?.razorpayOrderNo, data?.amount);
        }
    }

    const back = () => {
        navigation.navigate("Dashboard", { screen: "Cart" });
    }

    const callRazorpay = async (rzp_ord_id, amt) => {

        const user = await getUserInfo();
        var options = {
            description: 'Alnuiam Payment Test',
            image: 'https://i.imgur.com/3g7nmJC.jpg',
            currency: 'INR',
            key: 'rzp_test_haQ4kKKc1upODA',
            amount: Math.round(amt) * 100,
            name: 'Alnuiam',
            order_id: rzp_ord_id,
            prefill: {
                email: user?.emailId,
                contact: user?.customerId?.mobileNumber,
                name: user?.customerId?.customerName
            },
            theme: { color: '#B6974E' }
        }

        RazorpayCheckout.open(options).then((data) => {
            capturePayment(data, "Success")
        }).catch((error) => {
            capturePayment({ razorpay_order_id: rzp_ord_id }, "Failure")
        });

    }

    const capturePayment = async (rzp_response, status) => {
        const URL = `${CAPTURE_PAYMENT}`;
        let body = null;

        // return;

        if (status == "Success") {
            body = {
                "razorpay_signature": rzp_response?.razorpay_signature,
                "razorpay_order_id": rzp_response?.razorpay_order_id,
                "razorpay_payment_id": rzp_response?.razorpay_payment_id,
                "status": "Success"
            }
        } else {
            body = {
                status: "Failure",
                "razorpay_order_id": rzp_response?.razorpay_order_id
            }

        }

        const data = await HTTP_POST(URL, body);

        if (data != null && data["status"] !== undefined && data["errorStatus"] == "invalid") {
            navigation.navigate("PaymentFailed");
        } else {
            if (status == "Failure") {
                navigation.navigate("PaymentFailed");
            } else {
                navigation.navigate("PaymentSuccess");
            }
        }
    }

    const gotoAddress = () => {
        setAccountBack(false);
        navigation.navigate("Dashboard", { screen: "Address" });
    }

    return (
        <SafeAreaView>
            <View style={styles.container}>
                <View style={styles.editProfileTitle}>
                    <View style={styles.button}><Back width={40} height={40} onPress={back} /></View>
                    <Text adjustsFontSizeToFit={true} style={styles.title}>Checkout</Text>
                </View>


                <View>
                    <View style={{ flexDirection: "column", justifyContent: "space-between", height: Platform.OS === 'ios' ? hp('80%') : hp("90%") }}>
                        <View style={styles.addressWrapper}>
                            <View>
                                <Text adjustsFontSizeToFit={true} style={styles.deliverToLbl}>Your Delivery Destination</Text>
                            </View>


                            {
                                isAddressLoading && defaultAddress == null && shippingAddress == null &&

                                <View style={{ flexDirection: 'column', gap: rMS(10) }}>
                                    <Skeleton h={40} rounded="md" background="#ffffff" />

                                    <Skeleton h={40} rounded="md" background="#ffffff" />
                                </View>

                            }

                            {
                                !isAddressLoading && defaultAddress != null &&

                                <View>
                                    <View style={styles.addressItem}>
                                        <View style={{ display: "flex", flexDirection: "row", justifyContent: "space-between" }}>
                                            <Text adjustsFontSizeToFit={true} style={styles.billingLbl}>Billing Address</Text>
                                            <Pressable style={styles.changeBtn} onPress={() => refBillingAddress.current.open()}>
                                                <Text adjustsFontSizeToFit={true} style={styles.changeBtnLbl}>Change</Text>
                                            </Pressable>
                                        </View>
                                        <View style={{ marginTop: rMS(10) }}>
                                            <Text adjustsFontSizeToFit={true} style={styles.addressTxt}>{defaultAddress?.streetAddress}</Text>
                                            <Text adjustsFontSizeToFit={true} style={styles.addressTxt}>{defaultAddress?.city}, {defaultAddress?.state}</Text>
                                            <Text adjustsFontSizeToFit={true} style={styles.addressTxt}>{defaultAddress?.zipCode}</Text>
                                        </View>


                                    </View>

                                </View>
                            }

                            {
                                !isAddressLoading && shippingAddress != null &&
                                <View style={styles.addressItem}>
                                    <View style={{ display: "flex", flexDirection: "row", justifyContent: "space-between" }}>
                                        <Text adjustsFontSizeToFit={true} style={styles.billingLbl}>Shipping Address</Text>
                                        <Pressable style={styles.changeBtn} onPress={() => refShippingAddress.current.open()}>
                                            <Text adjustsFontSizeToFit={true} style={styles.changeBtnLbl}>Change</Text>
                                        </Pressable>
                                    </View>
                                    <View style={{ marginTop: rMS(10) }}>
                                        <Text adjustsFontSizeToFit={true} style={styles.addressTxt}>{shippingAddress?.streetAddress}</Text>
                                        <Text adjustsFontSizeToFit={true} style={styles.addressTxt}>{shippingAddress?.city}, {shippingAddress?.state}</Text>
                                        <Text adjustsFontSizeToFit={true} style={styles.addressTxt}>{shippingAddress?.zipCode}</Text>
                                    </View>
                                </View>

                            }


                            {
                                !isAddressLoading && addressList.length == 0 && defaultAddress == null && shippingAddress == null &&

                                <View>
                                    <View style={{ flexDirection: "column", gap: rMS(10) }}>
                                        <Pressable style={styles.emptyAddressItem} onPress={() => gotoAddress()}>
                                            <Text adjustsFontSizeToFit={true} style={styles.emptyLbl}>Add default address</Text>
                                        </Pressable>

                                        <Pressable style={styles.emptyAddressItem} onPress={() => gotoAddress()}>
                                            <Text adjustsFontSizeToFit={true} style={styles.emptyLbl}>Add shipping address</Text>
                                        </Pressable>

                                    </View>
                                </View>
                            }

                            {
                                !isAddressLoading && addressList.length != 0 && defaultAddress == null && (
                                    <View>
                                        <View style={{ flexDirection: "column", gap: rMS(10) }}>
                                            <Pressable style={styles.emptyAddressItem} onPress={() => refBillingAddress.current.open()}>
                                                <Text adjustsFontSizeToFit={true} style={styles.emptyLbl}>Select default address</Text>
                                            </Pressable>
                                        </View>
                                    </View>
                                )
                            }

                            {
                                !isAddressLoading && addressList.length != 0 && shippingAddress == null && (
                                    <View>
                                        <View style={{ flexDirection: "column", gap: rMS(10) }}>
                                            <Pressable style={styles.emptyAddressItem} onPress={() => refShippingAddress.current.open()}>
                                                <Text adjustsFontSizeToFit={true} style={styles.emptyLbl}>Select shipping address</Text>
                                            </Pressable>
                                        </View>
                                    </View>
                                )
                            }


                        </View>


                        <View>

                            <RBSheet height={rMS(600)} ref={refBillingAddress}
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

                                <ScrollView horizontal="false">
                                    {
                                        addressList.map(item => {
                                            return (
                                                <View key={item?.addressId} style={styles.couponItemWrapper}>
                                                    <View>
                                                        <Text adjustsFontSizeToFit={true} style={styles.addressTxt}>{item?.streetAddress}</Text>
                                                        <Text adjustsFontSizeToFit={true} style={styles.addressTxt}>{item?.city}, {item?.state}</Text>
                                                        <Text adjustsFontSizeToFit={true} style={styles.addressTxt}>{item?.zipCode}</Text>
                                                    </View>

                                                    <Button style={styles.applyBtn} onPress={() => changeBillingAddress(item)}>
                                                        <Text adjustsFontSizeToFit={true} style={styles.applyLbl}>Set this as billing address</Text>
                                                    </Button>
                                                </View>
                                            )
                                        })
                                    }

                                </ScrollView>

                            </RBSheet>


                            <RBSheet height={rMS(600)} ref={refShippingAddress}
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

                                <ScrollView horizontal="false">
                                    {
                                        addressList.map(item => {
                                            return (
                                                <View key={item?.addressId} style={styles.couponItemWrapper}>
                                                    <View>
                                                        <Text adjustsFontSizeToFit={true} style={styles.addressTxt}>{item?.streetAddress}</Text>
                                                        <Text adjustsFontSizeToFit={true} style={styles.addressTxt}>{item?.city}, {item?.state}</Text>
                                                        <Text adjustsFontSizeToFit={true} style={styles.addressTxt}>{item?.zipCode}</Text>
                                                    </View>

                                                    <Button style={styles.applyBtn} onPress={() => changeShippingAddress(item)}>
                                                        <Text adjustsFontSizeToFit={true} style={styles.applyLbl}>Set this as shipping address</Text>
                                                    </Button>
                                                </View>
                                            )
                                        })
                                    }

                                </ScrollView>

                            </RBSheet>

                            <View style={styles.priceWrapper}>
                                <View style={styles.calc_item}>
                                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                                        <ShoppingBag color="#566573" size={16} />
                                        <Text adjustsFontSizeToFit={true} style={styles.tot_lbl}>Total:</Text>
                                    </View>
                                    {
                                        cartData != null ?
                                            <Text adjustsFontSizeToFit={true} style={styles.val}>₹ {(cartData?.totalBillAmount).toFixed(2)}</Text>
                                            :
                                            <Text adjustsFontSizeToFit={true} style={styles.val}>₹ 0</Text>
                                    }
                                </View>

                                <View style={styles.calc_item}>
                                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                                        <TicketPercent color="#566573" size={16} />
                                        <Text adjustsFontSizeToFit={true} style={styles.tot_lbl}>Discount  {
                                            cartData?.billAmountDiscountCode != null && <Text  >({cartData?.discountAllInfo?.discountCategory == "Percentage" ? cartData?.discountAllInfo?.maxDiscountAmount != null ? `${cartData?.discountAllInfo?.discountInPer}% upto ${cartData?.discountAllInfo?.maxDiscountAmount}` : `${cartData?.discountAllInfo?.discountInPer}%`  : `Flat ₹${cartData?.discountAllInfo?.flatDiscountAmount} Off`})</Text>
                                        }:</Text>
                                    </View>
                                    {
                                        cartData != null ?
                                            <Text adjustsFontSizeToFit={true} style={styles.val}>- ₹ {(cartData?.totalBillDiscountAmount).toFixed(2)}</Text> :
                                            <Text adjustsFontSizeToFit={true} style={styles.val}>- ₹ 0</Text>

                                    }
                                </View>

                                {
                                    params?.couponInfo &&
                                    <View style={styles.calc_item}>
                                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                                            <BadgePercent color="#566573" size={16} />
                                            <Text adjustsFontSizeToFit={true} style={styles.tot_lbl}>Coupon  {
                                                params?.couponInfo?.couponDiscountCode != null && <Text adjustsFontSizeToFit={true}>({params?.couponInfo?.couponDiscountCode})</Text>
                                            }:</Text>
                                        </View>
                                        {
                                            params?.couponInfo != null ?
                                                <Text adjustsFontSizeToFit={true} style={styles.val}>- ₹ {parseFloat(params?.couponInfo?.couponAmount).toFixed(2)}</Text> :
                                                <Text adjustsFontSizeToFit={true} style={styles.val}>- ₹ 0</Text>

                                        }
                                    </View>
                                }

                                {
                                    params != null && params?.isCustomerDiscountApply &&
                                    <View style={styles.calc_item}>
                                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                                            <DiamondPercent color="#566573" size={16} />
                                            <Text adjustsFontSizeToFit={true} style={styles.tot_lbl}>Customer Discount </Text>
                                        </View>

                                        {
                                            cartData != null ?
                                                <Text adjustsFontSizeToFit={true} style={styles.val}>- ₹ {parseFloat(params?.customerSpecificDiscount).toFixed(2)}</Text> :
                                                <Text adjustsFontSizeToFit={true} style={styles.val}>₹ 0</Text>

                                        }
                                    </View>
                                }

                                <View style={styles.calc_item}>
                                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                                        <Castle color="#566573" size={16} />
                                        {
                                            cartData != null ?
                                                <Text adjustsFontSizeToFit={true} style={styles.tot_lbl}>GST ({params?.gst}%):</Text> :
                                                <Text adjustsFontSizeToFit={true} style={styles.tot_lbl}>GST (0%):</Text>
                                        }
                                    </View>
                                    {
                                        cartData != null ?
                                            <Text adjustsFontSizeToFit={true} style={styles.val}>+ ₹ {(gstAmount).toFixed(2)}</Text> :
                                            <Text adjustsFontSizeToFit={true} style={styles.val}>+ ₹ 0</Text>

                                    }
                                </View>

                                <View style={styles.calc_item}>
                                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                                        <ReceiptText color="#566573" size={16} />
                                        <Text adjustsFontSizeToFit={true} style={styles.tot_lbl}>Grand Total:</Text>
                                    </View>
                                    <Text adjustsFontSizeToFit={true} style={styles.val}>₹ {grandTotal} </Text>
                                </View>
                                <View style={{ paddingHorizontal: rMS(5) }}>
                                    <Button style={styles.cartBtn} onPress={() => params.checkIsPaymentGatway ? placeOrder() : placeCreditOrder()}>
                                        <HStack space={3}>
                                            <Text adjustsFontSizeToFit={true} style={styles.cart_lbl}>Place Order</Text>
                                            {
                                                isLoading &&
                                                <Spinner color="#ffffff" />
                                            }
                                        </HStack>
                                    </Button>
                                </View>
                            </View>

                        </View>

                    </View>
                </View>
            </View>
        </SafeAreaView>
    )
}

export default Payment

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: "5%",
        paddingVertical: "5%",
        position: "relative"
    },
    editProfileTitle: {
        display: "flex",
        flexDirection: "row",
        alignItems: "center"
    },

    title: {
        color: "#272727",
        fontWeight: "700",
        fontSize: rMS(16),
        marginLeft: "30%",
        width: "100%"
    },

    button: {
        backgroundColor: "#F4F4F4",
        borderRadius: 50,
        width: rMS(40),
        height: rMS(40),
        borderWidth: 1,
        borderStyle: "solid",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",

    },
    addressWrapper: {
        paddingVertical: rMS(5),
        borderRadius: 6,
        paddingHorizontal: rMS(5),
        marginTop: rMS(10)
    },
    deliverToLbl: {
        fontSize: rMS(18),
        color: '#B6974F',
        fontWeight: "700",
        textAlign: "center",
        marginBottom: rMS(15)
    },

    billingLbl: {
        fontSize: rMS(16),
        color: '#B6974F',
        marginBottom: rMS(5)
    },

    addressTxt: {
        fontSize: rMS(16),
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
        fontSize: rMS(12),
        color: "#B6974F"
    },
    addressItem: {
        backgroundColor: 'white',
        borderRadius: 6,
        marginBottom: rMS(10),
        padding: rMS(10)
    },
    couponItemWrapper: {
        borderWidth: 1,
        paddingHorizontal: rMS(20),
        paddingVertical: rMS(10),
        marginVertical: rMS(10),
        marginHorizontal: rMS(10),
        borderRadius: 6,
        borderColor: "lightgrey"
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
    applyLbl: {
        fontSize: rMS(12),
        color: '#B6974F',
        // fontWeight: "700"
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
    calc_item: {
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingLeft: rMS(5)
    },
    emptyAddressItem: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        padding: rMS(60),
        borderRadius: 6
    },
    emptyLbl: {
        fontFamily: "Inter-Regular",
        fontSize: rMS(16),
        color: "#2C3E50",
        borderWidth: 1,
        padding: rMS(10),
        borderRadius: 6,
        borderColor: "#B6974E"
    }
})