import React, { useState } from "react";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";
import Logo from "../../../assets/logo.svg";
import { useFocusEffect } from '@react-navigation/native';
import { GET_DROPDOWN_DATA } from "../../utils/constant";
import { HTTP_POST } from "../../utils/http-service";
import { HStack, Spinner } from "native-base";
import { rMS } from "../../utils/responsive";


const Welcome = ({ navigation }) => {

    const [isLoading, setIsLoading] = useState(true);

    useFocusEffect(
        React.useCallback(() => {
            checkUserTokenExpired();
        }, [])
    )

    const checkUserTokenExpired = async () => {
        setIsLoading(true);
        const URL = `${GET_DROPDOWN_DATA}`;
        const data = await HTTP_POST(URL, {});
        if (data != null && data["status"] !== undefined) {
            if (data["status"] === "invalid") {
                navigation.navigate("Login");
            } else if (data["status"] === "error") {

            }
            setIsLoading(false);
        } else {
            navigation.navigate("Dashboard");
            setIsLoading(false);

        }
    }



    return (
        <SafeAreaView>
            <View style={styles.container}>
                <Logo width={"70%"} height={"40%"} />
                {
                    isLoading &&
                    <View>
                        <HStack space={3}>
                            <Text adjustsFontSizeToFit={true} style={{ fontFamily: "Inter-Regular", fontSize: rMS(16), color: "rgb(86, 101, 115)" }}>Loading, Please stand by</Text>
                            {
                                isLoading &&
                                <Spinner color="#B6974F" />
                            }

                        </HStack>
                    </View>
                }
            </View>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        display: "flex",
        alignItems: "center",
        justifyContent: 'center',
        height: "100%"
    }
});

export default Welcome;