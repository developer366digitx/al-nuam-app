import { HStack, Text, View } from "native-base";
import React, { useEffect, useState } from "react";
import { Image, Pressable, SafeAreaView, StyleSheet } from "react-native";
import { rMS, rS, rVS } from "../../utils/responsive";
import { Dimensions } from 'react-native';
import RightProfile from "../../../assets/right-profile.svg";
// import profilePic from "../../../assets/images/profile-pic.png";
const profilePic = require("../../../assets/images/profile-pic.png")
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from "@react-navigation/native";
import { GET_LOGGEDIN_USER_DETAILS } from "../../utils/constant";
import { HTTP_GET } from "../../utils/http-service";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { BookUser, FileQuestion, Headset, ShoppingBasket } from 'lucide-react-native';
import { isAccountBack, setAccountBack } from "../../utils/helper";

const win = Dimensions.get('window');
const Account = ({ navigation }) => {

    const [userData, setUserData] = useState(null);

    const isScreenFocused = useIsFocused();

    useEffect(() => {
        if (isScreenFocused) {
            getUserData();
        }
        return () => { };
    }, [isScreenFocused])


    const getUserData = async () => {
        const user = await AsyncStorage.getItem("user");
        const URL = `${GET_LOGGEDIN_USER_DETAILS}/${JSON.parse(user).userName}`;
        const data = await HTTP_GET(URL);
        if (data != null && data["status"] !== undefined) {
            if (data["status"] === "invalid") {
                toast.show({ description: "Oops! Something went wrong while fetching your details." });
            } else if (data["status"] === "error") {
                toast.show({ description: "Oops! Something went wrong while fetching your details. " });
            }
            setIsLoading(false);
        } else {
            setUserData(data);
        }
    }

    const gotoEditProfile = () => {
        navigation.navigate("EditProfile");
    }

    const gotoAddress = () => {
        setAccountBack(true);
        navigation.navigate("Address");
    }

    const gotoOrder = () => {
        navigation.navigate("Order");
    }

    const navigateToSupport = () => {
        navigation.navigate("CustomerSupport");
    }

    const signOut = async () => {
        await AsyncStorage.removeItem("user");
        navigation.navigate("Login");
    }

    return (
        <SafeAreaView>
            <View style={styles.container}>
                <View style={styles.wrapper}>
                    <View style={styles.ImageWrapper}>
                        <Image style={styles.profileImage} alt="profile" source={profilePic} />
                    </View>

                    <View style={styles.profileInfo}>
                        <View style={{ display: "flex", gap: 5 }}>
                            <Text adjustsFontSizeToFit={true} style={styles.profileName}>{userData?.customerName ? userData?.customerName : 'Not Available'}</Text>
                            <Text adjustsFontSizeToFit={true} numberOfLines={1} style={styles.profileEmail}>{userData?.emailId ? userData?.emailId : 'Not Available'}</Text>
                            <Text adjustsFontSizeToFit={true} style={styles.profileEmail}>+91 {userData?.mobileNumber ? userData?.mobileNumber : 'Not Available'}</Text>
                            {
                                userData?.isCreditCustomer == "Y" &&
                                <Text adjustsFontSizeToFit={true} style={styles.profileEmail}>Credit Balance : ₹ {parseFloat(userData?.balCreditAmount).toFixed(2)}</Text>
                            }
                        </View>
                        <View>
                            <Pressable onPress={gotoEditProfile}><Text adjustsFontSizeToFit={true} style={styles.edit}>Edit</Text></Pressable>
                        </View>
                    </View>

                    <View>
                        <View style={{ display: "flex", justifyContent: "space-between", gap: 15 }}>
                            <Pressable onPress={gotoAddress}>
                                <HStack style={styles.hStack}>
                                    <View style={{ flexDirection: "row", alignItems: "center", gap: rMS(10) }}>
                                        <BookUser color="#566573" size={20} />
                                        <Text adjustsFontSizeToFit={true} style={styles.menuLabel}>Address</Text>
                                    </View>
                                    <RightProfile />
                                </HStack>
                            </Pressable>

                            {/* <Pressable>
                            <HStack style={styles.hStack}>
                                <Text adjustsFontSizeToFit={true} style={styles.menuLabel}>Wishlist</Text>
                                <RightProfile />
                            </HStack>
                        </Pressable> */}

                            <Pressable onPress={gotoOrder}>
                                <HStack style={styles.hStack}>
                                    <View style={{ flexDirection: "row", alignItems: "center", gap: rMS(10) }}>
                                        <ShoppingBasket color="#566573" size={20} />
                                        <Text adjustsFontSizeToFit={true} style={styles.menuLabel}>Orders</Text>
                                    </View>
                                    <RightProfile />
                                </HStack>
                            </Pressable>

                            {/* <Pressable>
                            <HStack style={styles.hStack}>
                                <View style={{ flexDirection: "row", alignItems: "center", gap: rMS(10) }}>
                                    <FileQuestion color="#566573" size={20} />
                                    <Text adjustsFontSizeToFit={true} style={styles.menuLabel}>Help</Text>
                                </View>
                                <RightProfile />
                            </HStack>
                        </Pressable> */}

                            <Pressable onPress={() => navigateToSupport()}>
                                <HStack style={styles.hStack}>
                                    <View style={{ flexDirection: "row", alignItems: "center", gap: rMS(10) }}>
                                        <Headset color="#566573" size={20} />
                                        <Text adjustsFontSizeToFit={true} style={styles.menuLabel}>Support</Text>
                                    </View>
                                    <RightProfile />
                                </HStack>
                            </Pressable>

                            <Pressable onPress={signOut}><Text adjustsFontSizeToFit={true} style={styles.signOut}>Sign Out</Text></Pressable>
                        </View>
                    </View>

                </View>
            </View>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        padding: rMS(45)
    },
    wrapper: {
        paddingTop: hp("1%"),
        // borderWidth: 1,
        height: rVS(win.height),
        gap: 30
    },
    profileImage: {
        width: rMS(100),
        height: rMS(100),
        borderRadius: 100
    },
    ImageWrapper: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
    },
    profileInfo: {
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        // width: rS(300),
        backgroundColor: "#EAECEE",
        borderRadius: 8,
        // borderWidth: 1,
        paddingHorizontal: rMS(10),
        paddingVertical: rMS(5)
    },
    profileName: {
        fontSize: rMS(16),
        fontWeight: "700",
        fontFamily: "Inter-Regular",
        color: "#272727"
    },
    profileEmail: {
        fontSize: rMS(16),
        // fontWeight: "700",
        fontFamily: "Inter-Regular",
        color: "#272727",
        opacity: 0.5,

    },
    edit: {
        fontSize: rMS(12),
        fontWeight: "700",
        fontFamily: "Inter-Regular",
        color: "#8E6CEF",
    },
    menuLabel: {
        fontSize: rMS(16),
        fontFamily: "Inter-Regular"
    },
    hStack: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderRadius: 8,
        backgroundColor: "#EAECEE",
        paddingHorizontal: rMS(10),
        paddingVertical: rMS(15)
    },
    signOut: {
        textAlign: "center",
        fontSize: rMS(16),
        fontWeight: "700",
        color: "#FA3636"
    }
})

export default Account;