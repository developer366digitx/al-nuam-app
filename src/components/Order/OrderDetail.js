import { Platform, SafeAreaView, StyleSheet, Text, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import Back from "../../../assets/back.svg";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { rMS } from '../../utils/responsive';
import { DOWNLOAD_ATTACHMENTS, GET_ORDER_DETAIL, INVOICE_DOWNLOAD } from '../../utils/constant';
import { HTTP_GET, HTTP_GET_FILE } from '../../utils/http-service';
import { Button, HStack, ScrollView, Skeleton, Spinner, useToast } from 'native-base';
import SubcatHeaderLogo from "../../../assets/subcatLogo.svg";
import OrderInitiate from "../../../assets/orderinitiate.svg"
import OrderStart from "../../../assets/orderstart.svg";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BadgePercent, BookUser, Castle, DiamondPercent, NotebookTabs, Plane, ReceiptText, ShoppingBag, TicketPercent } from 'lucide-react-native';
import RNFS from 'react-native-fs';
import { request, PERMISSIONS } from 'react-native-permissions';

const OrderDetail = ({ route, navigation }) => {
    const [orderId, setOrderId] = useState(route.params ? route.params.orderId : 0);
    const [orderData, setOrderData] = useState(route.params ? route.params.orderData : null);
    const [productList, setProductList] = useState([]);
    const [shippingData, setShippingData] = useState([]);
    const [isDataLoading, setIsDataLoading] = useState(false);
    const [downloadLoading, setDownloadLoading] = useState(false);
    const [downloadAttachLoading, setDownloadAttachLoading] = useState(false);

    const toast = useToast();

    useEffect(() => {
        getShippingDataFromLocalStorage();
        getProductInfoByOrderId();
    }, [])

    useEffect(() => {
        if (shippingData.length) {
            getOrderStatus(orderData?.shippingStatus);
        }
    }, [shippingData]);



    const getShippingDataFromLocalStorage = async () => {
        const shippingData = await AsyncStorage.getItem("shippingData");
        let shippingList = JSON.parse(shippingData).map(item => {
            item["currentStatus"] = false;
            return item;
        });
        setShippingData(shippingList);

    }

    const getProductInfoByOrderId = async () => {
        setIsDataLoading(true);
        const URL = `${GET_ORDER_DETAIL}/${orderId}`;
        const data = await HTTP_GET(URL);

        if (data != null && data["status"] !== undefined) {
            if (data["status"] === "invalid") {
                toast.show({ description: "Oops! Something went wrong while fetching your details." });
            } else if (data["status"] === "error") {
                toast.show({ description: "Oops! Something went wrong while fetching your details. " });
            }
            setIsLoading(false);
        } else {
            setProductList(groupProductBySubCategory(data));
            setIsDataLoading(false);
        }


    }

    const groupProductBySubCategory = (prod_list) => {
        let tmpList = [];
        prod_list.map(ele => {
            if (tmpList.length == 0) {
                let obj = {
                    subCategoryName: ele?.subCategoryName,
                    subCategoryId: ele?.subCategory,
                    products: [ele]
                }
                tmpList.push(obj);
            } else {
                const index = tmpList.findIndex(item => item?.subCategoryId === ele?.subCategory);
                if (index != -1) {
                    tmpList[index].products.push(ele);
                } else {
                    let obj = {
                        subCategoryName: ele?.subCategoryName,
                        subCategoryId: ele?.subCategory,
                        products: [ele]
                    }
                    tmpList.push(obj);
                }
            }
        });

        return tmpList;

    }

    const getOrderStatus = async (shippingId) => {
        const foundIndex = shippingData.findIndex(item => item?.dropDownId == shippingId);
        if (foundIndex != -1) {
            for (let i = 0; i <= foundIndex; i++) {
                shippingData[i]["currentStatus"] = true;
            }
        }

        setShippingData(shippingData);
    }

    const back = () => {
        navigation.navigate("Order");
    }

    const requestPermissions = async () => {
        await request(PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE);
        await request(PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE);
    };

    const byteArrayToPdf = async (base64String, fileName) => {

        try {
            await requestPermissions();
            const folderPath = `${RNFS.DownloadDirectoryPath}/Alnuaim`;
            const filePath = `${folderPath}/${fileName}`;

            const folderExists = await RNFS.exists(folderPath);

            if (!folderExists) {
                await RNFS.mkdir(folderPath);
            }
            // Write the base64 string to a file
            await RNFS.writeFile(filePath, base64String, 'base64');
            setDownloadLoading(false);
            toast.show({
                description: "Invoice downloaded successfully.."
            });
        } catch (error) {
            setDownloadLoading(false);
            toast.show({
                description: "Invoice download failed or was not generated."
            });
            // console.error('Failed to save PDF:', error);
        }
    };

    const byteArrayToAttchment = async (base64String, fileName) => {

        try {
            await requestPermissions();
            const folderPath = `${RNFS.DownloadDirectoryPath}/Alnuaim`;
            const filePath = `${folderPath}/${fileName}`;

            const folderExists = await RNFS.exists(folderPath);

            if (!folderExists) {
                await RNFS.mkdir(folderPath);
            }
            // Write the base64 string to a file
            await RNFS.writeFile(filePath, base64String, 'base64');

            setDownloadLoading(false);
        } catch (error) {
            setDownloadAttachLoading(false);
            // console.error('Failed to save PDF:', error);
        }
    };

    const downloadInvoice = async () => {
        setDownloadLoading(true)
        const URL = `${INVOICE_DOWNLOAD}/${orderData?.orderInfoId}`;
        const data = await HTTP_GET_FILE(URL);
        if (data != null && data["status"] !== undefined) {
            if (data["status"] === "invalid") {
                toast.show({ description: "Oops! Something went wrong while downloading invoice." });
            } else if (data["status"] === "error") {
                toast.show({ description: "Oops! Something went wrong while downloading invoice." });
            }
            setDownloadLoading(false);

        } else {
            byteArrayToPdf(data?.invoicePdf, data?.invoiceFileName); // Convert and save the PDF
        }

    }


    const downloadAttachments = async () => {
        setDownloadAttachLoading(true);
        let tmp_list = [];

        if (orderData?.documents.length == 0) {
            toast.show({
                description: "No attchments to download...!! "
            });
            setDownloadAttachLoading(false);
            return;
        }

        orderData?.documents.forEach(async (file) => {
            const URL = `${DOWNLOAD_ATTACHMENTS}/${file?.fileId}`;
            const data = await HTTP_GET(URL);
            if (data != null && data["status"] !== undefined) {
                if (data["status"] === "invalid") {
                    toast.show({ description: "Oops! Something went wrong while downloading attachments." });
                } else if (data["status"] === "error") {
                    toast.show({ description: "Oops! Something went wrong while downloading attachments." });
                }
                setDownloadAttachLoading(false);

            } else {
                byteArrayToAttchment(data?.byteArrayFile, data?.fileName);
                tmp_list.push(file?.fileName);

                if (orderData?.documents.length == tmp_list.length) {
                    toast.show({
                        description: "Attachments download successfully..!!"
                    });
                    setDownloadAttachLoading(false);
                }
            }
        });
    }

    return (
        <SafeAreaView>
            <View style={styles.container}>
                <View style={styles.editProfileTitle}>
                    <View style={styles.button}><Back width={40} height={40} onPress={back} /></View>
                    <Text numberOfLines={1} style={[styles.title, {marginLeft: Platform.OS === 'ios' ? "20%" : "30%"}]}>Order Detail (#{orderData?.orderNo})</Text>
                </View>

                {/* <View style={{ borderWidth: 0.3, marginTop: rMS(10), borderColor: "#808B96" }}></View> */}


                {
                    isDataLoading && productList.length == 0 ?
                        <View style={{ marginTop: rMS(15) }}>
                            <View style={{ marginBottom: rMS(10) }}>
                                <Skeleton rounded={'md'} h={'40'} />
                            </View>

                            <View style={{ marginBottom: rMS(10) }}>
                                <Skeleton rounded={'md'} h={'40'} />
                            </View>

                            <View style={{ marginBottom: rMS(10) }}>
                                <Skeleton rounded={'md'} h={'20'} />
                            </View>

                            <View style={{ marginBottom: rMS(10) }}>
                                <Skeleton rounded={'md'} h={'20'} />
                            </View>

                            <View style={{ marginBottom: rMS(10) }}>
                                <Skeleton rounded={'md'} h={'40'} />
                            </View>

                        </View> :

                        <>
                            <View style={{ marginTop: rMS(10), height: Platform.OS === 'ios' ? hp("78%") : hp("83%") }}>
                                <ScrollView horizontal={false} showsVerticalScrollIndicator={false} contentContainerStyle={{ height: "auto" }}>
                                    <View>
                                        {
                                            productList.map(item => {
                                                return (
                                                    <View key={item?.subCategoryId} style={styles.subCategoryWrapper}>
                                                        <View style={styles.labelBgColor}>
                                                            <View style={{ flexDirection: "row", gap: rMS(10), alignItems: "center" }}>
                                                                <View style={{ paddingHorizontal: rMS(5) }}>
                                                                    <SubcatHeaderLogo />
                                                                </View>
                                                                <View style={{ paddingVertical: rMS(5) }}>
                                                                    <Text adjustsFontSizeToFit={true} w={wp("35%")} style={styles.lbl} numberOfLines={1}>{item?.subCategoryName}</Text>
                                                                </View>
                                                            </View>
                                                        </View>
                                                        <View style={styles.productWrapper}>
                                                            {item?.products.map((ele, index) => {
                                                                return (
                                                                    <View style={styles.productItemWrapper} key={[ele?.productId, "_", index].join()}>


                                                                        <View style={styles.productTitleWrapper}>
                                                                            <Text style={styles.productTitle} numberOfLines={1}>{ele?.productName}</Text>
                                                                        </View>

                                                                        <View style={styles.productPriceWrapper}>
                                                                            <View style={styles.qtyBtnWrapper}>
                                                                                <Text adjustsFontSizeToFit={true} style={styles.qtyInput}>{ele?.quantityInDozen}</Text>
                                                                                <Text adjustsFontSizeToFit={true} style={styles.unit}>Dozen</Text>
                                                                            </View>


                                                                            <Text adjustsFontSizeToFit={true} style={styles.productPrice}>₹ {ele?.totalProductPrice}</Text>



                                                                        </View>

                                                                    </View>
                                                                )
                                                            })}
                                                        </View>
                                                    </View>
                                                )
                                            })
                                        }
                                    </View>


                                    <View style={[styles.wrapper]}>
                                        <View style={{ flexDirection: "column" }}>

                                            <View>

                                                {/* Ready For Shipment */}
                                                <View style={{ flexDirection: "column" }}>
                                                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                                                        {
                                                            shippingData[0]?.currentStatus ?
                                                                <OrderStart /> :
                                                                <OrderInitiate />

                                                        }
                                                        <Text adjustsFontSizeToFit={true} style={styles.lblFont}>Ready For Shipment</Text>
                                                    </View>
                                                    <View style={{ paddingHorizontal: rMS(10) }}>
                                                        <View style={{
                                                            borderStyle: 'dashed',
                                                            borderLeftWidth: 1,
                                                            borderRadius: 1,
                                                            borderColor: shippingData[1]?.currentStatus ? "#B6974E" : "#D5D8DC",
                                                            height: hp("5%")
                                                        }}>

                                                        </View>
                                                    </View>

                                                </View>

                                                {/* In Transist */}
                                                <View style={{ flexDirection: "column" }}>
                                                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                                                        {
                                                            shippingData[1]?.currentStatus ?
                                                                <OrderStart /> :
                                                                <OrderInitiate />

                                                        }
                                                        <Text adjustsFontSizeToFit={true} style={styles.lblFont}>In Transist</Text>
                                                    </View>
                                                    <View style={{ paddingHorizontal: rMS(10) }}>
                                                        <View style={{
                                                            borderStyle: 'dashed',
                                                            borderLeftWidth: 1,
                                                            borderRadius: 1,
                                                            borderColor: shippingData[2]?.currentStatus ? "#B6974E" : "#D5D8DC",
                                                            height: hp("5%")
                                                        }}>

                                                        </View>
                                                    </View>

                                                </View>

                                                {/* Shipped */}
                                                <View style={{ flexDirection: "column" }}>
                                                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                                                        {
                                                            shippingData[2]?.currentStatus ?
                                                                <OrderStart /> :
                                                                <OrderInitiate />

                                                        }
                                                        <Text adjustsFontSizeToFit={true} style={styles.lblFont}>Shipped</Text>
                                                    </View>
                                                    {/* <View style={{ paddingHorizontal: rMS(10) }}>
                                                    <View style={{
                                                        borderStyle: 'dashed',
                                                        borderLeftWidth: 1,
                                                        borderRadius: 1,
                                                        borderColor: shippingData[3]?.currentStatus ? "#B6974E" : "#D5D8DC",
                                                        height: hp("5%")
                                                    }}>

                                                    </View>
                                                </View> */}

                                                </View>

                                                {/* Out For Delivery  */}
                                                {/* <View style={{ flexDirection: "column" }}>
                                                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                                                    {
                                                        shippingData[3]?.currentStatus ?
                                                            <OrderStart /> :
                                                            <OrderInitiate />

                                                    }
                                                    <Text adjustsFontSizeToFit={true} style={styles.lblFont}>Out For Delivery</Text>
                                                </View>
                                                <View style={{ paddingHorizontal: rMS(10) }}>
                                                    <View style={{
                                                        borderStyle: 'dashed',
                                                        borderLeftWidth: 1,
                                                        borderRadius: 1,
                                                        borderColor: shippingData[4]?.currentStatus ? "#B6974E" : "#D5D8DC",
                                                        height: hp("5%")
                                                    }}>

                                                    </View>
                                                </View>

                                            </View> */}

                                                {/* Delivered */}
                                                {/* {
                                                !shippingData[5]?.currentStatus &&
                                                <View style={{ flexDirection: "column" }}>
                                                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                                                        {
                                                            shippingData[4]?.currentStatus && !shippingData[5]?.currentStatus ?
                                                                <OrderComplete /> :
                                                                <OrderInitiate />

                                                        }
                                                        <Text adjustsFontSizeToFit={true} style={styles.lblFont}>Delivered</Text>
                                                    </View>
                                                </View>
                                            } */}


                                                {/* Failed Delivery Attempt */}
                                                {/* {
                                                shippingData[4]?.currentStatus && shippingData[5]?.currentStatus &&
                                                <View style={{ flexDirection: "column" }}>
                                                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>



                                                        <OrderFailed />


                                                        <Text adjustsFontSizeToFit={true} style={styles.lblFont}>Failed Delivery Attempt</Text>
                                                    </View>
                                                </View>
                                            } */}
                                            </View>

                                        </View>
                                    </View>

                                    <View style={[styles.wrapper]}>
                                        <View style={{ flexDirection: "row", alignItems: "center", gap: rMS(5), paddingBottom: rMS(5) }}>
                                            <BookUser color="#566573" size={18} />
                                            <Text adjustsFontSizeToFit={true} style={styles.addressLbl}>Billing Address</Text>
                                        </View>
                                        <Text adjustsFontSizeToFit={true} style={styles.lblFont}>{orderData?.billingAddress}</Text>
                                    </View>

                                    <View style={[styles.wrapper]}>
                                        <View style={{ flexDirection: "row", alignItems: "center", gap: rMS(5), paddingBottom: rMS(5) }}>
                                            <NotebookTabs color="#566573" size={18} />
                                            <Text adjustsFontSizeToFit={true} style={styles.addressLbl}>Shipping Address</Text>
                                        </View>
                                        <Text adjustsFontSizeToFit={true} style={styles.lblFont}>{orderData?.shippingAddress}</Text>
                                    </View>

                                    <View style={[styles.wrapper]}>
                                        <View style={{ flexDirection: "row", justifyContent: "space-between", paddingBottom: rMS(5) }}>
                                            <View style={{ flexDirection: "row", alignItems: "center", gap: rMS(5) }}>
                                                <ShoppingBag color="#566573" size={16} />
                                                <Text adjustsFontSizeToFit={true} style={styles.addressLbl}>Total</Text>
                                            </View>
                                            <Text adjustsFontSizeToFit={true} style={styles.priceVal}>₹ {(orderData?.totalBillAmount).toFixed(2)}</Text>
                                        </View>

                                        <View style={{ flexDirection: "row", justifyContent: "space-between", paddingBottom: rMS(5) }}>
                                            <View style={{ flexDirection: "row", alignItems: "center", gap: rMS(5) }}>
                                                <TicketPercent color="#566573" size={16} />
                                                <Text adjustsFontSizeToFit={true} style={styles.addressLbl}>Discount</Text>
                                            </View>
                                            <Text adjustsFontSizeToFit={true} style={styles.priceVal}>₹ {(orderData?.billDiscountAmount).toFixed(2)}</Text>
                                        </View>
                                        {
                                            (orderData?.couponDiscountCode != null && orderData?.couponDiscountCode != 0.0) &&
                                            <View style={{ flexDirection: "row", justifyContent: "space-between", paddingBottom: rMS(5) }}>
                                                <View style={{ flexDirection: "row", alignItems: "center", gap: rMS(5) }}>
                                                    <BadgePercent color="#566573" size={16} />
                                                    <Text adjustsFontSizeToFit={true} style={styles.addressLbl}>Coupon ({orderData?.couponDiscountCode})</Text>
                                                </View>
                                                <Text adjustsFontSizeToFit={true} style={styles.priceVal}>₹ {(orderData?.couponDiscountAmount).toFixed(2)}</Text>
                                            </View>
                                        }
                                        {
                                            (orderData?.customerDiscountAmount != null && orderData?.customerDiscountAmount != 0.0) &&
                                            <View style={{ flexDirection: "row", justifyContent: "space-between", paddingBottom: rMS(5) }}>
                                                <View style={{ flexDirection: "row", alignItems: "center", gap: rMS(5) }}>
                                                    <DiamondPercent color="#566573" size={16} />
                                                    <Text adjustsFontSizeToFit={true} style={styles.addressLbl}>Customer Discount </Text>
                                                </View>
                                                <Text adjustsFontSizeToFit={true} style={styles.priceVal}>₹ {(orderData?.customerDiscountAmount).toFixed(2)}</Text>
                                            </View>
                                        }

                                        <View style={{ flexDirection: "row", justifyContent: "space-between", paddingBottom: rMS(5) }}>
                                            <View style={{ flexDirection: "row", alignItems: "center", gap: rMS(5) }}>
                                                <Castle color="#566573" size={16} />
                                                <Text adjustsFontSizeToFit={true} style={styles.addressLbl}>GST ({orderData?.gstPercent}%)</Text>
                                            </View>
                                            <Text adjustsFontSizeToFit={true} style={styles.priceVal}>₹ {(orderData?.gstAmount).toFixed(2)}</Text>
                                        </View>

                                        <View style={{ flexDirection: "row", justifyContent: "space-between", paddingBottom: rMS(5) }}>
                                            <View style={{ flexDirection: "row", alignItems: "center", gap: rMS(5) }}>
                                                <ReceiptText color="#3498DB" size={16} />
                                                <Text adjustsFontSizeToFit={true} style={styles.grandTotalLbl}>Grand Total</Text>
                                            </View>
                                            <Text adjustsFontSizeToFit={true} style={styles.grandTotalLbl}>₹ {(orderData?.amount).toFixed(2)}</Text>
                                        </View>

                                        <View>
                                            <Button style={styles.cartBtn} onPress={() => downloadInvoice()}>
                                                <HStack space={3}>
                                                    <Text adjustsFontSizeToFit={true} style={styles.cart_lbl}>Download Invoice</Text>
                                                    {
                                                        downloadLoading &&
                                                        <Spinner color="#ffffff" />
                                                    }
                                                </HStack>
                                            </Button>


                                            <Button style={styles.cartBtn} onPress={() => downloadAttachments()}>
                                                <HStack space={3}>
                                                    <Text adjustsFontSizeToFit={true} style={styles.cart_lbl}>Download Attachments</Text>
                                                    {
                                                        downloadAttachLoading &&
                                                        <Spinner color="#ffffff" />
                                                    }
                                                </HStack>
                                            </Button>
                                        </View>
                                    </View>
                                    <View style={{ backgroundColor: "red", paddingHorizontal: rMS(10) }}>
                                    </View>


                                </ScrollView>
                            </View>
                        </>
                }

            </View>
        </SafeAreaView>
    )
}

export default OrderDetail

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: "5%",
        paddingVertical: "5%",
        position: "relative"
    },
    editProfileTitle: {
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
    },

    title: {
        color: "#272727",
        fontWeight: "700",
        fontSize: rMS(16),
        marginLeft: "30%",
        width: "50%"
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
    subCategoryWrapper: {
        borderRadius: 8,
        backgroundColor: "#FFFFFF",
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
        alignItems: "center",
        paddingVertical: rMS(5)
    },
    lbl: {
        fontSize: rMS(14),
        fontFamily: "Inter-Regular",
        color: "#FFFFFF",
        // padding: rMS(5)
        paddingHorizontal: rMS(5)
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
    productTitleWrapper: {
        display: "flex",
        flexDirection: "column",
        gap: 5,
        width: wp("30%")
    },

    productTitle: {
        fontSize: rMS(14),
        color: "rgb(23, 32, 42)",
        fontFamily: "Inter-Regular",
    },

    productPriceWrapper: {
        display: "flex",
        flexDirection: "row",
        justifyContent: "flex-end",
        alignItems: "center",
        // // marginLeft: "3%",
        gap: 20,
        width: wp("58%"),
        paddingHorizontal: rMS(10)
    },

    productPrice: {
        fontSize: rMS(13),
        fontWeight: "700",
        textAlign: "right",
        width: "40%",
        color: "rgb(86, 101, 115)"
        // textDecorationLine: "underline"

    },
    qtyInput: {
        fontSize: 11,
        fontWeight: "700",
        textAlign: "center",
        fontFamily: "Inter-Regular",
        color: "rgb(86, 101, 115)"
    },
    unit: {
        color: "#272727",
        fontSize: 14,
        opacity: 0.5,
        marginLeft: 5,
        fontWeight: "700",
        fontFamily: "Inter-Regular"
    },
    qtyBtnWrapper: {
        display: "flex",
        flexDirection: "row",
        justifyContent: "flex-end",
        alignItems: "center"
    },
    wrapper: {
        backgroundColor: "#ffffff",
        borderRadius: 6,
        padding: rMS(10),
        marginBottom: rMS(10)
    },
    addressLbl: {
        fontFamily: "Inter-Regular",
        fontSize: rMS(16),
        fontWeight: "700",
        color: "#566573"
    },
    priceVal: {
        fontFamily: "Inter-Regular",
        fontSize: rMS(14),
        color: "#566573"
    },
    grandTotalLbl: {
        fontFamily: "Inter-Regular",
        fontSize: rMS(16),
        fontWeight: "700",
        color: "#3498DB"
    },
    lblFont: {
        fontFamily: "Inter-Regular",
        fontSize: rMS(14),
        color: "rgb(86, 101, 115)"
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

})