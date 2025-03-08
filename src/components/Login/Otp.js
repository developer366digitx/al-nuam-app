import React, { useEffect, useRef, useState } from "react";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { HStack, IconButton, ScrollView, Spinner } from "native-base";
import Back from "../../../assets/back.svg";
import OtpImage from "../../../assets/otpimage.svg";
import { FormControl, Input, Button, useToast } from "native-base";
import { MOBILE_LOGIN, SEND_OTP, VERIFY_OTP } from "../../utils/constant";
import { HTTP_POST_OTP } from "../../utils/http-service";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { rMS } from "../../utils/responsive";
import {
    getHash,
    startOtpListener,
    useOtpVerify,
} from 'react-native-otp-verify';

const Otp = ({ route, navigation }) => {

    const [isLoading, setIsLoading] = useState(false);

    const [input1, setInput1] = useState("");
    const [input2, setInput2] = useState("");
    const [input3, setInput3] = useState("");
    const [input4, setInput4] = useState("");
    const [mobileNumber, setMobileNumber] = useState("");

    const inputRef1 = useRef(null);
    const inputRef2 = useRef(null);
    const inputRef3 = useRef(null);
    const inputRef4 = useRef(null);

    const toast = useToast();

    useEffect(() => {
        setMobileNumber(route.params.mobileNumber);
    }, [route.params.mobileNumber])

    // useEffect(() => {
    //     setMobileNumber("8605957929");
    // }, [])

    const backToLogin = () => {
        navigation.navigate("Login");
    }

    const onBackKeyPress = (nativeEvent, index) => {
        if (nativeEvent.key === 'Backspace') {

            if (index == 2 && input2.length == 0) {
                inputRef1.current.focus()
            }

            if (index == 3 && input3.length == 0) {
                inputRef2.current.focus()
            }

            if (index == 4 && input4.length == 0) {
                inputRef3.current.focus()
            }
        }
    }

    const onOTPChange = (e, index) => {
        if (index == 1) {
            if (e) {
                setInput1(e);
                inputRef2.current.focus()
            } else {
                setInput1("");
            }
        }
        if (index == 2) {
            if (e) {
                setInput2(e);
                inputRef3.current.focus()
            } else {
                setInput2("")
                inputRef1.current.focus()
            }
        }
        if (index == 3) {
            if (e) {
                setInput3(e);
                inputRef4.current.focus()
            } else {
                setInput3("");
                inputRef2.current.focus()
            }
        }
        if (index == 4) {
            if (e) {
                setInput4(e);
            } else {
                setInput4("");
                inputRef3.current.focus();
            }
        }

    }

    const onSubmit = async () => {
        setIsLoading(true);
        const OTP = `${input1}${input2}${input3}${input4}`;
        if (OTP.length !== 4) {
            toast.show({
                description: "Please enter valid OTP",
                duration: 5000
            })
        } else {
            const URL = `${MOBILE_LOGIN}`;
            const body = {
                "username": `${mobileNumber}`,
                "otp": +`${OTP}`
            }

            const data = await HTTP_POST_OTP(URL, body);
            if (data != null && data["status"] !== undefined) {
                if (data["status"] === "invalid") {
                    toast.show({ description: "Please enter valid OTP" });
                } else if (data["status"] === "error") {
                    toast.show({ description: "Something went wrong!!" });
                }

                setIsLoading(false);
            } else {

                await AsyncStorage.setItem("user", JSON.stringify(data));
                toast.show({
                    description: `Welcome !!!`,
                    duration: 5000
                });
                setIsLoading(false);
                navigation.navigate("Dashboard");

            }

        }
    }


    const resendOtp = async () => {
        const URL = `${SEND_OTP}`;
        const body = {
            "mobileExt": "+91",
            "mobileNumber": `${mobileNumber}`,
            "otpScreen": "LOGIN"
        }
        const data = await HTTP_POST_OTP(URL, body);
        if (data != null && data["status"] !== undefined) {
            if (data["status"] === "invalid") {
                toast.show({ description: "Oops! It seems you haven't registered yet." });
            } else if (data["status"] === "error") {
                toast.show({ description: "Something went wrong!!" });
            }
        } else {

            toast.show({
                description: `OTP send to +91${mobileNumber}`,
                duration: 5000
            });
        }


    }

    return (
        <SafeAreaView>
            <View style={styles.container}>
                <View>
                    <View style={styles.button}><Back width={40} height={40} onPress={() => backToLogin()} /></View>
                </View>
                <ScrollView horizontal={false} showsVerticalScrollIndicator={false}>
                    <View style={styles.imageWrapper}>
                        <OtpImage />
                    </View>
                    <View style={styles.enterOtpWrapper}>
                        <Text adjustsFontSizeToFit={true} style={styles.enterOTP}>Enter OTP</Text>
                        <Text adjustsFontSizeToFit={true} style={styles.label}>Enter OTP sent to <Text adjustsFontSizeToFit={true} style={styles.fontWeight700}>{route.params.ext} {mobileNumber}</Text></Text>
                    </View>
                    <View style={styles.inputWrapper}>

                        <View style={styles.otpInputWrapper}>
                            <FormControl w="14%">
                                <Input ref={inputRef1} keyboardType='numeric' value={input1} onChangeText={(e) => onOTPChange(e, 1)} style={styles.f18} maxLength={1} w="100%" type="text" />
                            </FormControl>

                            <FormControl w="14%">
                                <Input ref={inputRef2} keyboardType='numeric' value={input2} onChangeText={(e) => onOTPChange(e, 2)} onKeyPress={({ nativeEvent }) => {
                                    onBackKeyPress(nativeEvent, 2)
                                }} style={styles.f18} maxLength={1} w="100%" type="text" />
                            </FormControl>

                            <FormControl w="14%">
                                <Input ref={inputRef3} keyboardType='numeric' value={input3} onChangeText={(e) => onOTPChange(e, 3)} onKeyPress={({ nativeEvent }) => {
                                    onBackKeyPress(nativeEvent, 3)
                                }} style={styles.f18} maxLength={1} w="100%" type="text" />
                            </FormControl>

                            <FormControl w="14%">
                                <Input ref={inputRef4} keyboardType='numeric' value={input4} onChangeText={(e) => onOTPChange(e, 4)} onKeyPress={({ nativeEvent }) => {
                                    onBackKeyPress(nativeEvent, 4)
                                }} style={styles.f18} maxLength={1} w="100%" type="text" />
                            </FormControl>

                        </View>

                        <Pressable onPress={() => resendOtp()}>
                            <Text adjustsFontSizeToFit={true} style={styles.resend}>Resend OTP</Text>
                        </Pressable>

                        <Button style={styles.continueButton} onPress={() => onSubmit()}>
                            <HStack space={3}>
                                {
                                    isLoading &&
                                    <Spinner color="#ffffff" />
                                }
                                <Text adjustsFontSizeToFit={true} style={styles.continueBtnText}>Continue</Text>
                            </HStack>

                        </Button>
                    </View>
                </ScrollView>
            </View>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        padding: rMS(45)
    },

    f18: {
        fontSize: 18,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
    }
    ,
    button: {
        backgroundColor: "#F4F4F4",
        borderRadius: 50,
        width: 40,
        height: 40,
        borderWidth: 1,
        borderStyle: "solid",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
    },
    imageWrapper: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
    },
    enterOtpWrapper: {
        display: "flex",
        flexDirection: "column",
        gap: 5,
        marginTop: 20
    },

    enterOTP: {
        fontSize: 32,
        fontWeight: "700",
        color: "#272727",
        fontFamily: "Inter-Regular"
    },
    label: {
        fontSize: 16,
        fontWeight: "400",
        color: "#3A3A3A",
        fontFamily: "Inter-Regular"
    },
    fontWeight700: {
        fontWeight: "700"
    },
    inputWrapper: {
        display: "flex",
        flexDirection: "column",
        gap: 15,
        marginTop: 30
    },
    resend: {
        fontSize: 13,
        fontWeight: "500",
        color: "#8E8E8E",
        textAlign: "right",
        fontFamily: "Inter-Regular"
    },
    continueButton: {
        backgroundColor: '#B6974F',
        borderRadius: 100,
        paddingVertical: 12,
        paddingHorizontal: 48,
        display: 'flex',
        alignItems: 'center',
    },

    continueBtnText: {
        fontSize: 16,
        color: '#FFFFFF',
        fontFamily: "Inter-Regular"
    },

    otpInputWrapper: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexDirection: "row"
    }
});

export default Otp;