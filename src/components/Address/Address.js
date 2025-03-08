import { HStack, ScrollView, Spinner, Text, View, useToast } from "native-base";
import React, { useEffect, useState } from "react";
import { Dimensions, Platform, Pressable, SafeAreaView, StyleSheet } from "react-native";
import { rMS, rVS } from "../../utils/responsive";
import Back from "../../../assets/back.svg";
import Add from "../../../assets/add.svg";
import { GET_ADDREES_LIST, GET_LOGGEDIN_USER_DETAILS } from "../../utils/constant";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused, useNavigation } from "@react-navigation/native";
import { HTTP_GET } from "../../utils/http-service";
import { getAccountBack, isAccountBack } from "../../utils/helper";

const win = Dimensions.get('window');

const Address = () => {

    const navigation = useNavigation();

    const [addressList, setAddressList] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const toast = useToast();
    const isScreenFocused = useIsFocused();

    useEffect(() => {
        if (isScreenFocused) {
            getAllAddress();
        }
    }, [isScreenFocused])

    const back = () => {
        if(getAccountBack()){
            navigation.navigate("Account");
        } else {
            navigation.navigate("Payment")
        }
    }

    const gotoAddNewAddress = () => {
        navigation.navigate("UpdateAddress", null);
    }


    const getAllAddress = async () => {
        const user = await AsyncStorage.getItem("user");
        const URL = `${GET_ADDREES_LIST}/${JSON.parse(user).customerId.customerId}`;
        const data = await HTTP_GET(URL);
        if (data != null && data["status"] !== undefined) {
            if (data["status"] === "invalid") {
                toast.show({ description: "Oops! Something went wrong while fetching your details." });
            } else if (data["status"] === "error") {
                toast.show({ description: "Oops! Something went wrong while fetching your details. " });
            }
            setIsLoading(false);
        } else {
            setAddressList(data);
            setIsLoading(false);
        }

    }

    const gotoEdit = (item) => {
        navigation.navigate("UpdateAddress", {
            addressData: item
        });
    }


    return (
        <SafeAreaView>
            <View style={styles.container}>
                <View style={styles.editProfileTitle}>
                    <View style={styles.button}><Back width={40} height={40} onPress={back} /></View>
                    <Text adjustsFontSizeToFit={true} style={styles.title}>Address</Text>
                </View>


                {
                    !isLoading && addressList.length == 0 &&
                    <View style={styles.noAddressWrapper}>
                        <Text adjustsFontSizeToFit={true} style={styles.noAddress}>Ready to add a new address? Let's get started!</Text>
                    </View>

                }

                {
                    (isLoading && addressList.length == 0) &&

                    <View style={styles.noAddressWrapper}>
                        {isLoading &&
                            <Spinner color="#B6974E" />}
                    </View>
                }

                {
                    (!isLoading && addressList.length !== 0) &&
                    <View style={styles.listWrapper}>
                        <ScrollView horizontal={false}>
                            {
                                addressList.map(item => {
                                    return (
                                        <View key={item?.addressId} style={styles.addressItem}>
                                            <View w="90%">
                                                <Text adjustsFontSizeToFit={true} style={styles.menuLabel} numberOfLines={4}>{item?.streetAddress}</Text>
                                                <Text adjustsFontSizeToFit={true} style={styles.menuLabel}>{item?.city}, {item?.state}</Text>
                                                <Text adjustsFontSizeToFit={true} style={styles.menuLabel}>{item?.zipCode}</Text>
                                                {
                                                    item?.isDefault == "Y" &&
                                                    <Text adjustsFontSizeToFit={true} style={styles.defaultLabel}>This is default addreess</Text>
                                                }
                                            </View>
                                            <Pressable onPress={() => gotoEdit(item)}>
                                                <Text adjustsFontSizeToFit={true} style={styles.editLabel}>Edit</Text>
                                            </Pressable>
                                        </View>
                                    )
                                })
                            }
                        </ScrollView>
                    </View>
                }

                <Pressable onPress={gotoAddNewAddress}>
                    <HStack style={styles.hStack}>
                        <Text adjustsFontSizeToFit={true} style={styles.noAddress}>Add</Text>
                        <Add />
                    </HStack>
                </Pressable>
            </View>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: "3%",
        paddingVertical: "5%",
        position: "relative",
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
    noAddress: {
        fontSize: rMS(16),
        fontFamily: "Inter-Regular",
        color: "#B6974E",

    },
    noAddressWrapper: {
        height: Platform.OS === 'ios'? win.height - rMS(250) : win.height - rMS(200),
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
    },
    hStack: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 5,
        borderRadius: 8,
        // backgroundColor: "#EAECEE",
        paddingHorizontal: rMS(10),
        paddingVertical: rMS(15)
    },
    listWrapper: {
        // borderWidth: 1,
        paddingTop: rMS(30),
        height: Platform.OS === 'ios'? win.height - rMS(230) : win.height - rMS(200)
    },
    addressItem: {
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderRadius: 8,
        backgroundColor: "#EAECEE",
        paddingHorizontal: rMS(10),
        paddingVertical: rMS(15),
        marginBottom: rMS(10)
    },
    menuLabel: {
        fontSize: rMS(16),
        fontFamily: "Inter-Regular",
        color: "#272727"
    },
    editLabel: {
        fontSize: rMS(18),
        fontFamily: "Inter-Regular",
        color: "#B6974E"
    },
    defaultLabel: {
        fontSize: rMS(14),
        fontFamily: "Inter-Regular",
        color: "#B6974E"
    }
});

export default Address;