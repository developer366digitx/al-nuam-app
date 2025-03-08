import { Image, SafeAreaView, StyleSheet, Text, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import Back from "../../../assets/back.svg";
import { GET_PRODUCT_BY_PRODUCT_ID, IMAGE_PATH } from '../../utils/constant';
import { HTTP_GET } from '../../utils/http-service';
import { rMS } from '../../utils/responsive';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { ScrollView } from 'native-base';
import Star from "../../../assets/star.svg";
import NoImage from "../../../assets/images/No-Image-Placeholder.png";
import { SliderBox } from "react-native-image-slider-box";

const ProductDetail = ({ route, navigation }) => {

    const [productData, setProductData] = useState({
        images: [{}]
    });
    const [productId, setProductId] = useState(route.params ? route.params.productId : 0);

    const NO_IMAGE = Image.resolveAssetSource(NoImage).uri;

    useEffect(() => {
        getProductInfoByProductId();
    }, []);

    const back = () => {
        navigation.navigate("Dashboard", { screen: "Home" });
    }

    const getProductInfoByProductId = async () => {
        const URL = `${GET_PRODUCT_BY_PRODUCT_ID}/${productId}`;
        const data = await HTTP_GET(URL);

        if (data != null && data["status"] !== undefined) {
            if (data["status"] === "invalid") {
                toast.show({ description: "Oops! Something went wrong while fetching your details." });
            } else if (data["status"] === "error") {
                toast.show({ description: "Oops! Something went wrong while fetching your details. " });
            }
            setIsLoading(false);

        } else {
            setProductData(data);
        }
    }

    return (
        <SafeAreaView>
            <View>
                <View style={styles.container}>
                    <View style={styles.editProfileTitle}>
                        <View style={styles.button}><Back width={40} height={40} onPress={back} /></View>
                        <Text adjustsFontSizeToFit={true} style={styles.title}>Product Detail</Text>
                    </View>
                </View>

                <View>
                    <View style={{ width: wp("100%"), height: hp("30%") }}>


                        {
                            (productData != null && productData?.images.length) ?
                                <SliderBox images={productData?.images.map(ele => `${IMAGE_PATH}${ele.documentPath}`)} dotColor="#B6974E" inactieDotColor="black"
                                    ImageComponentStyle={{ objectFit: "contain" }} imageLoadingColor="#B6974E"
                                /> :
                                <Image style={{ width: "100%", height: "100%", objectFit: "contain" }} resizeMode="contain" source={{
                                    uri: NO_IMAGE
                                }} />
                        }


                    </View>

                    {
                        productData != null &&
                        <View style={styles.productInfoWrapper}>
                            <ScrollView horizontal={false} showsVerticalScrollIndicator={false}>
                                <View style={{ flexDirection: "column", gap: 20 }}>
                                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                                        <Text style={[styles.productTitle, { width: "60%" }]} numberOfLines={2}>{productData?.productName}</Text>
                                        <View style={{ flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
                                            <Text adjustsFontSizeToFit={true} style={{ color: "#B6974E", fontFamily: "Inter-Regular" }}>Price</Text>
                                            <Text adjustsFontSizeToFit={true} style={styles.productTitle}>₹ {productData?.isDiscountActive == "Y" ? parseFloat(productData?.discountedPrice).toFixed(2) : parseFloat(productData?.price).toFixed(2)}</Text>
                                        </View>
                                    </View>

                                    <View style={{ flexDirection: "row", gap: 10 }}>
                                        <Star />
                                        <Text adjustsFontSizeToFit={true} style={styles.ratingLbl}>{productData?.rating}</Text>
                                    </View>

                                    {
                                        productData?.description &&
                                        <View>
                                            <Text adjustsFontSizeToFit={true} style={styles.descriptionLbl}>{productData?.description}</Text>
                                        </View>
                                    }

                                    <View>
                                        <Text adjustsFontSizeToFit={true} style={styles.productTitle}>Product Detail</Text>

                                        <View style={{ flexDirection: "column", gap: 10, marginTop: rMS(10) }}>

                                            {
                                                productData?.categoryName &&
                                                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                                                    <Text adjustsFontSizeToFit={true} style={styles.lbl}>Category</Text>
                                                    <Text adjustsFontSizeToFit={true} style={styles.vallbl}>{productData?.categoryName}</Text>
                                                </View>
                                            }

                                            {
                                                productData?.subCategoryName &&
                                                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                                                    <Text adjustsFontSizeToFit={true} style={styles.lbl}>Sub Category</Text>
                                                    <Text adjustsFontSizeToFit={true} style={[styles.vallbl]} numberOfLines={2}>{productData?.subCategoryName}</Text>
                                                </View>
                                            }

                                            {
                                                // productData?.stockQuantity &&
                                                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                                                    <Text adjustsFontSizeToFit={true} style={styles.lbl}>Stock</Text>
                                                    <Text adjustsFontSizeToFit={true} style={styles.vallbl}>{productData?.stockQuantity} Piece</Text>
                                                </View>
                                            }
                                        </View>

                                    </View>
                                </View>
                            </ScrollView>
                        </View>
                    }
                </View>

            </View>
        </SafeAreaView>
    )
}

export default ProductDetail

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: "3%",
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
    productInfoWrapper: {
        height: hp("55%"),
        borderTopLeftRadius: rMS(20),
        borderTopRightRadius: rMS(20),
        marginTop: "-5%",
        paddingTop: rMS(30),
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
    }
})