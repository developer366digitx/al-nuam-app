import { Input, ScrollView, Text, View, useToast, Menu, Pressable, Checkbox, Actionsheet, Box, useDisclose, Button, Spinner, Heading, HStack, VStack, Skeleton, Center, Radio, Modal, KeyboardAvoidingView, Select, HamburgerIcon, FlatList } from "native-base";
import React, { forwardRef, useEffect, useRef, useState } from "react";
import { Alert, Dimensions, StyleSheet, Image, TouchableWithoutFeedback, Keyboard, StatusBar, ActionSheetIOS, Platform } from "react-native";
import Back from "../../../assets/back.svg";
import { ADD_TO_CART, BASE64, GET_CART, GET_DISCOUNTS, GET_DROPDOWN_DATA, GET_PRODUCT_BY_PRODUCT_ID, GET_PRODUCT_LIST, IMAGE_PATH } from "../../utils/constant";
import { HTTP_GET, HTTP_POST } from "../../utils/http-service";
import Search from "../../../assets/icons/search.svg";
import FilterIcon from "../../../assets/arrow-filter.svg";
import Product1 from "../../../assets/images/product-1.png";
import Star from "../../../assets/star.svg";
import Plus from "../../../assets/plus.svg";
import Minus from "../../../assets/minus.svg";
import { rMS, rVS } from "../../utils/responsive";
import { getCustomerId } from "../../utils/helper";
import DefaultImage from "../../../assets/images/default-product-image.png";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import {
    CopilotProvider,
    CopilotStep,
    walkthroughable,
    useCopilot
} from "react-native-copilot";
import { useNavigation, useRoute } from "@react-navigation/native";
import uuid from 'react-native-uuid';
import NoImage from "../../../assets/images/No-Image-Placeholder.png";
import { SliderBox } from "react-native-image-slider-box";
import FastImage from 'react-native-fast-image';
import AsyncStorage from "@react-native-async-storage/async-storage";

const win = Dimensions.get('window');

const BulkOrder = () => {

    const navigation = useNavigation();
    const route = useRoute();

    const [categoryList, setCategoryList] = useState([]);
    const [dropDownData, setDropDownData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [subCategoryList, setSubCategoryList] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    // const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [productList, setProductList] = useState([{}]);
    const [copyOfProductList, setCopyOfProductList] = useState([]);
    const [visibleProductList, setVisibleProductList] = useState([]);
    const [isProductLoading, setIsProductLoading] = useState(true);
    const [modifiedProductList, setModifiedProductList] = useState(route?.params?.productList ? route.params.productList : []);
    const [totalPrice, setTotalPrice] = useState(0);
    const [selectedFilterSubCategories, setSelectedFilterSubCategories] = useState(null);
    const [currentCartonSize, setCurrentCartonSize] = useState(0);
    const [isDiscountOpen, setIsDiscountOpen] = useState(false);
    const [discountList, setDiscountList] = useState([]);
    const [allSubCategories, setAllSubCategories] = useState([]);
    const [discountApply, setDiscountApply] = useState(null);
    const [radioSubCategory, setRadioSubCategory] = useState(null);
    const [isCategoryLoading, setIsCategoryLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [productDetailModal, setProductDetailModal] = useState(false);
    const [productDetailInfo, setProductDetailInfo] = useState(null);
    const [productValidModal, setProductValidModal] = useState(false);
    const [itemToaddAndRemove, setItemsToAddandRemove] = useState({
        itemsToAdd: 0,
        itemsToRemove: 0
    });
    const [productInfoLoading, setProductInfoLoading] = useState(false);

    const [hasAPITriggered, setHasAPITriggered] = useState(false);
    const [isFilterApplied, setIsFilterApplied] = useState(false);
    const [nextAvailableDiscount, setNextAvailableDiscount] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isCartCalled, setIsCartCalled] = useState(true);
    const bottomTabBarHeight = useBottomTabBarHeight();
    const { height: windowHeight } = Dimensions.get("window");

    const DEFAULT_PRODUCT_IMAGE = Image.resolveAssetSource(DefaultImage).uri;

    const { start } = useCopilot();
    const NO_IMAGE = Image.resolveAssetSource(NoImage).uri;

    const screenHeight = Dimensions.get('window').height;
    const dynamicBottom = screenHeight * 0.06; // 6% of screen height

    const qtyRefs = useRef([]);
    const [currentInputIndex, setCurrentinputIndex] = useState(null);

    const CopilotView = walkthroughable(View);
    const CopilotInput = walkthroughable(Input);
    const CopilotText = walkthroughable(Text);

    const {
        isOpen,
        onOpen,
        onClose
    } = useDisclose();

    const insets = useSafeAreaInsets();

    const toast = useToast();

    useEffect(() => {
        getDiscountList();
        if (categoryList.length == 0) {
            getCategoryList();
        }
    }, []);

    useEffect(() => {
        if (productDetailInfo != null) {
            setProductInfoLoading(false);
        }
    }, [productDetailInfo])

    useEffect(() => {
        if (selectedFilterSubCategories != null && productList.length == 0) {
            // getProductList(selectedCategory);
            setIsProductLoading(true);
            getCart();
        }
    }, [selectedFilterSubCategories])

    useEffect(() => {
        if (modifiedProductList.length > 0 && isCartCalled) {
            getProductList(selectedCategory, null);
        }
    }, [modifiedProductList]);

    useEffect(() => {
        if (dropDownData) {
            if (route?.params?.category) {
                getSubCategoryList(route.params.category, false);
            } else {
                getSubCategoryList(selectedCategory, false);
            }
        }
    }, [dropDownData, selectedCategory])

    useEffect(() => {
        if (subCategoryList.length && !hasAPITriggered) {
            setSelectedFilterSubCategories(subCategoryList[currentIndex]);
            setRadioSubCategory(subCategoryList[currentIndex]);
            if (!isCartCalled) {
                setHasAPITriggered(false);
                getProductList(selectedCategory, subCategoryList[currentIndex]);
            }
        }
    }, [subCategoryList, currentIndex, hasAPITriggered])


    useEffect(() => {
        if (isFilterApplied) {
            getProductList(selectedCategory);
        }
    }, [isFilterApplied]);

    const getProductList = async (productDta, subCategory = null) => {
        setIsProductLoading(true);
        setIsLoading(true);
        // setProductList([]);
        let body = null;

        if (productDta.dropDownId == 0) {
            body = {}
        } else {
            body = {
                category: productDta["dropDownId"]
            }
        }

        if (selectedFilterSubCategories != null || subCategory != null) {
            body["subCategory"] = subCategory == null ? selectedFilterSubCategories?.dropDownId : subCategory.dropDownId;
        }

        const URL = `${GET_PRODUCT_LIST}?page=0&size=1000&sort=isActive,asc`;
        const data = await HTTP_POST(URL, body);

        if (data != null && data["status"] !== undefined) {
            if (data["status"] === "invalid") {
                toast.show({ description: "Error..!!" });
            } else if (data["status"] === "error") {
                toast.show({ description: "Something went wrong!!" });
            }


            setProductList([]);
            setCopyOfProductList([]);
            setIsProductLoading(false);
        } else {
            if (data != null && data.length != 0) {
                let formattedProductList = data.map((item) => {
                    let obj = {
                        productId: item?.productInfoId,
                        productName: item?.productName,
                        productImages: item?.images,
                        rating: item?.rating,
                        price: item?.price,
                        unit: "",
                        subCategoryId: item?.subCategory,
                        isDiscountActive: item?.isDiscountActive,
                        discountedPrice: item?.discountedPrice,
                        stock: item?.stockQuantity,
                        minQuantityForOrder: item?.minQuantityForOrder,
                        cartonSize: selectedFilterSubCategories ? selectedFilterSubCategories?.cartonSize / 12 : 0,
                        isProductValid: true,
                        isFocus: false
                    };

                    let matchingProduct = modifiedProductList.find(ele => ele?.productId === item?.productInfoId);

                    if (matchingProduct && modifiedProductList.length) {
                        obj.unit = matchingProduct.unit || "";
                        obj.cartonSize = matchingProduct.unit ? Math.trunc(+matchingProduct.unit / obj.cartonSize) : 0;
                    } else {
                        obj.unit = "";
                        obj.cartonSize = 0;
                    }


                    return obj;
                });


                // setVisibleProductList(formattedProductList);
                setProductList(formattedProductList);
                setCopyOfProductList(formattedProductList);
                setIsProductLoading(false);
                calculateCartonSize();
                calculateTotalPrice();
                setIsLoading(false);
                setIsFilterApplied(false);

            } else {
                setProductList([]);
                setCopyOfProductList([]);
                setIsProductLoading(false);
                setIsLoading(false);
                setIsFilterApplied(false);
            }
        }
    }


    const handleScroll = (event) => {
        const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
        console.log("called");

        // Check if the user has scrolled near the bottom
        if (layoutMeasurement.height + contentOffset.y >= contentSize.height - 20) {
            //   loadMoreItems();
        }
    };

    const calculateTotalPrice = () => {
        let tot_price = 0;
        let cur_carton_size = 0;
        modifiedProductList.forEach(ele => {
            tot_price = tot_price + ((ele?.isDiscountActive == "Y" ? ele?.discountedPrice : ele?.price) * ele?.unit * 12);
            // cur_carton_size = cur_carton_size + (ele?.unit * 12 % selectedFilterSubCategories?.cartonSize / 12);
        });

        // discountList.forEach(ele => {
        //     if(ele?.number == tot_price){
        //         setDiscountApply(ele);
        //     }
        // });


        findDiscountApply(tot_price);

        setTotalPrice(+tot_price.toFixed(2));
        // setCurrentCartonSize(cur_carton_size);

    }


    const findDiscountApply = (totalPrice) => {
        let applicableDiscount = null;
        let maxNumber = 0;
        let nextAvailableDiscount = null;

        for (let i = 0; i < discountList.length; i++) {
            const discount = discountList[i];

            // Check if the discount is applicable based on its type and conditions
            if (totalPrice >= discount.number && discount.number > maxNumber) {
                applicableDiscount = discount;
                maxNumber = discount.number;
            }
        }

        for (let i = 0; i < discountList.length; i++) {
            const discount = discountList[i];
            // Find the next available discount which is higher than the current total price
            if (discount.number > totalPrice && (!nextAvailableDiscount || discount.number < nextAvailableDiscount.number)) {
                nextAvailableDiscount = discount;
                setNextAvailableDiscount(nextAvailableDiscount);
            }
        }

        setDiscountApply(applicableDiscount);

    }


    const validateCartonSize = () => {
        modifiedProductList.forEach((ele, index) => {
            if (ele?.unit == "") {
                modifiedProductList.splice(index, 1);
            }
        });

        if (modifiedProductList.length == 0 || selectedFilterSubCategories == null) {
            toast.show({
                description: "Please add product quantity"
            })
            return;
        }

        let cartonSize = selectedFilterSubCategories?.cartonSize;
        let currentCartonSize = selectedFilterSubCategories?.currentCartonSize;

        if (currentCartonSize == 0 && modifiedProductList.length == 0) {
            return;
        }

        let total = 0;

        const productsGroupBySubCategoryList = modifiedProductList.map(ele => {
            if (ele?.subCategoryId === selectedFilterSubCategories?.dropDownId) {
                return ele;
            }
        }).filter(item => item != undefined);

        productsGroupBySubCategoryList.forEach(product => {
            if (product?.unit) {
                total = total + (+product?.unit);
            }
        });


        if (total % (selectedFilterSubCategories?.cartonSize / 12) == 0) {
            return true;
        } else {
            let itemsToAdd = (cartonSize / 12) - Math.trunc(total % (cartonSize / 12));
            let itemsToRemove = Math.trunc(total % (cartonSize / 12));
            setItemsToAddandRemove({ ...itemToaddAndRemove, itemsToAdd: itemsToAdd, itemsToRemove: itemsToRemove });
            setShowModal(true);
            // Alert.alert(`Please add ${itemsToAdd} Dozen or remove ${itemsToRemove} Dozen to match the required carton size`);
            return false;
        }

    }


    const getCategoryList = async () => {
        const categoryStorage = await AsyncStorage.getItem("CategoryStorage");
        if (categoryStorage == null) {
            setIsProductLoading(true);
            setIsCategoryLoading(true);
            const URL = `${GET_DROPDOWN_DATA}`;
            const data = await HTTP_POST(URL, {});

            if (data != null && data["status"] !== undefined) {
                if (data["status"] === "invalid") {
                    toast.show({ description: "Error..!!" });
                } else if (data["status"] === "error") {
                    toast.show({ description: "Something went wrong!!" });
                }
            } else {
                await AsyncStorage.setItem("CategoryStorage", JSON.stringify(data));
                await setDropDownData(data);
                await setCategoryList([...data['Category']]);
                setSelectedCategory(data['Category'][0]);
                setIsCategoryLoading(false);
            }

        } else {
            const cachedValue = JSON.parse(categoryStorage);
            await setDropDownData(cachedValue);
            await setCategoryList([...cachedValue['Category']]);
            setSelectedCategory(cachedValue['Category'][0]);
            setIsCategoryLoading(false);
        }
    }

    const getSubCategoryList = async (category, isClickOnCategory = true) => {

        if (isClickOnCategory && (modifiedProductList.length != 0 && !validateCartonSize())) {
            return;
        }

        setIsLoading(true);

        // if (modifiedProductList.length !== 0 && !validateCartonSize()) {
        //     return;
        // }
        if (route && route.params) {
            route.params.category = null;
        }
        setCurrentCartonSize(0);
        setCurrentIndex(0);
        setSelectedCategory(category);
        setSelectedFilterSubCategories(null);
        setIsProductLoading(true);
        if (!isClickOnCategory) {
            setProductList([]);
        }
        // getProductList(category);
        const subCategoryList = dropDownData["Sub Category"].map(ele => ({ ...ele, checked: false }));
        let tmp_list = [];
        setAllSubCategories(subCategoryList);
        let filtered_list = subCategoryList.map(item => {
            if (item?.parentDropDrownId === category.dropDownId) {
                item["currentCartonSize"] = 0;
                tmp_list.push(item);
            }
        });
        setSubCategoryList([...tmp_list]);
        setRadioSubCategory(tmp_list[0]);
        calculateCartonSize();
    }


    const onSearch = (query) => {
        if (query.length) {
            let filteredProductList = productList.filter((item) => {
                return item?.productName.toLowerCase().includes(query.toLowerCase());
            });
            setProductList(filteredProductList)
        } else {
            setProductList(copyOfProductList);
        }
    }

    const onProductUnitChange = (e, product, index) => {

        // const product = { ...product, unit: e };

        product.unit = e;
        product.isFocus = true;

        if (e != "" && +e > Math.floor(product.stock)) {
            product.isProductValid = false;
        } else if ((e != "" && +e < product?.minQuantityForOrder)) {
            product.isProductValid = false;
        } else {
            product.isProductValid = true;
            product.cartonSize = selectedFilterSubCategories ? Math.trunc(+product.unit / (selectedFilterSubCategories.cartonSize / 12)) : 0;

        }



        productList.forEach(item => {
            if (item?.productId == product.productId) {
                item.isFocus = true;
            } else {
                item.isFocus = false;
            }
        });


        let modifiedList = productList.map(({ ...ele }) => {
            if (ele.productId == product.productId) {
                ele = product;
                return ele;
            }
            return ele;
        });

        // console.log(modifiedList);


        // setProductList([...modifiedList]);

        setProductList((prevProductList) => {
            return prevProductList.map(({ ...ele }) =>
                ele.productId === product.productId ? { ...ele, ...product } : ele

            )
        }
        );


        setCopyOfProductList((prevCopyList) =>
            prevCopyList.map((ele) =>
                ele.productId === product.productId ? { ...ele, ...product } : ele
            )
        );

        if (e != "" && +e > Math.floor(product.stock)) {
            toast.show({
                description: `Only ${Math.floor(product.stock)} Dozen are available in stock.`
            });
            return; E
        }

        const foundIndex = modifiedProductList.findIndex((ele) => ele?.productId == product.productId);
        if (foundIndex == -1) {
            modifiedProductList.push(product);
        } else {
            modifiedProductList[foundIndex] = product;
        }

        setModifiedProductList(modifiedProductList.filter(item => item?.unit != ""));

        // setTimeout(() => {
        //     qtyRefs.current[index].focus();
        // }, 1000);

        // if (qtyRefs.current[index] && qtyRefs.current[index].isFocused()) {
        //     qtyRefs.current[index].focus();
        // }

        // setCurrentinputIndex(index);


        calculateTotalPrice();
        calculateCartonSize();
    }

    const calculateCartonSize = () => {
        if (selectedFilterSubCategories == null) {
            return;
        }

        let total = 0;

        const productsGroupBySubCategoryList = modifiedProductList.map(ele => {
            if (ele?.subCategoryId === selectedFilterSubCategories?.dropDownId) {
                return ele;
            }
        }).filter(item => item != undefined);

        productsGroupBySubCategoryList.forEach(product => {
            if (product?.unit) {
                total = total + (+product?.unit);
            }
        });
        // selectedFilterSubCategories.currentCartonSize = Math.trunc(total / (selectedFilterSubCategories?.cartonSize / 12))
        setSelectedFilterSubCategories({ ...subCategoryList[currentIndex], currentCartonSize: Math.trunc(total / (selectedFilterSubCategories?.cartonSize / 12)) });
    }


    const onSubCategorySelect = (subCategoryId) => {

        // if (productList.length !== 0 && !validateCartonSize()) {
        //     handleActionSheetClose();
        //     return;
        // }

        const foundSubCategory = subCategoryList.find(ele => ele.dropDownId == subCategoryId);

        setRadioSubCategory(foundSubCategory);
    }

    const applyFilter = () => {
        // setProductList([]);

        if (modifiedProductList.length != 0 && !validateCartonSize()) {
            return;
        }
        setHasAPITriggered(false);
        const foundSubCategory = subCategoryList.find(ele => ele.dropDownId == radioSubCategory.dropDownId);
        const index = subCategoryList.findIndex(ele => ele.dropDownId == radioSubCategory.dropDownId);
        setCurrentIndex(index);
        setSelectedFilterSubCategories(foundSubCategory);
        setIsFilterApplied(true);
        handleActionSheetClose();
    }

    const clearFilter = () => {
        subCategoryList.forEach(ele => {
            ele.checked = false;
        });

        setSubCategoryList(subCategoryList);
        setSelectedFilterSubCategories([]);

        handleActionSheetClose();
    }

    const handleActionSheetClose = () => {
        if (!isFilterApplied) {
            setRadioSubCategory(selectedFilterSubCategories);
        }
        onClose();
    }

    const getDiscountList = async () => {
        const URL = `${GET_DISCOUNTS}`;
        const data = await HTTP_POST(URL, {});

        if (data != null && data["status"] !== undefined) {
            if (data["status"] === "invalid") {
                toast.show({ description: "Error..!!" });
            } else if (data["status"] === "error") {
                toast.show({ description: "Something went wrong!!" });
            }
        } else {
            if (data == null) {
                setDiscountList([]);
            } else {
                setDiscountList(data);
            }
        }
    }

    const navigateToSummary = async () => {

        // Old code
        //  if (!validateCartonSize()) {
        //     return;
        // }

        // if (!productList.every(ele => ele?.isProductValid)) {
        //     setProductValidModal(true);
        //     return;
        // } else {
        //     setProductValidModal(false);
        // }

        // navigation.navigate("Bulk_Summary", {
        //     productList: modifiedProductList.map(ele => {
        //         ele.cartonSize = ele.cartonSize / 12;
        //         if (ele.unit != 0) {
        //             return ele;
        //         }
        //         return ele;
        //     }),
        //     subCategoryList: allSubCategories,
        //     discount: discountApply,
        //     nextAvailableDiscount
        // })

        // Add to  Cart
        try {
            const prod_list = [];
            modifiedProductList.map(ele => {
                ele.cartonSize = ele.cartonSize / 12;
                if (ele.unit != 0) {
                    return ele;
                }
                return ele;
            }).forEach(product => {
                prod_list.push({
                    productId: product.productId,
                    quantity: (+product.unit)
                })
            });
            setIsLoading(true);
            const Obj = {
                customerId: await getCustomerId(),
                subcategories: [{ "products": prod_list }],
                totalBillAmount: totalPrice
            }
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


        } catch (error) {
            console.log(error, 'error');
            toast.show({ description: "Uh-oh! 🚫 Add to cart failed. Please try again. 🛒" });
        }

    }
    const back = () => {
        navigation.navigate("Dashboard", { screen: "Home" });
    }

    const getCart = async () => {
        const customerId = await getCustomerId();
        const URL = `${GET_CART}/${customerId}`;
        const data = await HTTP_GET(URL);
        if (data != null && data["status"] !== undefined) {
            if (data["status"] === "invalid") {
                toast.show({ description: "Oops! It seems you something went wrong" });
            } else if (data["status"] === "error") {
                toast.show({ description: "Something went wrong!!" });
            }
        } else {

            if (data != null && data.subcategories.length) {
                let prod_list = [];
                data?.subcategories.forEach((subcategory, index) => {
                    subcategory.products.forEach(item => {
                        let obj = {
                            productId: item?.productId,
                            productName: item?.productName,
                            productImages: item?.images,
                            rating: item?.rating,
                            price: item?.price,
                            unit: item?.quantity.toString(),
                            cartonSize: Math.trunc(+item?.quantity / (subcategory?.cartonSize / 12)),
                            subCategoryId: subcategory?.subcategoryId,
                            isDiscountActive: item?.isDiscountActive,
                            discountedPrice: item?.discountedPrice
                        }

                        // modifiedProductList.forEach(ele => {
                        //     if(ele.productId === obj?.productId){
                        //         ele.unit = obj?.unit;
                        //     }else{
                        //     }
                        // })
                        prod_list.push(obj);
                        // return obj;
                    });
                });

                const mergedArray = [...modifiedProductList, ...prod_list];

                const uniqueArray = mergedArray.reduce((acc, current) => {
                    const x = acc.find(item => item.productId === current.productId);
                    if (!x) {
                        return acc.concat([current]);
                    } else {
                        return acc;
                    }
                }, []);
                setModifiedProductList(uniqueArray);

                setIsCartCalled(false);
            } else {
                setIsCartCalled(false);
                getProductList(selectedCategory);
            }

        }
    }

    const CategoryListComponent = ({ copilot }) => {
        return (
            <View {...copilot} style={{ flexDirection: "row", gap: 10 }}>
                {
                    categoryList.map((item) => <Pressable onPress={() => getSubCategoryList(item, true)} style={selectedCategory?.dropDownId == item?.dropDownId ? styles.ActiveCategory : styles.categoryItem} key={item?.dropDownId}><Text adjustsFontSizeToFit={true} style={selectedCategory?.dropDownId == item?.dropDownId ? styles.ActiveTextColor : styles.InActiveTextColor}>{item?.dropDrownValue}</Text></Pressable>)
                }
            </View>
        )
    }

    const nextSubCategory = () => {
        if (currentIndex < subCategoryList.length - 1) {
            if (modifiedProductList.length != 0 && !validateCartonSize()) {
                return;
            }
            setHasAPITriggered(false);
            setCurrentIndex(currentIndex + 1);
            // setSelectedFilterSubCategories(subCategoryList[currentIndex]);
        } else {
            toast.show({ description: "You've reached the end of the list." })
        }

    }

    const backSubCategory = () => {
        if (currentIndex > 0) {
            if (modifiedProductList.length != 0 && !validateCartonSize()) {
                return;
            }
            setHasAPITriggered(false);
            setCurrentIndex(currentIndex - 1);
            // setSelectedFilterSubCategories(subCategoryList[currentIndex]);
        } else {
            toast.show({ description: "You're at the start of the list." })
        }

    }

    // const ChooseSubCategory = ({ copilot }) => {
    //     return (
    //         <Pressable onPress={onOpen} style={{
    //             borderWidth: 1, borderRadius: 6, borderColor: "#B6974E", width: "70%"
    //         }}>

    //             <Text {...copilot} adjustsFontSizeToFit={true} numberOfLines={2} style={{ fontFamily: "Inter-Regular", fontSize: rMS(12), color: "grey", padding: rMS(5), textAlign: "center" }}>Change Subcategory</Text>
    //         </Pressable>
    //     )
    // }

    const ChooseSubCategory = ({ copilot }) => {
        return (
            <Pressable
                onPress={onOpen}
                style={{
                    borderWidth: 1,
                    borderRadius: 6,
                    borderColor: "#B6974E",
                    width: "100%", // Take full width of parent container
                    paddingVertical: rMS(8),
                    paddingHorizontal: rMS(5),
                    justifyContent: 'center',
                    alignItems: 'center'
                }}
            >
                <Text
                    {...copilot}
                    numberOfLines={2}
                    style={{
                        fontFamily: "Inter-Regular",
                        fontSize: rMS(12),
                        color: "grey",
                        textAlign: "center"
                    }}
                >
                    Change Subcategory
                </Text>
            </Pressable>
        )
    }

    // const QtyInput = ({item, index}) => {
    //     console.log("render again")
    //     return (
    //         <Input key={item?.productId} w="50%" h={hp("5%")} style={styles.qtyInput} value={item?.unit} onChangeText={(e) => onProductUnitChange(e, item, index)} keyboardType="numeric" size="xs" />

    //     )
    // }


    const QtyInput = React.memo(({ item, index, onProductUnitChange }) => {
        return (
            <Input
                key={[item?.productId, "@"].join()}
                w="50%"
                h={hp("5%")}
                style={styles.qtyInput}
                value={item?.unit}
                onChangeText={(e) => onProductUnitChange(e, item, index)}
                keyboardType="numeric"
                size="xs"
            />
        );
    }, (prevProps, nextProps) => {
        return prevProps.item.unit === nextProps.item.unit && prevProps.index === nextProps.index;
    });


    const openProductDetailModal = async (productId) => {
        setProductDetailModal(true);
        setProductInfoLoading(true);
        const URL = `${GET_PRODUCT_BY_PRODUCT_ID}/${productId}`;
        const data = await HTTP_GET(URL);

        if (data != null && data["status"] !== undefined) {
            if (data["status"] === "invalid") {
                toast.show({ description: "Oops! Something went wrong while fetching your details." });
            } else if (data["status"] === "error") {
                toast.show({ description: "Oops! Something went wrong while fetching your details. " });
            }
            setProductInfoLoading(false);


        } else {
            if (data != null) {
                setProductDetailInfo(data);
                // setProductDetailModal(true);
            }
        }
    }


    // const ProductList = ({ productList, openProductDetailModal, onProductUnitChange }) => {
    const renderProductItem = ({ item, index }) => {
        // const IMAGE_PATH = "https://example.com/images/";
        // const DEFAULT_PRODUCT_IMAGE = "https://example.com/default-image.png";
        return (
            <Pressable key={`${item?.productId}_${index}`} onPress={() => openProductDetailModal(item?.productId)}>
                <View>
                    <View style={item?.isProductValid ? styles.productContainer : styles.invalidProductContainer}>
                        {(item?.stock !== 0 && item?.stock > item?.minQuantityForOrder) && (
                            <>
                                <View style={styles.productItemWrapper}>
                                    <View style={styles.productImageWrapper}>
                                        {/* <Image
                                            style={styles.productImage}
                                            alt="product"
                                            resizeMode="contain"
                                            source={{
                                                uri: item?.productImages.length
                                                    ? `${IMAGE_PATH}${item?.productImages[0].documentPath}`
                                                    : DEFAULT_PRODUCT_IMAGE,
                                            }}
                                        /> */}
                                        <FastImage
                                            style={styles.productImage}
                                            alt="product"
                                            resizeMode={FastImage.resizeMode.contain}
                                            source={{
                                                uri: item?.productImages.length
                                                    ? `${IMAGE_PATH}${item?.productImages[0].documentPath}`
                                                    : DEFAULT_PRODUCT_IMAGE,
                                                priority: FastImage.priority.normal, // Optional: Set priority
                                            }}
                                        />
                                    </View>

                                    <View style={styles.productTitleWrapper}>
                                        <Text adjustsFontSizeToFit={true} style={styles.productTitle}>
                                            {item?.productName}
                                        </Text>
                                        <View style={{ display: 'flex', flexDirection: 'row', gap: 10, justifyContent: 'flex-start' }}>
                                            {item?.isDiscountActive === 'Y' ? (
                                                <View style={{ flexDirection: 'column' }}>
                                                    <Text adjustsFontSizeToFit={true}>Price/piece</Text>
                                                    <View style={{ flexDirection: 'row' }}>
                                                        <Text adjustsFontSizeToFit={true} style={styles.actualPrice}>
                                                            ₹ {item?.price}
                                                        </Text>
                                                        <Text adjustsFontSizeToFit={true} style={[styles.productPrice, { marginLeft: 5 }]}>
                                                            ₹ {parseFloat(item?.discountedPrice).toFixed(2)}
                                                        </Text>
                                                    </View>
                                                </View>
                                            ) : (
                                                <>
                                                    <Text adjustsFontSizeToFit={true}>Price/piece</Text>
                                                    <Text adjustsFontSizeToFit={true} style={styles.productPrice}>
                                                        ₹ {parseFloat(item?.price).toFixed(2)}
                                                    </Text>
                                                </>
                                            )}
                                        </View>
                                        {item?.minQuantityForOrder > 1 && (
                                            <Text adjustsFontSizeToFit={true} style={styles.minimumOrderText}>
                                                Minimum Order Quantity: {item?.minQuantityForOrder}
                                            </Text>
                                        )}
                                    </View>

                                    <View style={styles.productPriceWrapper}>
                                        <View style={{ display: 'flex', flexDirection: 'row', gap: 10, justifyContent: 'flex-end' }}>
                                            {item?.isDiscountActive === 'Y' ? (
                                                <Text adjustsFontSizeToFit={true} style={styles.productPrice}>
                                                    ₹ {(item?.discountedPrice * item?.unit * 12).toFixed(2)}
                                                </Text>
                                            ) : (
                                                <Text adjustsFontSizeToFit={true} style={styles.productPrice}>
                                                    ₹ {(item?.price * item?.unit * 12).toFixed(2)}
                                                </Text>
                                            )}
                                        </View>
                                        <View style={styles.qtyBtnWrapper}>
                                            <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center' }}>
                                                <Input
                                                    w="50%"
                                                    h="5%"
                                                    style={styles.qtyInput}
                                                    value={item?.unit}
                                                    onChangeText={(e) => onProductUnitChange(e, item, index)}
                                                    keyboardType="numeric"
                                                    size="xs"
                                                />
                                                <Text adjustsFontSizeToFit={true} style={styles.unit}>
                                                    Dozen
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            </>
                        )}

                        {
                            (item?.stock == 0 || item?.stock < item?.minQuantityForOrder) &&
                            <>
                                <View style={styles.productItemWrapper} key={[item?.productId, "_", index].join()}>
                                    <View style={styles.productImageWrapper}>
                                        {/* <Image style={styles.productImage} alt="product" source={{ uri: item?.productImages.length ? `${IMAGE_PATH}${item?.productImages[0].documentPath}` : DEFAULT_PRODUCT_IMAGE }} /> */}
                                        <FastImage
                                            style={styles.productImage}
                                            alt="product"
                                            resizeMode={FastImage.resizeMode.contain}
                                            source={{
                                                uri: item?.productImages.length
                                                    ? `${IMAGE_PATH}${item?.productImages[0].documentPath}`
                                                    : DEFAULT_PRODUCT_IMAGE,
                                                priority: FastImage.priority.normal, // Optional: Set priority
                                            }}
                                        />
                                    </View>

                                    <View style={styles.productTitleWrapper}>
                                        <Text adjustsFontSizeToFit={true} style={styles.productTitle}>{item?.productName}</Text>
                                        <View style={{ display: "flex", flexDirection: "row", gap: 10, justifyContent: "flex-start" }}>
                                            {
                                                item?.isDiscountActive == "Y" ?
                                                    (
                                                        <>
                                                            <Text adjustsFontSizeToFit={true} style={styles.actualPrice}>₹ {item?.price}</Text>
                                                            <Text adjustsFontSizeToFit={true} style={styles.productPrice}>₹ {item?.discountedPrice}</Text>
                                                        </>

                                                    ) :

                                                    (
                                                        <Text adjustsFontSizeToFit={true} style={styles.productPrice}>₹ {item?.price}</Text>
                                                    )
                                            }
                                        </View>
                                        <View>
                                            <Text adjustsFontSizeToFit={true} style={{ fontFamily: "Inter-Regular", fontSize: rMS(12), color: "red" }}>Out Of stock</Text>
                                        </View>
                                    </View>

                                    <View style={styles.productPriceWrapper}>
                                        <View style={{ display: "flex", flexDirection: "row", gap: 10, justifyContent: "flex-end" }}>
                                            {
                                                item?.isDiscountActive == "Y" ?
                                                    (
                                                        <>
                                                            <Text adjustsFontSizeToFit={true} style={styles.productPrice}>₹ {(item?.discountedPrice * item?.unit * 12).toFixed(2)}</Text>
                                                        </>

                                                    ) :

                                                    (
                                                        <Text adjustsFontSizeToFit={true} style={styles.productPrice}>₹ {(item?.price * item?.unit * 12).toFixed(2)}</Text>
                                                    )
                                            }
                                        </View>
                                        <View style={styles.qtyBtnWrapper}>
                                            <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center' }}>
                                                <Input isDisabled w="50%" h={hp("5%")} style={styles.qtyInput} keyboardType="numeric" size="xs" />
                                                <Text adjustsFontSizeToFit={true} style={styles.unit}>Dozen</Text>
                                            </View>
                                        </View>
                                    </View>

                                </View>
                            </>

                        }

                    </View>
                </View>
            </Pressable>
        );
    };
    // }


    return (

        <SafeAreaView style={{ flex: 1 }}>
            <View style={[styles.container, { paddingBottom: insets.bottom }]}>
                <View style={styles.bulkTitleWrapper}>
                    <View style={{ flexDirection: "row", alignItems: "center", width: "75%" }}>
                        <Pressable onPress={() => back()}>
                            <View style={styles.button}><Back width={40} height={40} /></View>
                        </Pressable>
                        <Text adjustsFontSizeToFit={true} style={styles.title}>Bulk Order</Text>
                    </View>
                    <View>
                        <Button size={"sm"} style={{ backgroundColor: "#B6974E" }} onPress={() => start()}>Start Tour</Button>
                    </View>
                </View>


                <View>
                    <ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
                        <View style={styles.categoryContainer}>
                            {
                                isCategoryLoading == true ?
                                    <View w={win.width - rMS(50)} display="flex" gap="3" flexDirection="row" alignItems="center" justifyContent="space-between">
                                        <Skeleton h="8" w="115" borderRadius="50" />
                                        <Skeleton h="8" w="115" borderRadius="50" />
                                        <Skeleton h="8" w="115" borderRadius="50" />
                                    </View>
                                    :

                                    <CopilotStep text="Choose a category by clicking on one." order={1} name="index1">
                                        <CategoryListComponent />
                                    </CopilotStep>

                                // categoryList.map((item) => <Pressable onPress={() => getSubCategoryList(item, true)} style={selectedCategory?.dropDownId == item?.dropDownId ? styles.ActiveCategory : styles.categoryItem} key={item?.dropDownId}><Text adjustsFontSizeToFit={true} style={selectedCategory?.dropDownId == item?.dropDownId ? styles.ActiveTextColor : styles.InActiveTextColor}>{item?.dropDrownValue}</Text></Pressable>)
                            }

                        </View>
                    </ScrollView>

                    <View style={styles.filterWrapper}>
                        <View style={{ flex: 7, marginRight: rMS(10) }}>
                            <View style={styles.searchWrapper}>
                                <Input size="xs" h="8" style={styles.searchInput} onChangeText={(e) => onSearch(e)} variant="unstyled" type="text" placeholder="Search anything..." InputLeftElement={<Search width={14} height={14} />} />
                            </View>
                        </View>

                        <View style={{ flex: 3 }}>
                            <CopilotStep text="Change subcategories from here" order={2} name="index2">
                                <ChooseSubCategory />
                            </CopilotStep>
                            {/* </Pressable> */}
                            <Actionsheet isOpen={isOpen} onClose={handleActionSheetClose}>
                                <Actionsheet.Content>
                                    <ScrollView horizontal="false" w="100%" textAlign="left">
                                        <Radio.Group name="subcategory" value={radioSubCategory?.dropDownId} onChange={nextValue => onSubCategorySelect(nextValue)}>
                                            {subCategoryList.map((item, index) =>
                                                <View key={[item?.dropDownId, "_", index].join()} style={{ textAlign: "left", width: "100%" }}>
                                                    <Actionsheet.Item>
                                                        <Radio shadow={2} value={item?.dropDownId} my="2" _checked={{ color: "#B6974E", borderColor: "#B6974E" }} _icon={{ color: "#B6974E" }}>
                                                            {item?.dropDrownValue}
                                                        </Radio>

                                                    </Actionsheet.Item>
                                                </View>

                                            )}

                                        </Radio.Group>
                                    </ScrollView>

                                    <View style={styles.filterButtons}>
                                        {/* <Button onPress={() => clearFilter()} style={styles.clearFilterBtn}><Text adjustsFontSizeToFit={true} style={{ color: '#17202A' }}>Clear Filter</Text></Button> */}
                                        <Button onPress={() => applyFilter()} style={styles.applyFilterBtn}>Apply Filter</Button>
                                    </View>
                                </Actionsheet.Content>
                            </Actionsheet>
                        </View>
                    </View>
                </View>


                {
                    isProductLoading == true
                        ?
                        (<View style={{ flexDirection: "column", gap: 10, marginVertical: rMS(10) }}>
                            <View style={{ backgroundColor: "#ffffff", borderRadius: 8 }}>
                                <Skeleton h="7" rounded="md" />
                            </View>
                        </View>)
                        :
                        (<View>
                            <View style={styles.subCategoryInfo}>
                                <View style={{ display: "flex", flexDirection: "row", justifyContent: "space-between" }}>
                                    <View style={{ borderWidth: 1, borderRadius: 4, borderColor: "#ABB2B9", padding: rMS(5), width: "30%" }}>
                                        <Text numberOfLines={1} style={styles.subCategoryLabel}>{selectedFilterSubCategories?.dropDrownValue}</Text>
                                    </View>

                                    <View style={{ borderWidth: 1, borderRadius: 4, borderColor: "#ABB2B9", padding: rMS(5) }}>
                                        <CopilotStep text="Check the required carton size and Enter quantity in Dozens." order={3} name="index3">
                                            <CopilotText>
                                                <Text style={styles.subCategoryLabel1}>1 Carton: {selectedFilterSubCategories?.cartonSize ? selectedFilterSubCategories?.cartonSize / 12 + " Dozen" : 0}</Text>
                                            </CopilotText>
                                        </CopilotStep>
                                    </View>
                                    <View style={{ borderWidth: 1, borderRadius: 4, borderColor: "#ABB2B9", padding: rMS(5) }}>
                                        <CopilotStep text="Validate total carton size" order={5} name="index5">
                                            <CopilotText>
                                                <Text style={styles.subCategoryLabel1}>Total Carton Size: {selectedFilterSubCategories?.currentCartonSize}</Text>
                                                {/* <Text style={styles.subCategoryLabel1}>Total Carton Size: {Math.floor(modifiedProductList.reduce((count, acc) => {
                                                    return count + +acc.unit;
                                                }, 0) / (+selectedFilterSubCategories?.cartonSize / 12))}</Text> */}
                                            </CopilotText>
                                        </CopilotStep>
                                    </View>

                                </View>
                            </View>
                        </View>)
                }




                {
                    isProductLoading == false && productList.length == 0 ? <View style={{ height: "48%", flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
                        <HStack space={2} justifyContent="center" flex={1}>
                            <Heading color="#B6974E" fontSize="md">
                                No products available
                            </Heading>
                        </HStack>
                    </View>

                        : null
                }

                <View style={[styles.productConatiner, { height: windowHeight - bottomTabBarHeight - insets.bottom - 150, paddingBottom: "25%" }]}>
                    {
                        isProductLoading == true ?
                            (<View style={{ flex: 1 }}>
                                {/* <View style={{ flexDirection: "column", gap: 10, marginVertical: rMS(10) }}>
                                    <View style={{ backgroundColor: "#ffffff", borderRadius: 8 }}>
                                        <Skeleton h="7" rounded="md" />
                                    </View>
                                </View> */}

                                {
                                    [1, 2, 3, 4].map(ele => {
                                        return (
                                            <View style={styles.loadingItem} key={ele}>
                                                <Skeleton.Text px="4" h={"24"} />
                                            </View>
                                        )
                                    })
                                }


                            </View>)
                            :

                            <>
                                {
                                    // isProductLoading == false && productList.length != 0 &&
                                    (<View style={{ flex: 1, paddingBottom: rMS(5) }}>
                                        {false && (<View>
                                            <View style={styles.subCategoryInfo}>
                                                <View style={{ display: "flex", flexDirection: "row", justifyContent: "space-between" }}>
                                                    <View style={{ borderWidth: 1, borderRadius: 4, borderColor: "#ABB2B9", padding: rMS(5), width: "30%" }}>
                                                        <Text numberOfLines={1} style={styles.subCategoryLabel}>{selectedFilterSubCategories?.dropDrownValue}</Text>
                                                    </View>

                                                    <View style={{ borderWidth: 1, borderRadius: 4, borderColor: "#ABB2B9", padding: rMS(5) }}>
                                                        <CopilotStep text="Check the required carton size." order={3} name="index3">
                                                            <CopilotText>
                                                                <Text style={styles.subCategoryLabel1}>1 Carton: {selectedFilterSubCategories?.cartonSize ? selectedFilterSubCategories?.cartonSize / 12 + " Dozen" : 0}</Text>
                                                            </CopilotText>
                                                        </CopilotStep>
                                                    </View>
                                                    <View style={{ borderWidth: 1, borderRadius: 4, borderColor: "#ABB2B9", padding: rMS(5) }}>
                                                        <CopilotStep text="Validate total carton size" order={5} name="index5">
                                                            <CopilotText>
                                                                <Text style={styles.subCategoryLabel1}>Total Carton Size: {selectedFilterSubCategories?.currentCartonSize}</Text>
                                                                {/* <Text style={styles.subCategoryLabel1}>Total Carton Size: {modifiedProductList.reduce((acc, count) => {
                                                                    console.log("acc", acc, count)
                                                                    return count + acc.cartonSize;
                                                                }, 0)}</Text> */}
                                                            </CopilotText>
                                                        </CopilotStep>
                                                    </View>

                                                </View>
                                            </View>
                                        </View>)}

                                        {
                                            isProductLoading == false && productList.length > 0 && (
                                                <KeyboardAwareScrollView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                                                    enableOnAndroid={true}
                                                    extraHeight={200} showsVerticalScrollIndicator={false}>
                                                    {/* <TouchableWithoutFeedback onPress={Keyboard.dismiss}> */}
                                                    <FlatList
                                                        data={productList}
                                                        keyExtractor={(item, index) => `${item?.productId}_${index}`}
                                                        renderItem={renderProductItem}
                                                        contentContainerStyle={{ paddingBottom: 100 }}
                                                        showsVerticalScrollIndicator={false}
                                                    />
                                                    {/* </TouchableWithoutFeedback> */}
                                                </KeyboardAwareScrollView>

                                            )
                                        }


                                        <View style={{ flex: 1 }}>
                                            <Actionsheet isOpen={isDiscountOpen} onClose={() => setIsDiscountOpen(false)}>
                                                <Actionsheet.Content h={win.height - rMS(150)}>
                                                    <ScrollView horizontal="false" showsVerticalScrollIndicator={false}>
                                                        <View style={{ paddingBottom: rMS(50) }}>
                                                            {
                                                                discountList.map((discountItem) => {
                                                                    return (
                                                                        <Box w={"100%"} key={discountItem?.discountId} style={{ display: "flex", flexDirection: "row", justifyContent: "center" }}>
                                                                            <View style={styles.discountWrapper}>
                                                                                <View style={styles.code}>
                                                                                    {
                                                                                        discountItem?.discountCategory == "Flat" ?
                                                                                            <Text adjustsFontSizeToFit={true} style={styles.flatLable}>₹{discountItem?.flatDiscountAmount} Off</Text>
                                                                                            :
                                                                                            <Text adjustsFontSizeToFit={true} style={styles.flatLable}>{discountItem?.discountInPer}% Off</Text>

                                                                                    }
                                                                                </View>
                                                                                <View style={styles.discountInfo}>
                                                                                    <View style={styles.codeWrapper}><Text adjustsFontSizeToFit={true} style={styles.codeLabel}>{discountItem?.couponDiscountCode}</Text></View>
                                                                                    <View><Text adjustsFontSizeToFit={true} style={styles.discountMessage}>{discountItem?.discountMessage}</Text></View>
                                                                                </View>
                                                                            </View>

                                                                        </Box>
                                                                    )
                                                                })
                                                            }

                                                        </View>


                                                    </ScrollView>
                                                </Actionsheet.Content>
                                            </Actionsheet>
                                        </View>
                                    </View>)

                                }
                            </>
                    }


                </View>



                <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
                    <Modal.Content maxWidth="400px">
                        <Modal.CloseButton />
                        <Modal.Header>
                            <Text adjustsFontSizeToFit={true} style={styles.modalHeader}>Warning: Carton Size and Product Quantity Mismatch

                            </Text></Modal.Header>
                        <Modal.Body>
                            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: rMS(10) }}>
                                {
                                    <Text adjustsFontSizeToFit={true} style={styles.phoneNumberLbl}
                                    >Please add {itemToaddAndRemove?.itemsToAdd} Dozen or remove {itemToaddAndRemove?.itemsToRemove} Dozen to match the required carton size</Text>

                                }


                            </View>
                        </Modal.Body>
                    </Modal.Content>
                </Modal>


                <Modal isOpen={productValidModal} onClose={() => setProductValidModal(false)}>
                    <Modal.Content maxWidth="400px">
                        <Modal.CloseButton />
                        <Modal.Header>
                            <Text adjustsFontSizeToFit={true} style={styles.modalHeader}>Warning: Product Quantity Not Valid

                            </Text></Modal.Header>
                        <Modal.Body>
                            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: rMS(10) }}>
                                {
                                    <Text adjustsFontSizeToFit={true} style={styles.phoneNumberLbl}
                                    >The quantity you have entered is not valid. Please enter a valid quantity.</Text>

                                }
                            </View>
                        </Modal.Body>
                    </Modal.Content>
                </Modal>

                {/* Product Detail Modal */}
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

            </View>

            <View style={[styles.navigationWrapper, { bottom: dynamicBottom }]}>
                <View style={{ flexDirection: "row", gap: 5, justifyContent: "space-between" }}>
                    <Pressable
                        onPress={() => backSubCategory()}
                        style={{
                            borderWidth: 1,
                            borderRadius: 6,
                            borderColor: "#B6974E",
                            width: "48%",
                            backgroundColor: "#fff",
                            paddingVertical: rMS(1),
                            paddingHorizontal: rMS(10),
                            alignItems: "center",
                            justifyContent: "center",
                            shadowColor: "#000",
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.2,
                            shadowRadius: 4,
                            elevation: 5,
                        }}
                    >
                        <Text
                            style={{
                                fontFamily: "Inter-Regular",
                                fontSize: rMS(12),
                                color: "grey",
                                textAlign: "center"
                            }}
                        >
                            Back
                        </Text>
                    </Pressable>

                    <Pressable
                        onPress={() => nextSubCategory()}
                        style={{
                            borderWidth: 1,
                            borderRadius: 6,
                            borderColor: "#B6974E",
                            width: "48%",
                            backgroundColor: "#fff",
                            paddingVertical: rMS(1),
                            paddingHorizontal: rMS(10),
                            alignItems: "center",
                            justifyContent: "center",
                            shadowColor: "#000",
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.2,
                            shadowRadius: 4,
                            elevation: 5,
                        }}
                    >
                        <Text style={{
                            fontFamily: "Inter-Regular",
                            fontSize: rMS(12),
                            color: "grey",
                            padding: rMS(5),
                            textAlign: "center"
                        }}>
                            Next
                        </Text>
                    </Pressable>
                </View>
            </View>

            {/* Price summary - positioned at bottom */}
            {
                (<View style={[styles.totalPriceWrapper]}>
                    <View style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                        <CopilotStep text="Review the total price and see all discounts." order={6} name="index6">
                            <CopilotView>
                                <View>
                                    <Text adjustsFontSizeToFit={true} style={styles.totalPrice}>₹ {(totalPrice).toFixed(2)}</Text>
                                    <Pressable onPress={() => setIsDiscountOpen(!isDiscountOpen)}>
                                        <Text adjustsFontSizeToFit={true} style={styles.viewDetails}>View all discounts</Text>
                                    </Pressable>
                                </View>
                            </CopilotView>
                        </CopilotStep>

                        <CopilotStep text="Click 'View Summary' to preview your order." order={7} name="index7">
                            <CopilotView>
                                <View style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                                    <Button style={styles.cartBtn} onPress={() => navigateToSummary()}>View Summary</Button>
                                </View>
                            </CopilotView>
                        </CopilotStep>
                    </View>
                </View>)
            }

            {
                isLoading && productList.length == 0 &&
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
        paddingVertical: "7%",
        position: "relative",
        // backgroundColor: "#FFFFFF"
    },
    bulkTitleWrapper: {
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between"
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
        backgroundColor: "#FFFFFF",
        borderRadius: 50,
        width: 40,
        height: 40,
        borderWidth: 1,
        borderStyle: "solid",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
    categoryContainer: {
        display: "flex",
        flexDirection: "row",
        gap: 15,
        marginTop: 15,
        width: "100%"
    },
    categoryItem: {
        backgroundColor: "#E5E8E8",
        borderRadius: 50,
        paddingHorizontal: 10,
        paddingVertical: 5
    },

    ActiveCategory: {
        backgroundColor: "#B6974E",
        borderRadius: 50,
        paddingHorizontal: 10,
        paddingVertical: 5
    },

    InActiveTextColor: {
        color: "#272727"
    },
    ActiveTextColor: {
        color: "#FFFFFF"
    },

    searchWrapper: {
        borderWidth: 1,
        borderColor: "#B6974F",
        borderRadius: 63,
        paddingHorizontal: 12,
        width: "100%"
    },
    searchInput: {
        fontSize: 13,
        borderWidth: 0,
        borderColor: "#FFFFFF",
        fontFamily: "Inter-Regular"
    },
    filterWrapper: {
        display: "flex",
        flexDirection: "row",
        // justifyContent: "space-between",
        width: "100%",
        alignItems: "center",
        marginTop: 15,
        // gap: rMS(10)
    },
    filterButtons: {
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        width: "100%",
        paddingHorizontal: 25,
        paddingBottom: 10
    },
    clearFilterBtn: {
        backgroundColor: '#E5E8E8',
        color: '#17202A',
        borderRadius: 100,
        paddingVertical: 12,
        paddingHorizontal: 48,
        display: 'flex',
        alignItems: 'center',
        marginTop: 10,
        fontSize: 16,
        fontFamily: "Inter-Regular"
    },
    applyFilterBtn: {
        backgroundColor: '#B6974F',
        color: '#FFFFFF',
        // borderRadius: 100,
        paddingVertical: 12,
        paddingHorizontal: 48,
        display: 'flex',
        alignItems: 'center',
        marginTop: 10,
        fontSize: 16,
        fontFamily: "Inter-Regular",
        width: "100%"
    },
    productWrapper: {
        marginTop: 10,
        // height: "70%"
    },

    productContainer: {
        backgroundColor: "#ffffff",
        marginBottom: "3%",
        borderRadius: 6
    },
    invalidProductContainer: {
        backgroundColor: "#ffffff",
        marginBottom: "3%",
        borderRadius: 6,
        borderWidth: 1,
        // borderColor: "red"
    },
    productItemWrapper: {
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        marginVertical: 5,
        width: "100%",
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        paddingHorizontal: 5,
        paddingVertical: 5
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

    productTitle: {
        fontSize: rMS(15),
        color: "#272727",
        fontFamily: "Inter-Regular"
    },
    productRating: {
        fontSize: 14,
        fontWeight: "700",
        fontFamily: "Inter-Regular"
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
        color: "#B6974E"
        // textDecorationLine: "underline"

    },
    actualPrice: {
        fontSize: rMS(13),
        fontWeight: "700",
        color: "grey",
        textAlign: "right",
        textDecorationLine: "line-through"
    },
    qtyBtnWrapper: {
        display: "flex",
        flexDirection: "row",
        justifyContent: "flex-end",
        alignItems: "center"
    },
    qtyBtn: {
        backgroundColor: '#FFFFFF',
        color: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: "center",

        fontSize: 12,
        width: 25,
        height: 25,
        borderRadius: 5,
        fontFamily: "Inter-Regular"
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
        fontSize: 12,
        opacity: 0.5,
        marginLeft: 5,
        // fontWeight: "700",
        fontFamily: "Inter-Regular"
    },
    // totalPriceWrapper: {
    //     width: "100%",
    //     // alignSelf: "stretch",
    //     height: 50,
    //     display: "flex",
    //     paddingTop: 5,
    //     position: "absolute",
    //     bottom: 0,
    //     backgroundColor: 'white',
    //     paddingHorizontal: rMS(10),
    //     marginTop: rMS(15)
    // },
    totalPrice: {
        color: "#B6974E",
        fontWeight: "700",
        fontSize: 20,
        textAlign: "left",
        fontFamily: "Inter-Regular"
    },
    rs: {
        color: "#B6974E",
        fontWeight: "700",
        fontSize: 16,
        fontFamily: "Inter-Regular"
    },
    amountBox: {
        borderRadius: 5,
        borderColor: "#B6974E",
        borderWidth: 1,
        paddingHorizontal: 10,
        paddingVertical: 5,
        marginLeft: 5
    },
    productConatiner: {
        height: hp("70%"),
        position: "relative",
    },
    qtyInput: {
        fontSize: 11,
        fontWeight: "700",
        textAlign: "center",
        fontFamily: "Inter-Regular"
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

    viewDetails: {
        color: "#B6974F",
        fontWeight: "700",
        fontSize: 16,
        fontFamily: "Inter-Regular"
    },
    subCategoryLabel: {
        fontSize: rMS(12),
        fontWeight: "700",
        color: "#B6974F",
        fontFamily: "Inter-Regular",
        textAlign: "center"
    },
    subCategoryLabel1: {
        fontSize: rMS(12),
        fontWeight: "700",
        color: "#B6974F",
        fontFamily: "Inter-Regular",
    },
    subCategoryInfo: {
        borderColor: "#ABB2B9",
        borderRadius: 6,
        paddingVertical: rMS(5),
        marginTop: rMS(5),
        fontFamily: "Inter-Regular"
    },
    discountWrapper: {
        display: "flex",
        flexDirection: "row",
        borderWidth: 1,
        borderStyle: "dashed",
        borderColor: "#B6974E",
        borderRadius: 6,
        // height: 150,
        width: "90%",
        overflow: "hidden",
        marginBottom: rMS(15)
    },
    code: {
        backgroundColor: "#808B96",
        // borderWidth: 1,
        // transform: [{ rotate: '-90deg' }],
        // paddingVertical: rMS(5),
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        width: "20%"
    },
    flatLable: {
        transform: [{ rotate: '-90deg' }],
        textAlign: "center",
        width: "100%",
        fontSize: rMS(14),
        color: "#FFFFFF",
        fontFamily: "Inter-Regular",
        fontWeight: "700"
    },
    codeLabel: {
        fontSize: rMS(16),
        color: "#FFFFFF",
        fontFamily: "Inter-Regular",
        fontWeight: "700",
        textAlign: "center"
    },
    discountMessage: {
        fontSize: rMS(14),
        color: "#212F3D",
        fontFamily: "Inter-Regular",
    },
    discountInfo: {
        paddingHorizontal: rMS(25),
        paddingVertical: rMS(15),
        display: "flex",
        flexDirection: "column",
        gap: 10,
        width: "80%"
    },
    codeWrapper: {
        backgroundColor: "#B6974E",
        width: "auto",
        borderRadius: 4,
        borderWidth: 1,
        borderStyle: "dashed",
        borderColor: "#FFFFFF",
        padding: rMS(5)
    },
    loadingItem: {
        // borderWidth: 1,
        // borderColor: "",
        backgroundColor: 'white',
        width: "100%",
        borderRadius: 10,
        paddingHorizontal: rMS(2),
        paddingVertical: rMS(10),
        marginBottom: rMS(10)
    },
    modalHeader: {
        fontFamily: "Inter-Regular",
        fontSize: rMS(14),
        fontWeight: "700",
        color: "#E74C3C",
        width: "80%"
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
    productTitle: {
        fontFamily: "Inter-Regular",
        fontSize: rMS(18),
        fontWeight: "700",
        color: "rgb(86, 101, 115)"
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
    navigationWrapper: {
        width: "100%",
        height: 50,
        display: "flex",
        paddingTop: 5,
        position: "absolute",
        backgroundColor: 'white',
        paddingHorizontal: rMS(10),
        marginTop: rMS(15)
    },

    totalPriceWrapper: {
        width: "100%",
        height: 60,
        display: "flex",
        paddingTop: 5,
        position: "absolute",
        bottom: 0,
        backgroundColor: 'white',
        paddingHorizontal: rMS(10),
        borderTopWidth: 1,
        borderTopColor: "#EFEFEF",
    },
})
export default BulkOrder;