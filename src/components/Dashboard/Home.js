import React, { useEffect, useRef } from "react";
import { useState } from "react";
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import { Image, StyleSheet, View, Text, useWindowDimensions, StatusBar, Dimensions, Pressable, SafeAreaView } from "react-native";

// import HeaderLogo from "../../../assets/headerLogo.png";
import HeaderLogo from "../../../assets/headerLogo.svg";
import Bell from "../../../assets/icons/bell.svg"
import { FlatList, Heading, HStack, Input, ScrollView, Skeleton, Spinner, useToast } from "native-base"
import Search from "../../../assets/icons/search.svg";
import { rMS, rS, rVS } from "../../utils/responsive";
import { GET_BANNER_DATA, GET_DROPDOWN_DATA, GET_PRODUCT_LIST, GET_PRODUCTS_BY_BRAND_ID, GET_PRODUCTS_BY_ID, IMAGE_PATH, NOTIFICATION } from "../../utils/constant";
import { HTTP_GET, HTTP_POST } from "../../utils/http-service";
import { getCache, getCustomerId, setCache } from "../../utils/helper";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import DefaultImage from "../../../assets/images/default-product-image.png";
import NoImage from "../../../assets/images/No-Image-Placeholder.png";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SliderBox } from "react-native-image-slider-box";
import { useIsFocused } from "@react-navigation/native";
import FastImage from "react-native-fast-image";

const win = Dimensions.get('window');

const Home = ({ navigation }) => {

    const videoRef = useRef(null);
    const [categoryList, setCategoryList] = useState([])
    const [isLoading, setIsLoading] = useState(true);
    const [bannerList, setBannerList] = useState([{}]);
    const [dropDownData, setDropDownData] = useState(null);
    const [brandList, setBrandList] = useState([]);
    const [tabRoutes, setTabRoutes] = useState([]);
    const [brandProductList, setBrandProductList] = useState([]);
    const [activeProductList, setActiveProductList] = useState([]);
    const [activeProductList2, setActiveProductList2] = useState([]);
    const [activeProductList3, setActiveProductList3] = useState([]);

    const [isBannerLoading, setIsBannerLoading] = useState(false);
    const [isCategoryLoading, setIsCategoryLoading] = useState(true);
    const [isBrandProductsLoading, setIsBrandProductsLoading] = useState(true);
    const [isAllProductsLoading, setIsAllProductLoading] = useState(true);
    const [isAllProductsLoading2, setIsAllProductLoading2] = useState(true);
    const [isAllProductsLoading3, setIsAllProductLoading3] = useState(true);
    const [notificationList, setNotificationList] = useState([]);

    const [currentPageLabel1, setCurrentPageLabel1] = useState(0);
    const [currentPageLabel2, setCurrentPageLabel2] = useState(0);
    const [currentPageLabel3, setCurrentPageLabel3] = useState(0);

    const [label1, setLabel1] = useState("");
    const [label2, setLabel2] = useState("");
    const [label3, setLabel3] = useState("");


    const DEFAULT_PRODUCT_IMAGE = Image.resolveAssetSource(DefaultImage).uri;
    // const HEADER_LOGO_IMAGE = Image.resolveAssetSource(HeaderLogo).uri;
    const NO_IMAGE = Image.resolveAssetSource(NoImage).uri;

    const bannerFlatListRef = useRef(null);
    const scrollViewRef = useRef(null);

    const toast = useToast();

    const isScreenFocused = useIsFocused();

    useEffect(() => {
        const timer = setInterval(() => {
            getAllNotification();
        }, 5000);

        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        getBannerList();
        // getCategoryList();
        getStaticDropDownData();
        // let timer = setInterval(() => {
        //     getAllNotification();
        // }, 5000);

        setTimeout(() => {
            setIsLoading(false);
        }, 3000);

        // return () => {
        // clearInterval(timer);
        // }
    }, []);


    useEffect(() => {
        if (dropDownData != null) {
            getProductListForLabel1(currentPageLabel1);
            getProductListForLabel2(currentPageLabel2);
            getProductListForLabel3(currentPageLabel3);
        }
    }, [dropDownData]);

    const [index, setIndex] = React.useState(0);
    const [routes] = React.useState([
        { key: 'first', title: 'Al Nuaim' },
        { key: 'second', title: 'Eftina' },
    ]);

    useEffect(() => {
        if (index != -1 && brandList.length) {
            getBrandWiseProductList(brandList[index].dropDownId);
        }
    }, [index, brandList]);

    const layout = useWindowDimensions();

    const getAllNotification = async () => {
        const user = await AsyncStorage.getItem("user");
        const URL = `${NOTIFICATION}/${JSON.parse(user).customerId.customerId}`;
        const data = await HTTP_GET(URL);
        if (data != null && data["status"] !== undefined) {
            if (data["status"] === "invalid") {
                toast.show({ description: "Oops! Something went wrong while fetching your details." });
            } else if (data["status"] === "error") {
                toast.show({ description: "Oops! Something went wrong while fetching your details. " });
            }
        } else {
            if (data != null) {
                setNotificationList((prevList) => {
                    return JSON.stringify(prevList) !== JSON.stringify(data) ? data : prevList;
                });
            } else {
                setNotificationList((prevList) => (prevList.length > 0 ? [] : prevList));
            }
        }

    }

    const getBannerList = async () => {
        const bannerStorage = await AsyncStorage.getItem('HomeBanner');
        if (bannerStorage == null) {
            setIsBannerLoading(true);
            await getCustomerId();
            const URL = `${GET_BANNER_DATA}`;
            const data = await HTTP_GET(URL);

            if (data != null && data["status"] !== undefined) {
                if (data["status"] === "invalid") {
                    toast.show({ description: "Error..!!" });
                } else if (data["status"] === "error") {
                    toast.show({ description: "Something went wrong!!" });
                }
                setIsBannerLoading(false);
            } else {
                let list = data.map(item => {
                    if (item?.fileType !== "video") {
                        return item
                    }
                }).filter(ele => ele != undefined);
                setBannerList(list);
                await AsyncStorage.setItem('HomeBanner', JSON.stringify(list));
                setIsBannerLoading(false);
            }
        } else {
            setBannerList(JSON.parse(bannerStorage));
            setIsLoading(false)
        }

    }


    const getCategoryList = async () => {
        setIsCategoryLoading(true);

        const URL = `${GET_DROPDOWN_DATA}`;
        const data = await HTTP_POST(URL, {});

        if (data != null && data["status"] !== undefined) {
            if (data["status"] === "invalid") {
                toast.show({ description: "Error..!!" });
            } else if (data["status"] === "error") {
                toast.show({ description: "Something went wrong!!" });
            }
            setIsCategoryLoading(false);

        } else {
            setDropDownData(data);
            setCategoryList([...data['Category']]);
            setIsCategoryLoading(false);

        }
    }

    const getStaticDropDownData = async () => {
        const dropdownStorage = await AsyncStorage.getItem("DropDownStorage");
        if (dropdownStorage == null) {
            setIsBrandProductsLoading(true);
            setIsCategoryLoading(true);

            const URL = `${GET_DROPDOWN_DATA}`;
            const data = await HTTP_POST(URL, {});
            if (data != null && data["status"] !== undefined) {
                if (data["status"] === "invalid") {
                    toast.show({ description: "Error..!!" });
                } else if (data["status"] === "error") {

                }
            } else {
                await AsyncStorage.setItem("shippingData", JSON.stringify(data["Shipping Status"]));
                if (data != null && data["Brand"].length) {
                    setBrandList([...data["Brand"]]);
                    getBrandWiseProductList(data["Brand"][0]["dropDownId"])

                    let brands = data["Brand"].map(item => {
                        return {
                            key: `brand_${item?.dropDownId}`, title: item?.dropDrownValue
                        }
                    });
                    setTabRoutes(brands);
                }

                if (data != null) {
                    await AsyncStorage.setItem("DropDownStorage", JSON.stringify(data));
                    setDropDownData(data);
                    setCategoryList([...data['Category']]);
                    setIsCategoryLoading(false);
                }
            }
        } else {
            let cachedValue = JSON.parse(dropdownStorage);
            setDropDownData(cachedValue);
            setBrandList([...cachedValue["Brand"]]);
            setCategoryList([...cachedValue['Category']]);
            setIsCategoryLoading(false);
        }
    }


    const getBrandWiseProductList = async (brandId) => {
        // const brandProductStorage = await AsyncStorage.getItem("BrandProductStorage");
        // if (brandProductStorage === null) {
        setIsBrandProductsLoading(true);
        setBrandProductList(() => []);
        let body = {
            brandId: brandId
        }
        const URL = `${GET_PRODUCTS_BY_BRAND_ID}?id=${body.brandId}`;
        const data = await HTTP_GET(URL);

        if (data != null && data["status"] !== undefined) {
            if (data["status"] === "invalid") {
                toast.show({ description: "Error..!!" });
            } else if (data["status"] === "error") {
                toast.show({ description: "Something went wrong!!" });
            }
            setIsBrandProductsLoading(false);

        } else {
            if (data != null && data.length != 0) {

                let formattedProductList = data.map((item) => {
                    let obj = {
                        productId: item?.productInfoId,
                        productName: item?.productName,
                        productImages: item?.images,
                        rating: item?.rating,
                        price: +parseFloat(item?.price).toFixed(2),
                        unit: "",
                        subCategoryId: item?.subCategory,
                        isDiscountActive: item?.isDiscountActive,
                        discountedPrice: item?.discountedPrice ? +parseFloat(item?.discountedPrice).toFixed(2) : 0,
                        brandId: item?.brandId
                    };
                    return obj;
                });
                setBrandProductList(() => formattedProductList);
                await AsyncStorage.setItem("BrandProductStorage", JSON.stringify(formattedProductList));

            }
            setIsBrandProductsLoading(false);
            setIsLoading(false);

        }
        // } else {
        //     setBrandProductList(JSON.parse(brandProductStorage))
        //     setIsLoading(false);
        // }
    }


    const getProductListForLabel1 = async (pageNumber) => {
        const activeList1Storage = await AsyncStorage.getItem("ActiveList1Storage");
        const body = {
            labelIds: dropDownData["Label"].map(label => {
                if (label["dropDownId"] === 30115) {
                    setLabel1(label["dropDrownValue"]);
                    return label["dropDownId"]
                }
            }).filter(ele => ele != undefined)
        }
        if (activeList1Storage == null) {
            setIsAllProductLoading(true);
            const URL = `${GET_PRODUCTS_BY_ID}?id=${body.labelIds.join(",")}`;

            const data = await HTTP_GET(URL);
            if (data != null && data["status"] !== undefined) {
                if (data["status"] === "invalid") {
                    toast.show({ description: "Error..!!" });
                } else if (data["status"] === "error") {
                    toast.show({ description: "Something went wrong!!" });
                }
                setIsAllProductLoading(false);
            } else {
                if (data != null && data.length != 0) {
                    let formattedProductList = data.map((item) => {
                        let obj = {
                            productId: item?.productInfoId,
                            productName: item?.productName,
                            productImages: item?.images,
                            rating: item?.rating,
                            price: +parseFloat(item?.price).toFixed(2),
                            unit: "",
                            subCategoryId: item?.subCategory,
                            isDiscountActive: item?.isDiscountActive,
                            discountedPrice: item?.discountedPrice ? +parseFloat(item?.discountedPrice).toFixed(2) : 0,
                            brandId: item?.brandId,
                            totalCount: item?.totalCount
                        };
                        return obj;
                    });
                    setActiveProductList((prevList) => {
                        const combinedList = [...prevList.flat(), ...formattedProductList];
                        return chunkArray(combinedList, 4);
                    });
                    await AsyncStorage.setItem("ActiveList1Storage", JSON.stringify(chunkArray(formattedProductList, 4)));
                }
                setIsAllProductLoading(false);

            }

        } else {
            setActiveProductList(JSON.parse(activeList1Storage));
        }

    }

    const getProductListForLabel2 = async (pageNumber) => {
        const activeList2Storage = await AsyncStorage.getItem("ActiveList2Storage");
        const body = {
            labelIds: dropDownData["Label"].map(label => {
                if (label["dropDownId"] === 30101) {
                    setLabel2(label["dropDrownValue"]);
                    return label["dropDownId"]
                }
            }).filter(ele => ele != undefined)
        }

        if (activeList2Storage == null) {
            setIsAllProductLoading2(true);
            const URL = `${GET_PRODUCTS_BY_ID}?id=${body.labelIds.join(",")}`;


            const data = await HTTP_GET(URL);

            if (data != null && data["status"] !== undefined) {
                if (data["status"] === "invalid") {
                    toast.show({ description: "Error..!!" });
                } else if (data["status"] === "error") {
                    toast.show({ description: "Something went wrong!!" });
                }
                setIsAllProductLoading2(false);
            } else {
                if (data != null && data.length != 0) {
                    let formattedProductList = data.map((item) => {
                        let obj = {
                            productId: item?.productInfoId,
                            productName: item?.productName,
                            productImages: item?.images,
                            rating: item?.rating,
                            price: +parseFloat(item?.price).toFixed(2),
                            unit: "",
                            subCategoryId: item?.subCategory,
                            isDiscountActive: item?.isDiscountActive,
                            discountedPrice: item?.discountedPrice ? +parseFloat(item?.discountedPrice).toFixed(2) : 0,
                            brandId: item?.brandId,
                            totalCount: item?.totalCount
                        };
                        return obj;
                    });
                    setActiveProductList2((prevList) => {
                        const combinedList = [...prevList.flat(), ...formattedProductList];
                        return chunkArray(combinedList, 4);
                    });
                    await AsyncStorage.setItem("ActiveList2Storage", JSON.stringify(chunkArray(formattedProductList, 4)));
                }
                setIsAllProductLoading2(false);

            }
        } else {
            setActiveProductList2(JSON.parse(activeList2Storage));
        }
    }

    const getProductListForLabel3 = async (pageNumber) => {
        const activeList3Storage = await AsyncStorage.getItem("ActiveList3Storage");
        const body = {
            labelIds: dropDownData["Label"].map(label => {
                if (label["dropDownId"] === 30103) {
                    setLabel3(label["dropDrownValue"]);
                    return label["dropDownId"]
                }
            }).filter(ele => ele != undefined)
        }

        if (activeList3Storage == null) {

            setIsAllProductLoading3(true);
            const URL = `${GET_PRODUCTS_BY_ID}?id=${body.labelIds.join(",")}`;


            const data = await HTTP_GET(URL);

            if (data != null && data["status"] !== undefined) {
                if (data["status"] === "invalid") {
                    toast.show({ description: "Error..!!" });
                } else if (data["status"] === "error") {
                    toast.show({ description: "Something went wrong!!" });
                }
                setIsAllProductLoading3(false);
            } else {
                if (data != null && data.length != 0) {
                    let formattedProductList = data.map((item) => {
                        let obj = {
                            productId: item?.productInfoId,
                            productName: item?.productName,
                            productImages: item?.images,
                            rating: item?.rating,
                            price: +parseFloat(item?.price).toFixed(2),
                            unit: "",
                            subCategoryId: item?.subCategory,
                            isDiscountActive: item?.isDiscountActive,
                            discountedPrice: item?.discountedPrice ? +parseFloat(item?.discountedPrice).toFixed(2) : 0,
                            brandId: item?.brandId,
                            totalCount: item?.totalCount
                        };
                        return obj;
                    });
                    setActiveProductList3((prevList) => {
                        const combinedList = [...prevList.flat(), ...formattedProductList];
                        return chunkArray(combinedList, 4);
                    });
                    await AsyncStorage.setItem("ActiveList3Storage", JSON.stringify(chunkArray(formattedProductList, 4)));
                }
                setIsAllProductLoading3(false);
            }
        } else {
            setActiveProductList3(JSON.parse(activeList3Storage));
        }

    }

    const onProductScroll = (e) => {
        const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent;
        const isEndReached = layoutMeasurement.width + contentOffset.x >= contentSize.width - 20;
        if (isEndReached) {
            if (Math.ceil(activeProductList[0][0].totalCount / 10) - 1 >= currentPageLabel1) {
                getProductListForLabel1(currentPageLabel1 + 1);
                setCurrentPageLabel1(currentPageLabel1 + 1);
            }
        }
    }

    const onProductScroll2 = (e) => {
        const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent;
        const isEndReached = layoutMeasurement.width + contentOffset.x >= contentSize.width - 20;
        if (isEndReached) {
            if (Math.ceil(activeProductList2[0][0].totalCount / 10) - 1 >= currentPageLabel2) {
                getProductListForLabel2(currentPageLabel2 + 1);
                setCurrentPageLabel2(currentPageLabel2 + 1);
            }
        }
    }

    const onProductScroll3 = (e) => {
        const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent;
        const isEndReached = layoutMeasurement.width + contentOffset.x >= contentSize.width - 20;
        if (isEndReached) {
            if (Math.ceil(activeProductList3[0][0].totalCount / 10) - 1 >= currentPageLabel3) {
                getProductListForLabel3(currentPageLabel3 + 1);
                setCurrentPageLabel3(currentPageLabel3 + 1);
            }
        }
    }

    const chunkArray = (itemList, chunkSize = 4) => {
        const result = [];
        for (let i = 0; i < itemList.length; i += chunkSize) {
            const chunk = itemList.slice(i, i + chunkSize);
            result.push(chunk);
        }
        return result;
    }

    const renderProductItem = ({ item, index }) => {
        return (
            <Pressable
                key={`${item?.productId}_alnuaim_${index}`}
                onPress={() => gotoProductDetail(item?.productId)}
            >
                <View style={styles.productWrapper}>
                    <View style={styles.itemWrapper}>
                        {/* <Image
                            style={styles.productImage}
                            source={{
                                uri: item?.productImages.length
                                    ? `${IMAGE_PATH}${item?.productImages[0].documentPath}`
                                    : DEFAULT_PRODUCT_IMAGE,
                            }}
                        /> */}

                        <FastImage
                            style={styles.productImage}
                            source={{
                                uri: item?.productImages.length
                                    ? `${IMAGE_PATH}${item?.productImages[0].documentPath}`
                                    : DEFAULT_PRODUCT_IMAGE,
                            }}
                            resizeMode={FastImage.resizeMode.contain}
                        />
                    </View>
                    <View style={styles.productData}>
                        <Text numberOfLines={1} style={styles.productTitle}>
                            {item?.productName}
                        </Text>
                        {item?.isDiscountActive === "Y" ? (
                            <Text style={styles.productPrice}>
                                ₹ {item?.discountedPrice}{" "}
                                <Text adjustsFontSizeToFit={true} style={styles.discountPrice}>
                                    ₹ {item?.price}
                                </Text>
                            </Text>
                        ) : (
                            <Text style={styles.productPrice}>₹ {item?.price}</Text>
                        )}
                    </View>
                </View>
            </Pressable>
        );
    };


    const AlNuaim = () => (
        <View >

            {
                isBrandProductsLoading ?
                    <View style={styles.productContainer}>
                        <View style={styles.productWrapper}>
                            <Skeleton rounded={"2xl"} h={20} />
                        </View>

                        <View style={styles.productWrapper}>
                            <Skeleton rounded={"2xl"} h={20} />
                        </View>

                        <View style={styles.productWrapper}>
                            <Skeleton rounded={"2xl"} h={20} />
                        </View>

                        <View style={styles.productWrapper}>
                            <Skeleton rounded={"2xl"} h={20} />
                        </View>
                    </View>
                    :


                    // <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    //     <View style={styles.productContainer}>
                    //         {
                    //             brandProductList.map(item => {
                    //                 return (
                    //                     <Pressable key={[item?.productId, "_alnuaim", index].join()} onPress={() => gotoProductDetail(item?.productId)}>
                    //                         <View style={styles.productWrapper}>
                    //                             <View styles={styles.itemWrapper}>
                    //                                 <Image style={styles.productImage} source={{ uri: item?.productImages.length ? `${IMAGE_PATH}${item?.productImages[0].documentPath}` : DEFAULT_PRODUCT_IMAGE }} />
                    //                             </View>
                    //                             <View style={styles.productData}>
                    //                                 <Text numberOfLines={1} style={styles.productTitle}>{item?.productName}</Text>
                    //                                 {/* <Text>Brand Id: {item?.brandId}</Text> */}
                    //                                 {
                    //                                     item?.isDiscountActive == "Y" ?
                    //                                         <Text style={styles.productPrice}>₹ {item?.discountedPrice} <Text adjustsFontSizeToFit={true} style={styles.discountPrice}>₹ {item?.price}</Text></Text> :
                    //                                         <Text style={styles.productPrice}>₹ {item?.price}</Text>
                    //                                 }
                    //                             </View>
                    //                         </View>
                    //                     </Pressable>

                    //                 )
                    //             })
                    //         }
                    //     </View>
                    // </ScrollView>

                    <FlatList
                        data={brandProductList}
                        keyExtractor={(item, index) => `${item?.productId}_alnuaim_${index}`}
                        renderItem={renderProductItem}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.productContainer}
                    />
            }

            {
                !isBrandProductsLoading && brandProductList.length == 0 &&
                <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", borderWidth: 1, borderRadius: 6, padding: rMS(30), borderColor: "#ABB2B9", marginTop: rMS(20), backgroundColor: "#FFFFFF" }}>
                    <Text adjustsFontSizeToFit={true} style={{ fontFamily: "Inter-Regular" }}>No Products Available</Text>
                </View>

            }
        </View>
    );

    const Eftina = () => (
        <View>
            {/* <View style={[styles.scene]}> */}

            {
                isBrandProductsLoading ?
                    <View style={styles.productContainer}>
                        <View style={styles.productWrapper}>
                            <Skeleton rounded={"2xl"} h={20} />
                        </View>

                        <View style={styles.productWrapper}>
                            <Skeleton rounded={"2xl"} h={20} />
                        </View>

                        <View style={styles.productWrapper}>
                            <Skeleton rounded={"2xl"} h={20} />
                        </View>

                        <View style={styles.productWrapper}>
                            <Skeleton rounded={"2xl"} h={20} />
                        </View>
                    </View>
                    :
                    // <ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
                    //     <View style={styles.productContainer}>
                    //         {
                    //             brandProductList.map(item => {
                    //                 return (
                    //                     <Pressable key={[item?.productId, "_eftina", index].join()} onPress={() => gotoProductDetail(item?.productId)}>
                    //                         <View style={styles.productWrapper}>
                    //                             <View styles={styles.itemWrapper}>
                    //                                 <Image style={styles.productImage} source={{ uri: item?.productImages.length ? `${IMAGE_PATH}${item?.productImages[0].documentPath}` : DEFAULT_PRODUCT_IMAGE }} />
                    //                             </View>
                    //                             <View style={styles.productData}>
                    //                                 <Text numberOfLines={1} style={styles.productTitle}>{item?.productName}</Text>
                    //                                 {/* <Text adjustsFontSizeToFit={true}>Brand Id: {item?.brandId}</Text> */}
                    //                                 {
                    //                                     item?.isDiscountActive === "Y" ?
                    //                                         <Text style={styles.productPrice}>₹ {item?.discountedPrice} <Text adjustsFontSizeToFit={true} style={styles.discountPrice}>₹ {item?.price}</Text></Text> :
                    //                                         <Text style={styles.productPrice}>₹ {item?.price}</Text>
                    //                                 }
                    //                             </View>
                    //                         </View>
                    //                     </Pressable>

                    //                 )
                    //             })
                    //         }
                    //     </View>
                    // </ScrollView>

                    <FlatList
                        data={brandProductList}
                        keyExtractor={(item, index) => `${item?.productId}_eftina${index}`}
                        renderItem={renderProductItem}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.productContainer}
                    />
            }
            {/* </View> */}

            {
                !isBrandProductsLoading && brandProductList.length == 0 &&
                <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", borderWidth: 1, borderRadius: 6, padding: rMS(30), borderColor: "#ABB2B9", marginTop: rMS(20) }}>
                    <Text adjustsFontSizeToFit={true} style={{ fontFamily: "Inter-Regular" }}>No Products Available</Text>
                </View>

            }
        </View>
    );

    const BannerItem = (data) => {

        let item = data.data;

        if (!item) return null;

        const isVideo = item.fileType === 'video';
        if (isVideo) {
            item.src = item.src.replace("watch?v=", "/embed/");
        }

        return (
            <View key={item.bannerId} style={{ width: wp("100%") }}>
                {/* {isVideo ? (
                    // <Video ref={(ref) => {
                    //     this.player = ref
                    // }} style={{width: "80%", height: "100%"}} paused={false} source={{
                    //     uri: item?.src
                    // }} />
                    <WebView style={{ width: "100%", height: "100%", borderRadius: 8 }} javaScriptEnabled={true}
                        domStorageEnabled={true} source={{
                            uri: item?.src
                        }} />

                    // <YouTube
                    //     videoId="VWB8RM9qHPg"
                    //     play
                    //     fullscreen
                    // />
                ) : (
                    <Image
                        style={styles.bannerImage}
                        alt="banner"
                        source={{ uri: item.src }}
                    />
                )} */}

                {item.fileType != 'video' && (
                    <Image
                        resizeMode="contain"
                        style={styles.bannerImage}
                        alt="banner"
                        source={{ uri: item.src }}
                    />
                )}
            </View>
        );
    };

    const gotoProductDetail = (productId) => {
        navigation.navigate("ProductDetail", {
            productId: productId
        })
    }

    const onCategorySelect = (category) => {
        navigation.navigate("BulkOrder", {
            category: category
        });
    }

    const goToNavigation = () => {
        navigation.navigate("Notification")
    }

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <View>
                <View style={styles.headerWrapper}>
                    <View style={{ width: "100%", flexDirection: "row", justifyContent: "center" }}>
                        <HeaderLogo />
                    </View>
                    {/* <Image width={160} height={150} source={{
                    uri: HEADER_LOGO_IMAGE
                }} /> */}
                    <Pressable style={styles.bellWrapper} onPress={() => goToNavigation()}>
                        <Bell width={18} height={18} />
                        {
                            notificationList.length > 0 && (
                                <View style={styles.notificationCountWrapper}>
                                    <Text style={styles.notificationCountText}>{notificationList.length}</Text>
                                </View>

                            )
                        }
                    </Pressable>
                </View>

                {/* <View style={styles.searchWrapper}>
                <Input style={styles.searchInput} variant="unstyled" type="text" placeholder="Search anything..." InputLeftElement={<Search width={18} height={18} />} />
            </View> */}


                <View style={{ paddingTop: rMS(10), paddingBottom: rMS(200), height: hp("100%") }}>
                    <ScrollView horizontal="false" contentContainerStyle={{ height: "auto", paddingBottom: "20%" }} showsVerticalScrollIndicator={false}>
                        {
                            isBannerLoading ?
                                <Skeleton marginTop={5} h="40" />
                                :

                                <View style={styles.bannerWrapper}>
                                    {
                                        bannerList.length !== 0 ?
                                            <SliderBox images={bannerList.map(ele => ele?.src)} dotColor="#B6974E" inactieDotColor="black"
                                                ImageComponentStyle={{ objectFit: "contain" }} ImageComponent={(props) => (
                                                    <FastImage
                                                        {...props}

                                                        resizeMode={FastImage.resizeMode.contain}
                                                    />
                                                )} autoplautoplayInterval={1000} autoplay={true} imageLoadingColor="transparent"
                                            />
                                            :
                                            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", height: "100%", backgroundColor: "#FFFFFF" }}>
                                                <Text adjustsFontSizeToFit={true} style={{ fontFamily: "Inter-Regular", fontSize: rMS(16) }}>No Banner Available</Text>
                                            </View>
                                    }
                                </View>
                        }

                        <View style={styles.categoryWrapper}>

                            {
                                isCategoryLoading && isCategoryLoading ?
                                    [1, 2, 3, 4].map(ele => {
                                        return (
                                            <View style={styles.categoryItem} key={ele}>
                                                <Skeleton rounded={"full"} size={20} />
                                            </View>
                                        )
                                    })
                                    :

                                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                        {
                                            categoryList.map(item => {
                                                return (
                                                    <Pressable key={item?.dropDownId} onPress={() => onCategorySelect(item)}>
                                                        <View style={styles.categoryItem}>
                                                            <View style={{
                                                                width: rMS(60),
                                                                height: rMS(60),
                                                                borderRadius: 100,
                                                            }}>
                                                                {/* <Image style={styles.categoryImage} resizeMode="contain" alt="category" source={{
                                                                    uri: item?.image ? `${IMAGE_PATH}${item?.image.documentPath}` : NO_IMAGE
                                                                }} /> */}
                                                                <FastImage
                                                                    style={styles.categoryImage}
                                                                    resizeMode={FastImage.resizeMode.contain}
                                                                    source={{
                                                                        uri: item?.image ? `${IMAGE_PATH}${item?.image.documentPath}` : NO_IMAGE,
                                                                    }}
                                                                    alt="category"
                                                                />
                                                            </View>
                                                            <Text adjustsFontSizeToFit={true} numberOfLines={1} style={styles.categoryText}>{item?.dropDrownValue}</Text>
                                                        </View>
                                                    </Pressable>
                                                )
                                            })
                                        }

                                    </ScrollView>
                            }


                        </View>


                        {
                            !isCategoryLoading && categoryList.length == 0 &&

                            <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", borderWidth: 1, borderRadius: 6, padding: rMS(30), borderColor: "#ABB2B9" }}>
                                <Text adjustsFontSizeToFit={true} style={{ fontFamily: "Inter-Regular" }}>No Categories Available</Text>
                            </View>
                        }

                        <View style={styles.wrapper}>
                            <TabView
                                lazy
                                swipeEnabled={false}
                                style={styles.tabView}
                                navigationState={{ index, routes }}
                                renderScene={SceneMap({
                                    first: AlNuaim,
                                    second: Eftina,
                                })}
                                onIndexChange={(e) => setIndex(e)}
                                initialLayout={{ width: layout.width }}
                                renderTabBar={props => <TabBar renderLabel={({ focused, route, color }) => (
                                    <Text style={[styles.tabLabel, focused ? { color: "#B6974E" } : { color: "#D2D2D2" }]}>
                                        {route.title}
                                    </Text>
                                )} {...props} style={styles.tab} indicatorStyle={{ backgroundColor: '#B6974E', fontFamily: "Inter-Regular" }} />}
                            />

                        </View>

                        {/* Best Seller */}
                        {
                            Array.isArray(activeProductList) && activeProductList.length > 0 &&
                            (<View style={styles.wrapper}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: "center", gap: 5 }}>
                                    <View style={{ flex: 1, height: 1.5, backgroundColor: "#B6974F" }} />
                                    <Text adjustsFontSizeToFit={true} style={styles.allProductsLbl}>{label1} </Text>
                                    <View style={{ flex: 1, height: 1.5, backgroundColor: "#B6974F" }} />
                                </View>

                                <View style={styles.activeProductContainer}>
                                    {
                                        isAllProductsLoading && activeProductList == 0 ?

                                            <>
                                                <View style={styles.activeProductWrapper}>
                                                    <Skeleton rounded={"2xl"} h={30} />
                                                </View>

                                                <View style={styles.activeProductWrapper}>
                                                    <Skeleton rounded={"2xl"} h={30} />
                                                </View>

                                                <View style={styles.activeProductWrapper}>
                                                    <Skeleton rounded={"2xl"} h={30} />
                                                </View>

                                                <View style={styles.activeProductWrapper}>
                                                    <Skeleton rounded={"2xl"} h={30} />
                                                </View>
                                            </>
                                            :

                                            <View>
                                                <ScrollView ref={scrollViewRef} horizontal={true} showsHorizontalScrollIndicator={false} onScroll={(e) => onProductScroll(e)}>
                                                    {
                                                        activeProductList.map((ele, index) => {
                                                            return (<View key={`index_${index}`} style={{ flexDirection: "row", width: win.width }}>
                                                                <View style={{ flexDirection: "row", justifyContent: "space-between", flexWrap: "wrap", gap: 10, paddingHorizontal: rMS(10) }}>
                                                                    {
                                                                        ele.map(item => {
                                                                            return (<Pressable key={[item?.productId, "_active_", index].join()} onPress={() => gotoProductDetail(item?.productId)}>
                                                                                <View style={styles.activeProductWrapper}>
                                                                                    <View styles={styles.itemWrapper}>
                                                                                        <FastImage
                                                                                            style={styles.activeProductImage}
                                                                                            resizeMode={FastImage.resizeMode.cover}
                                                                                            source={{
                                                                                                uri: item?.productImages.length ? `${IMAGE_PATH}${item?.productImages[0].documentPath}` : DEFAULT_PRODUCT_IMAGE,
                                                                                            }}
                                                                                        />
                                                                                    </View>
                                                                                    <View style={styles.productData}>
                                                                                        <Text numberOfLines={1} style={styles.productTitle}>{item?.productName}</Text>
                                                                                        {
                                                                                            item?.isDiscountActive === "Y" ?
                                                                                                <Text style={styles.productPrice}>₹ {item?.discountedPrice} <Text adjustsFontSizeToFit={true} style={styles.discountPrice}>₹ {item?.price}</Text></Text> :
                                                                                                <Text style={styles.productPrice}>₹ {item?.price}</Text>
                                                                                        }
                                                                                    </View>
                                                                                </View>
                                                                            </Pressable>)
                                                                        })

                                                                    }
                                                                </View>

                                                            </View>)
                                                        })
                                                    }
                                                </ScrollView>
                                            </View>
                                    }
                                </View>

                                {
                                    !isAllProductsLoading && activeProductList == 0 &&
                                    <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", borderWidth: 1, borderRadius: 6, padding: rMS(30), borderColor: "#ABB2B9", marginTop: rMS(20), backgroundColor: "#FFFFFF" }}>
                                        <Text adjustsFontSizeToFit={true} style={{ fontFamily: "Inter-Regular" }}>No Products Available</Text>
                                    </View>
                                }

                            </View>)
                        }

                        {/* New Arrival */}
                        {
                            activeProductList2.length > 0 &&
                            (<View style={[styles.wrapper, { marginTop: rMS(20) }]}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: "center", gap: 5 }}>
                                    <View style={{ flex: 1, height: 1.5, backgroundColor: "#B6974F" }} />
                                    <Text adjustsFontSizeToFit={true} style={styles.allProductsLbl}>{label2} </Text>
                                    <View style={{ flex: 1, height: 1.5, backgroundColor: "#B6974F" }} />
                                </View>

                                <View style={styles.activeProductContainer}>
                                    {
                                        isAllProductsLoading2 && activeProductList2 == 0 ?

                                            <>
                                                <View style={styles.activeProductWrapper}>
                                                    <Skeleton rounded={"2xl"} h={30} />
                                                </View>

                                                <View style={styles.activeProductWrapper}>
                                                    <Skeleton rounded={"2xl"} h={30} />
                                                </View>

                                                <View style={styles.activeProductWrapper}>
                                                    <Skeleton rounded={"2xl"} h={30} />
                                                </View>

                                                <View style={styles.activeProductWrapper}>
                                                    <Skeleton rounded={"2xl"} h={30} />
                                                </View>
                                            </>
                                            :

                                            <View>
                                                <ScrollView ref={scrollViewRef} horizontal={true} showsHorizontalScrollIndicator={false} onScroll={(e) => onProductScroll2(e)}>
                                                    {
                                                        activeProductList2.map((ele, index) => {
                                                            return (<View key={`index_${index}`} style={{ flexDirection: "row", width: win.width }}>
                                                                <View style={{ flexDirection: "row", justifyContent: "space-between", flexWrap: "wrap", gap: 10, paddingHorizontal: rMS(10) }}>
                                                                    {
                                                                        ele.map(item => {
                                                                            return (<Pressable key={[item?.productId, "_", index].join()} onPress={() => gotoProductDetail(item?.productId)}>
                                                                                <View style={styles.activeProductWrapper}>
                                                                                    <View styles={styles.itemWrapper}>
                                                                                        <FastImage
                                                                                            style={styles.activeProductImage}
                                                                                            resizeMode={FastImage.resizeMode.cover}
                                                                                            source={{
                                                                                                uri: item?.productImages.length ? `${IMAGE_PATH}${item?.productImages[0].documentPath}` : DEFAULT_PRODUCT_IMAGE,
                                                                                            }}
                                                                                        />
                                                                                    </View>
                                                                                    <View style={styles.productData}>
                                                                                        <Text numberOfLines={1} style={styles.productTitle}>{item?.productName}</Text>
                                                                                        {
                                                                                            item?.isDiscountActive === "Y" ?
                                                                                                <Text style={styles.productPrice}>₹ {item?.discountedPrice} <Text adjustsFontSizeToFit={true} style={styles.discountPrice}>₹ {item?.price}</Text></Text> :
                                                                                                <Text style={styles.productPrice}>₹ {item?.price}</Text>
                                                                                        }
                                                                                    </View>
                                                                                </View>
                                                                            </Pressable>)
                                                                        })

                                                                    }
                                                                </View>

                                                            </View>)
                                                        })
                                                    }
                                                </ScrollView>
                                            </View>
                                    }
                                </View>

                                {
                                    !isAllProductsLoading2 && activeProductList2 == 0 &&
                                    <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", borderWidth: 1, borderRadius: 6, padding: rMS(30), borderColor: "#ABB2B9", marginTop: rMS(20), backgroundColor: "#FFFFFF" }}>
                                        <Text adjustsFontSizeToFit={true} style={{ fontFamily: "Inter-Regular" }}>No Products Available</Text>
                                    </View>
                                }

                            </View>)
                        }

                        {/* Test 3 Label */}
                        {
                            activeProductList3.length > 0 &&
                            (<View style={[styles.wrapper, { marginTop: rMS(20) }]}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: "center", gap: 5 }}>
                                    <View style={{ flex: 1, height: 1.5, backgroundColor: "#B6974F" }} />
                                    <Text adjustsFontSizeToFit={true} style={styles.allProductsLbl}>{label3} </Text>
                                    <View style={{ flex: 1, height: 1.5, backgroundColor: "#B6974F" }} />
                                </View>

                                <View style={styles.activeProductContainer}>
                                    {
                                        isAllProductsLoading3 && activeProductList3 == 0 ?

                                            <>
                                                <View style={styles.activeProductWrapper}>
                                                    <Skeleton rounded={"2xl"} h={30} />
                                                </View>

                                                <View style={styles.activeProductWrapper}>
                                                    <Skeleton rounded={"2xl"} h={30} />
                                                </View>

                                                <View style={styles.activeProductWrapper}>
                                                    <Skeleton rounded={"2xl"} h={30} />
                                                </View>

                                                <View style={styles.activeProductWrapper}>
                                                    <Skeleton rounded={"2xl"} h={30} />
                                                </View>
                                            </>
                                            :

                                            <View>
                                                <ScrollView ref={scrollViewRef} horizontal={true} showsHorizontalScrollIndicator={false} onScroll={(e) => onProductScroll3(e)}>
                                                    {
                                                        activeProductList.map((ele, index) => {
                                                            return (<View key={`index_${index}`} style={{ flexDirection: "row", width: win.width }}>
                                                                <View style={{ flexDirection: "row", justifyContent: "space-between", flexWrap: "wrap", gap: 10, paddingHorizontal: rMS(10) }}>
                                                                    {
                                                                        ele.map(item => {
                                                                            return (<Pressable key={[item?.productId, "_", index].join()} onPress={() => gotoProductDetail(item?.productId)}>
                                                                                <View style={styles.activeProductWrapper}>
                                                                                    <View styles={styles.itemWrapper}>
                                                                                        <FastImage
                                                                                            style={styles.activeProductImage}
                                                                                            resizeMode={FastImage.resizeMode.cover}
                                                                                            source={{
                                                                                                uri: item?.productImages.length ? `${IMAGE_PATH}${item?.productImages[0].documentPath}` : DEFAULT_PRODUCT_IMAGE,
                                                                                            }}
                                                                                        />
                                                                                    </View>
                                                                                    <View style={styles.productData}>
                                                                                        <Text numberOfLines={1} style={styles.productTitle}>{item?.productName}</Text>
                                                                                        {
                                                                                            item?.isDiscountActive === "Y" ?
                                                                                                <Text style={styles.productPrice}>₹ {item?.discountedPrice} <Text adjustsFontSizeToFit={true} style={styles.discountPrice}>₹ {item?.price}</Text></Text> :
                                                                                                <Text style={styles.productPrice}>₹ {item?.price}</Text>
                                                                                        }
                                                                                    </View>
                                                                                </View>
                                                                            </Pressable>)
                                                                        })

                                                                    }
                                                                </View>

                                                            </View>)
                                                        })
                                                    }
                                                </ScrollView>
                                            </View>
                                    }
                                </View>

                                {
                                    !isAllProductsLoading3 && activeProductList3 == 0 &&
                                    <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", borderWidth: 1, borderRadius: 6, padding: rMS(30), borderColor: "#ABB2B9", marginTop: rMS(20), backgroundColor: "#FFFFFF" }}>
                                        <Text adjustsFontSizeToFit={true} style={{ fontFamily: "Inter-Regular" }}>No Products Available</Text>
                                    </View>
                                }

                            </View>)
                        }


                    </ScrollView>
                </View>
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
    headerWrapper: {
        // paddingHorizontal: 24,
        display: "flex",
        flexDirection: "row",
        width: "100%",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: rMS(30),
        position: "relative"
    },
    bellWrapper: {
        position: "absolute",
        right: rMS(20)
    },
    notificationCountWrapper: {
        position: 'absolute',
        top: -10,
        right: -10,
        width: 20,
        height: 20,
        borderRadius: 10, // Half of the width/height to make it round
        backgroundColor: '#B6974E',
        justifyContent: 'center',
        alignItems: 'center',
    },
    notificationCountText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    container: {
        marginTop: StatusBar.currentHeight,
    },
    scene: {
        flex: 1,
    },

    searchWrapper: {
        marginTop: 30,
        marginHorizontal: 24,
        borderWidth: 1,
        borderColor: "#B6974F",
        borderRadius: 63,
        paddingHorizontal: 15,
    },
    searchInput: {
        fontSize: 18,
        borderWidth: 0,
        borderColor: "#FFFFFF"
    },
    wrapper: {
        paddingHorizontal: 24,
    },
    bannerWrapper: {
        width: "100%",
        height: 200,
        borderRadius: 16,
        marginTop: rMS(10),

    },
    banner: {
        width: "100%",
        height: "100%",
        objectFit: "contain",
        borderRadius: 16

    },
    categoryWrapper: {
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: rMS(15),
        gap: rMS(20),
    },
    categoryItem: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 10
    },
    categoryImage: {
        width: "100%",
        height: "100%",
        borderRadius: 100
    },

    categoryText: {
        fontSize: 10,
        fontWeight: "400",
        fontFamily: "Inter-Regular",
        color: "#000000",
        width: rMS(100),
        textAlign: "center"
    },
    tabLabel: {
        fontSize: 16,
        fontWeight: "700"
    },
    tab: {
        backgroundColor: "transparent",
        shadowColor: "#ffffff",
        borderColor: "#B6974E",
        marginHorizontal: 50,
        fontFamily: "Inter-Regular"
    },
    tabView: {
        height: 300
    },
    productContainer: {
        display: "flex",
        flexDirection: "row",
        gap: 15
    },

    productWrapper: {
        width: wp("35%"),
        height: hp("25%"),
        backgroundColor: "#E5E8E8",
        borderRadius: 16,
        marginTop: 30,
        // borderColor: "red"
    },
    itemWrapper: {
        width: "100%",
        height: "auto",
        borderRadius: 16,
        display: "flex",
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
        // height: 128
    },

    productImage: {
        width: "100%",
        height: rVS(120),
        borderRadius: 6,
        objectFit: "cover",
        // resizeMode: 'contain',
        // aspectRatio: 1,
        // alignSelf: 'center'
        // height: 128
    },

    bannerImage: {
        width: "100%",
        height: "100%",
        objectFit: "contain"
    },

    productData: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 3,
        marginTop: rMS(10)
    },
    productTitle: {
        fontSize: 12,
        fontWeight: "400",
        color: "#DA9039",
        fontFamily: "Inter-Regular"
    },
    productPrice: {
        fontSize: 12,
        fontWeight: "400",
        color: "#000000",
        fontFamily: "Inter-Regular"
    },
    discountPrice: {
        fontSize: 12,
        fontWeight: "400",
        color: "#B2BABB",
        textDecorationLine: "line-through",
        fontFamily: "Inter-Regular"
    },
    activeProductContainer: {
        display: "flex",
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between"
    },
    activeProductWrapper: {
        width: wp("45%"),
        height: hp("27%"),
        backgroundColor: "#E5E8E8",
        borderRadius: 16,
        marginTop: 30,
        overflow: "hidden"
        // borderColor: "red"
    },
    activeProductImage: {
        width: "100%",
        height: hp("20%"),
        // borderRadius: 16,
        borderRadius: 6,
        objectFit: "cover",
        // aspectRatio: 1,
        // alignSelf: 'center'
        // height: 128
    },
    allProductsLbl: {
        fontSize: rMS(20),
        fontWeight: "700",
        color: "#B6974F",
        fontFamily: "Inter-Regular",
        textAlign: "center"
    },

});

export default Home;