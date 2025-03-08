import { Button, Text, View } from "native-base";
import React from "react";
import { Dimensions, Pressable, SafeAreaView, StyleSheet } from "react-native";
import OrderPlacedImage from "../../../assets/orderplaced.svg";
import { rMS } from "../../utils/responsive";

const win = Dimensions.get('window');


const OrderPlaced = ({ navigation }) => {

    const gotoDashboard = () => {
        navigation.navigate("Home");
    }
    return (
        <SafeAreaView>
            <View style={styles.container}>
                <View style={styles.imageWrapper}>
                    <OrderPlacedImage />
                </View>

                <View style={styles.orderWrapper}>
                    <Text adjustsFontSizeToFit={true} style={styles.lbl}>Order Placed Successfully</Text>
                    <Pressable onPress={() => gotoDashboard()}>
                        <Text adjustsFontSizeToFit={true} style={styles.goto}>Go to Dashboard</Text>
                    </Pressable>
                </View>
            </View>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: "3%",
        paddingVertical: "5%",
        position: "relative"
    },
    imageWrapper: {
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingTop: rMS(150)
    },
    orderWrapper: {
        backgroundColor: "#D5D8DC",
        height: win.height,
        borderRadius: 12,
        // display: "flex",
        // flexDirection: "column",
        // justifyContent: "center",
        // alignItems: "center",
        paddingTop: rMS(150)
    },
    lbl: {
        fontSize: rMS(20),
        fontWeight: "700",
        height: "100",
        textAlign: "center",
        fontFamily: "Inter-Regular"
    },
    goto: {
        fontSize: rMS(16),
        color: "#B6974E",
        fontWeight: "700",
        height: "100",
        textAlign: "center",
        marginTop: rMS(20),
        fontFamily: "Inter-Regular"
    }
})

export default OrderPlaced;