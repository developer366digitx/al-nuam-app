import { Button, HStack, Input, ScrollView, Spinner, Text, View, useToast } from "native-base";
import React, { useEffect, useRef, useState } from "react";
import { Dimensions, StyleSheet, Image, SafeAreaView, Pressable, Platform } from "react-native";
import Back from "../../../assets/back.svg";
import { useIsFocused } from "@react-navigation/native";
import { rMS } from "../../utils/responsive";
import LottieView from "lottie-react-native";
import { getCustomerId } from "../../utils/helper";
import { HTTP_POST } from "../../utils/http-service";
import { ADD_TO_CART, GET_GST, IMAGE_PATH } from "../../utils/constant";
import DefaultImage from "../../../assets/images/default-product-image.png";
import SubcatHeaderLogo from "../../../assets/subcatLogo.svg";
import { Castle, ReceiptText, ShoppingBag, TicketPercent, ShoppingCart } from "lucide-react-native";

import ArrowDown from "../../../assets/arrow-down - cart.svg";

const win = Dimensions.get('window');

const BulkSummary = ({ route, navigation }) => {

    const [productList, setProductList] = useState(route.params.productList);
    const [subCatList, setSubCateList] = useState(route.params.subCategoryList);
    const [discountApply, setDiscountApply] = useState(route.params.discount);
    const [new_prod_list, setNewProdList] = useState([]);
    const [total_price, setTotalPrice] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [discountInfo, setDiscountInfo] = useState(null);
    const [isFireworkShow, setIsFireworkShow] = useState(true);
    const [nextAvailableDiscount, setNextAvailableDiscount] = useState(route?.params ? route?.params?.nextAvailableDiscount : null);
    const [avgGST, setAvgGST] = useState(0);
    const [gstAmount, setGstAmount] = useState(0);

    const confetteRef = React.useRef(null);

    const DEFAULT_PRODUCT_IMAGE = Image.resolveAssetSource(DefaultImage).uri;

    const toast = useToast();
    const id = "congrast";

    const isScreenFocused = useIsFocused();

    useEffect(() => {
        if (isScreenFocused) {
            groupProductsBySubCategory();
            setIsFireworkShow(true);

            if (discountApply) {
                setIsFireworkShow(true);
            }


            if (confetteRef.current) {
                confetteRef.current.play(0);
            }
            setTimeout(() => {
                setIsFireworkShow(false);
            }, 4000);
        }
    }, [isScreenFocused]);

    useEffect(() => {
        calculateDiscountApply();
    }, [total_price]);

    useEffect(() => {
        if (avgGST) {
            calculateTotalPrice();
        }
    }, [avgGST])


    useEffect(() => {
        if (discountInfo && productList.length != 0) {
            getAverageGST([...productList]?.map(ele => ele?.subCategoryId))
        }
    }, [discountInfo])

    const getAverageGST = async (subCategoryList) => {
        const body = {
            subCategoryIds: subCategoryList
        };

        const URL = `${GET_GST}`;
        const data = await HTTP_POST(URL, body);
        if (data != null && data["status"] !== undefined) {
            if (data["status"] === "invalid") {
                toast.show({ description: "Oops! It seems something went wrong while getting Cart data" });
            } else if (data["status"] === "error") {
                toast.show({ description: "Something went wrong!!" });
            }
        } else {
            if (data != null) {
                setAvgGST(data?.avgGst);
                calculateGSTAmount(data?.avgGst);
            } else {
                setAvgGST(0);
            }

        }


    }

    const groupProductsBySubCategory = async () => {
        let tmp_prod_list = [];
        subCatList.forEach(ele => {
            productList.forEach(item => {
                if (ele.dropDownId === item?.subCategoryId) {
                    item["subCategoryName"] = ele?.dropDrownValue;
                    item["cartonSize"] = ele?.cartonSize ? ele?.cartonSize : 0;
                }
            });
        });

        productList.map(ele => {
            if (tmp_prod_list.length == 0) {
                const obj = {
                    subCategoryId: ele?.subCategoryId,
                    subCategoryName: ele?.subCategoryName,
                    cartonSize: ele?.cartonSize,
                    products: [ele]
                }

                tmp_prod_list.push(obj);
            } else {
                // if(tmp_prod_list.some(item => item?.subCategoryId == ele?.subCategoryId)){

                // }
                const index = tmp_prod_list.findIndex(item => item?.subCategoryId === ele?.subCategoryId);
                if (index != -1) {
                    tmp_prod_list[index].products.push(ele);
                } else {
                    const obj = {
                        subCategoryId: ele?.subCategoryId,
                        subCategoryName: ele?.subCategoryName,
                        cartonSize: ele?.cartonSize ? ele?.cartonSize : 0,
                        products: [ele]
                    }

                    tmp_prod_list.push(obj);
                }

            }

            // Calculate current carton size
            tmp_prod_list = tmp_prod_list.map(subcategory => {
                let cartonSize = subcategory?.cartonSize / 12;
                currentCartonSize = subcategory.products.reduce((sum, product) => sum + (+product?.unit), 0) / cartonSize;
                subcategory['currentCartonSize'] = currentCartonSize;
                subcategory['isExpand'] = true;
                return subcategory;
            });

            setNewProdList(tmp_prod_list);
        });
        calculateTotalPrice();
    }
    const calculateTotalPrice = async () => {
        let tot_price = 0;
        productList.forEach(ele => {
            tot_price = tot_price + (+parseFloat((ele?.isDiscountActive == "Y" ? +parseFloat(ele?.discountedPrice).toFixed(2) : +parseFloat(ele?.price).toFixed(2)) * ele?.unit * 12).toFixed(2));
            setTotalPrice(+(tot_price).toFixed(2))
        });

    }

    const calculateGSTAmount = (gst) => {
        if (discountInfo) {
            setGstAmount((total_price - discountInfo?.discountAmount) * (gst / 100));
        } else {
            setGstAmount(total_price * (gst / 100));
        }

    }

    const back = () => {
        navigation.navigate("BulkOrder", {
            "productList": productList
        });
    }

    const calculateDiscountApply = async () => {
        let discount = {};
        if (discountApply !== null) {
            if (discountApply?.discountCategory == "Percentage") {
                if (discountApply?.maxDiscountAmount && discountApply?.maxDiscountAmount > 0) {
                    discount["finalAmount"] = +(total_price - discountApply?.maxDiscountAmount).toFixed(2);
                    discount["discountAmount"] = discountApply?.maxDiscountAmount;
                } else {
                    discount["finalAmount"] = +(total_price - (total_price * (discountApply?.discountInPer / 100))).toFixed(2);
                    discount["discountAmount"] = +(total_price * (discountApply?.discountInPer / 100)).toFixed(2);
                }
            } else if (discountApply?.discountCategory == "Flat") {

                discount["finalAmount"] = parseFloat(total_price - (+discountApply?.flatDiscountAmount)).toFixed(2);
                discount["discountAmount"] = +((+discountApply?.flatDiscountAmount)).toFixed(2);
            }
            // if (!toast.isActive(id)) {
            //     toast.show({
            //         id,
            //         title: `Congratulations! You've unlocked a discount of ₹${discount?.discountAmount} on your purchase. Happy shopping!`
            //     }, 3000);
            // }

        } else {
            discount["finalAmount"] = (+total_price).toFixed(2);
            discount["discountAmount"] = 0;
        }

        setDiscountInfo(discount);

        const interval = setInterval(() => {
            if (discount.discountAmount != 0) {
                if (!toast.isActive(id)) {
                    toast.show({
                        id,
                        title: `🎉 Congratulations! You've unlocked a discount of ₹${discount?.discountAmount} on your purchase. 🎁 Happy shopping!`
                    }, 3000);
                }

                clearInterval(interval);
            }
        }, 1000);



        // setTimeout(() => {
        //     toast.closeAll();
        // }, 3000);
        // await getAverageGST([...productList]?.map(ele => ele?.subCategoryId))
        return discount;
    }

    const addToCart = async () => {

        let prod_list = [];
        new_prod_list.forEach(subCategory => {
            subCategory.products.forEach(product => {
                prod_list.push({
                    productId: product.productId,
                    quantity: (+product.unit)
                })
            });


        });

        setIsLoading(true);
        const Obj = {
            customerId: await getCustomerId(),
            subcategories: [{ "products": prod_list }],
            // billAmountDiscountCode: discountApply?.couponDiscountCode,
            // totalBillAmountAfterDiscount: discountInfo?.finalAmount
            totalBillAmount: total_price
        }

        // return;

        const URL = `${ADD_TO_CART}`;
        const data = await HTTP_POST(URL, Obj);

        if (data != null && data["status"] !== undefined) {
            if (data["status"] === "invalid") {
                toast.show({ description: "Uh-oh! 🚫 Add to cart failed. Please try again. 🛒" });
            } else if (data["status"] === "error") {
                toast.show({ description: "Something went wrong!!" });
            }
            setIsLoading(false);
        } else {
            setIsLoading(false);
            toast.show({
                description: "🎉 Awesome! Your products have been added to the cart successfully. 🛒",
                duration: 3000
            });

            navigation.navigate("Cart");
        }




        // setTimeout(() => {
        //     navigation.navigate("Cart", {
        //         productList: new_prod_list,
        //         grandTotal: discountApply == null ? total_price : total_price - discountApply?.maxDiscountAmount
        //     });
        //     setIsLoading(false);

        // }, 3000);
    }


    const expandItem = (item) => {
        item.isExpand = !item.isExpand;
        setNewProdList(prevItem =>
            prevItem.map(ele => ele?.subCategoryId == item?.subCategoryId ? item : ele)
        );

    }

    return (
        <SafeAreaView>
            <View style={[styles.container, Platform.OS === "ios" ? { paddingBottom: "0%" } : { paddingTop: "8%" }]}>
                <View style={styles.bulkTitleWrapper}>
                    <View style={styles.button}><Back width={40} height={40} onPress={() => back()} /></View>
                    <Text adjustsFontSizeToFit={true} style={styles.title}>Bulk Order Summary</Text>
                </View>

                <View style={styles.warnningView}>
                    <Text style={{ fontSize: rMS(10) }}>Products not added to the cart will be removed from the summary. Please add them to save for future reference.</Text>
                </View>

                <View style={{ marginTop: rMS(5), paddingBottom: rMS(20), height: Platform.OS === "ios" ? win.height - rMS(200) : win.height - rMS(150) }}>
                    <ScrollView horizontal="false">
                        <View style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                            {
                                new_prod_list.map(item => {
                                    return (
                                        <Pressable key={item?.subCategoryId} onPress={() => expandItem(item)}>
                                            <View style={styles.subCategoryWrapper}>
                                                <View style={styles.labelBgColor}>
                                                    <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", width: "100%", paddingHorizontal: rMS(10) }}>
                                                        <View style={{ flexDirection: "row", width: "50%" }}>
                                                            <View style={{ paddingHorizontal: rMS(5) }}>
                                                                <SubcatHeaderLogo />
                                                            </View>
                                                            <Text style={[styles.lbl, { width: "80%" }]} numberOfLines={1}>{item?.subCategoryName}</Text>
                                                        </View>
                                                        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: "2%", gap: 10 }}>
                                                            {/* <Text adjustsFontSizeToFit={true} style={styles.lbl} numberOfLines={1}>{item?.subCategoryName}</Text> */}
                                                            <Text style={styles.lbl}>1 Carton = {item?.cartonSize / 12} Dozen</Text>
                                                            {/* <Text adjustsFontSizeToFit={true} style={{ fontFamily: "Inter-Regular", fontSize: rMS(14), color: "#FFFFFF" }}>Your Carton Size: {item?.currentCartonSize}</Text> */}
                                                            {
                                                                item.isExpand ?
                                                                    <ArrowDown /> :
                                                                    <View style={{ transform: [{ rotate: '180deg' }] }}>
                                                                        <ArrowDown />
                                                                    </View>

                                                            }
                                                        </View>
                                                    </View>
                                                </View>
                                                {
                                                    item?.isExpand &&
                                                    <View style={styles.productWrapper}>
                                                        {item?.products.map((ele, index) => {
                                                            return (
                                                                <View style={styles.productItemWrapper} key={[ele?.productId, "_", index].join()}>
                                                                    <View style={styles.productImageWrapper}>
                                                                        <Image style={styles.productImage} alt="product" source={{ uri: ele?.productImages.length ? `${IMAGE_PATH}${ele?.productImages[0].documentPath}` : DEFAULT_PRODUCT_IMAGE }} />
                                                                    </View>

                                                                    <View style={styles.productTitleWrapper}>
                                                                        <Text style={styles.productTitle} numberOfLines={1}>{ele?.productName}</Text>
                                                                        {/* <View style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 5 }}><Star /><Text adjustsFontSizeToFit={true} style={styles.productRating}>{item?.rating}</Text></View> */}
                                                                    </View>

                                                                    <View style={styles.productPriceWrapper}>
                                                                        {
                                                                            ele?.isDiscountActive == "Y" ?
                                                                                <Text adjustsFontSizeToFit={true} style={styles.productPrice}>₹ {(+parseFloat(ele?.discountedPrice).toFixed(2) * ele?.unit * 12).toFixed(2)}</Text> :
                                                                                <Text adjustsFontSizeToFit={true} style={styles.productPrice}>₹ {(+parseFloat(ele?.price).toFixed(2) * ele.unit * 12).toFixed(2)}</Text>

                                                                        }
                                                                        <View style={styles.qtyBtnWrapper}>
                                                                            <Text adjustsFontSizeToFit={true} style={styles.qtyInput}>{ele?.unit}</Text>
                                                                            <Text adjustsFontSizeToFit={true} style={styles.unit}>Dozen</Text>
                                                                        </View>
                                                                    </View>

                                                                </View>
                                                            )
                                                        })}
                                                    </View>
                                                }
                                            </View>
                                        </Pressable>
                                    )
                                })
                            }

                        </View>

                    </ScrollView>
                    <View style={[styles.priceContainer, Platform.OS === "ios" ? { marginBottom: "5%" } : null]}>
                        <View style={styles.priceWrapper}>

                            <View style={styles.calc_item}>
                                <View style={{ flexDirection: "row", alignItems: "center" }}>
                                    <ShoppingCart color="#566573" size={16} />
                                    <Text adjustsFontSizeToFit={true} style={styles.tot_lbl}>Total Carton Size:</Text>
                                </View>
                                <Text adjustsFontSizeToFit={true} style={styles.val}>{new_prod_list.reduce((count, acc) => {
                                    return count + acc.currentCartonSize
                                }, 0)}</Text>
                            </View>

                            <View style={styles.calc_item}>
                                <View style={{ flexDirection: "row", alignItems: "center" }}>
                                    <ShoppingBag color="#566573" size={16} />
                                    <Text adjustsFontSizeToFit={true} style={styles.tot_lbl}>Total:</Text>
                                </View>
                                <Text adjustsFontSizeToFit={true} style={styles.val}>₹ {(total_price).toFixed(2)}</Text>
                            </View>

                            <View style={styles.calc_item}>
                                <View style={{ flexDirection: "row", alignItems: "center" }}>
                                    <TicketPercent color="#566573" size={16} />
                                    <Text adjustsFontSizeToFit={true} style={styles.tot_lbl}>Discount  {
                                        discountApply != null && <Text adjustsFontSizeToFit={true}>({discountApply?.couponDiscountCode})</Text>
                                    }:</Text>
                                </View>

                                {
                                    discountApply != null ?
                                        <Text adjustsFontSizeToFit={true} style={styles.val}>- ₹ {(discountInfo?.discountAmount)?.toFixed(2)}</Text> :
                                        <Text adjustsFontSizeToFit={true} style={styles.val}>₹ 0</Text>

                                }
                            </View>
                            <View style={styles.calc_item}>
                                <View style={{ flexDirection: "row", alignItems: "center" }}>
                                    <Castle color="#566573" size={16} />
                                    <Text adjustsFontSizeToFit={true} style={styles.tot_lbl}>GST ({avgGST}%):</Text>
                                </View>
                                <Text adjustsFontSizeToFit={true} style={styles.val}>+ ₹ {parseFloat(gstAmount).toFixed(2)}</Text>
                            </View>

                            <View style={styles.calc_item}>
                                <View style={{ flexDirection: "row", alignItems: "center" }}>
                                    <ReceiptText color="#566573" size={16} />
                                    <Text adjustsFontSizeToFit={true} style={styles.tot_lbl}>Grand Total  :</Text>
                                </View>
                                <Text adjustsFontSizeToFit={true} style={styles.val}>₹ {parseFloat(+discountInfo?.finalAmount + gstAmount).toFixed(2)}</Text>
                            </View>

                            {
                                nextAvailableDiscount != null &&
                                <Text adjustsFontSizeToFit={true} style={{ fontFamily: "Inter-Regular", fontSize: rMS(12), paddingHorizontal: rMS(5), paddingVertical: rMS(10), color: "#3498DB", fontWeight: "700" }}>{nextAvailableDiscount?.discountMessage}</Text>
                            }


                            <View style={{ marginTop: "5%" }}>

                                <Button style={styles.cartBtn} onPress={() => addToCart()}>
                                    <HStack space={3}>
                                        <Text adjustsFontSizeToFit={true} style={styles.cart_lbl}>Add to Cart</Text>
                                        {
                                            isLoading &&
                                            <Spinner color="#ffffff" />
                                        }
                                    </HStack>
                                </Button>
                            </View>
                        </View>




                    </View>




                    {
                        discountApply !== null && isFireworkShow &&
                        <LottieView
                            source={require("../../../assets/confette.json")}
                            loop={false}
                            ref={confetteRef}
                            style={styles.lottie}
                        />
                    }
                </View>
            </View>
        </SafeAreaView>
    )
}


const styles = StyleSheet.create({
    container: {
        paddingHorizontal: "3%",
        // paddingVertical: "5%",
        position: "relative",
        // backgroundColor: "#FFFFFF"
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
        marginLeft: "22%",
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
        // borderWidth: 1,
        borderRadius: 10,
        backgroundColor: 'white',
        height: "100",
        marginBottom: rMS(10),
        borderColor: "#566573",

    },
    labelBgColor: {
        backgroundColor: "#B6974E",
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
        paddingVertical: rMS(10),
        flexDirection: "row"
    },
    lbl: {
        fontSize: rMS(14),
        fontFamily: "Inter-Regular",
        color: "#FFFFFF",
        paddingVertical: rMS(5)
    },
    productWrapper: {

    },
    productItemWrapper: {
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        marginVertical: 5,
        paddingHorizontal: rMS(5),
        width: "100%"
    },
    productImage: {
        width: 60,
        height: 60,
        borderRadius: 100
    },
    productImageWrapper: {
        width: "20%"
    },
    productTitleWrapper: {
        display: "flex",
        flexDirection: "column",
        marginLeft: 10,
        gap: 5,
        width: "50%"
    },
    productPriceWrapper: {
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        // marginLeft: "3%",
        gap: 5,
        width: "25%"
    },

    productPrice: {
        fontSize: rMS(13),
        fontWeight: "700",
        textAlign: "right",
        // textDecorationLine: "underline"

    },

    productTitle: {
        fontSize: rMS(15),
        color: "#272727",
        fontFamily: "Inter-Regular"
    },
    qtyBtnWrapper: {
        display: "flex",
        flexDirection: "row",
        justifyContent: "flex-end",
        alignItems: "center"
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
        alignItems: "center"
    },
    priceWrapper: {
        marginTop: rMS(5)
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
        // borderRadius: 100,
        paddingVertical: 12,
        paddingHorizontal: 48,
        display: 'flex',
        alignItems: 'center',

        fontSize: 16,
        fontFamily: "Inter-Regular"
    },

    cart_lbl: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 3,
        flexDirection: "row",
        fontWeight: "700",
        color: '#FFFFFF',
        fontFamily: "Inter-Regular"
    },
    lottie: {
        position: "absolute",
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        // zIndex: 1000,
        pointerEvents: "none",
    },

    priceContainer: {
        borderRadius: 10,
        backgroundColor: 'white',
        paddingVertical: rMS(10),
        paddingHorizontal: rMS(5)
        // paddingTop: rMS(10)/
    },
    warnningView: {
        backgroundColor: "#fff3cd",
        paddingHorizontal: rMS(5),
        paddingVertical: rMS(5)
    },
})
export default BulkSummary;