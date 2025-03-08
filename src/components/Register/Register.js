import React, { useState } from "react";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";
import Back from "../../../assets/back.svg";
import { FormControl, Input, Button, WarningOutlineIcon, useToast, HStack, Spinner, ScrollView } from "native-base";
import GoogleLogo from "../../../assets/google.svg";
import { useFocusEffect } from '@react-navigation/native';
import Check from "../../../assets/check.svg";
import { rMS, rVS } from "../../utils/responsive";
import { useFormik } from "formik";
import { validateEmail, validateGST, validateMobile, validatePAN } from "../../utils/validation";
import { REGISTER_USER, SEND_OTP } from "../../utils/constant";
import { HTTP_POST, HTTP_POST_OTP } from "../../utils/http-service";

const Register = ({ navigation }) => {

    const toast = useToast();
    const [isLoading, setIsLoading] = useState(false);


    const validate = (values) => {
        const errors = {};
        if (!values.name) {
            errors.name = "Please enter Company or Person name";
        }

        if (!values.email) {
            errors.email = "Please enter valid email";
        } else if (!validateEmail(values.email)) {
            errors.email = "Please enter valid email";
        }

        // if (!values.gst) {
        //     errors.gst = "Please enter valid GST number";
        // } else if (!validateGST(values.gst)) {
        //     errors.gst = "Please enter valid GST number";
        // }

        if (!values.pan) {
            errors.pan = "Please enter valid PAN number";
        } else if (!validatePAN(values.pan)) {
            errors.pan = "Please enter valid PAN number";
        }

        if (!values.mobile) {
            errors.mobile = "Please enter valid mobile number";
        } else if (!validateMobile(values.mobile)) {
            errors.mobile = "Please enter valid mobile number";
        }

        return errors;
    }

    const formik = useFormik({
        initialValues: {
            name: "",
            email: "",
            gst: "",
            pan: "",
            mobile: ""
        },
        validate,
        onSubmit: values => {
            sendOTP(values);
        }
    });



    useFocusEffect(
        React.useCallback(() => {
        }, [])
    )

    const navigateToLogin = () => {
        navigation.navigate("Login");
    }

    const navigateToVerifyOtp = () => {
        navigation.navigate("VerifyOtp");
    }

    const sendOTP = async (values) => {
        setIsLoading(true);
        try {
            const URL = `${SEND_OTP}`;
            const body = {
                "mobileExt": "+91",
                "mobileNumber": formik.values.mobile,
            }

            const data = await HTTP_POST_OTP(URL, body);
            if (data != null && data["status"] !== undefined) {
                if (data["status"] === "invalid") {
                    toast.show({ description: "Oops! OTP delivery failed. Please try again." });
                } else if (data["status"] === "error") {
                    toast.show({ description: "Something went wrong!!" });
                }
                setIsLoading(false);
            } else {

                toast.show({
                    description: `OTP send to +91${formik.values.mobile}`,
                    duration: 5000
                });

                navigation.navigate("VerifyOtp", {
                    customerName: formik.values.name,
                    emailId: formik.values.email,
                    gstNumber: formik.values.gst,
                    panNumber: formik.values.pan,
                    mobileExt: "+91",
                    mobileNumber: formik.values.mobile
                });

                setIsLoading(false);

            }

        } catch (error) {
            setIsLoading(false);
        }


    }


    return (
        <SafeAreaView>
            <View style={styles.container}>
                <View>
                    <View style={styles.button}><Back width={40} height={40} onPress={() => navigateToLogin()} /></View>
                </View>
                <Text adjustsFontSizeToFit={true} style={styles.createAccount}>Create Account</Text>

                <ScrollView horizontal={false} showsVerticalScrollIndicator={false}>
                    <View style={styles.formWrapper}>

                        <FormControl isInvalid={formik.touched.name && formik.errors.name} style={styles.form} isRequired>
                            <Input style={styles.f18} value={formik.values.name} onChangeText={e => formik.setFieldValue("name", e)} type="text" placeholder="Company Name Or Person Name" />
                            {
                                formik.touched.name && formik.errors.name &&
                                <FormControl.ErrorMessage leftIcon={<WarningOutlineIcon size="xs" />}>
                                    <Text adjustsFontSizeToFit={true} style={styles.font_Manrope}>{formik.errors.name}</Text>
                                </FormControl.ErrorMessage>
                            }


                        </FormControl>

                        <FormControl isInvalid={formik.touched.email && formik.errors.email} style={styles.form} isRequired>
                            <Input style={styles.f18} value={formik.values.email} onChangeText={(e) => formik.setFieldValue("email", e)} type="text" placeholder="Email Address" />
                            {
                                formik.touched.email && formik.errors.email &&
                                <FormControl.ErrorMessage leftIcon={<WarningOutlineIcon size="xs" />}>
                                    <Text adjustsFontSizeToFit={true} style={styles.font_Manrope}>{formik.errors.email}</Text>
                                </FormControl.ErrorMessage>
                            }
                        </FormControl>

                        <FormControl isInvalid={formik.touched.gst && formik.errors.gst} style={styles.form} isRequired>
                            <Input style={styles.f18} value={formik.values.gst} autoCapitalize="characters" onChangeText={(e) => formik.setFieldValue("gst", e.toUpperCase())} type="text" placeholder="GST Number" />
                            {
                                formik.touched.gst && formik.errors.gst &&
                                <FormControl.ErrorMessage leftIcon={<WarningOutlineIcon size="xs" />}>
                                    <Text adjustsFontSizeToFit={true} style={styles.font_Manrope}>{formik.errors.gst}</Text>
                                </FormControl.ErrorMessage>
                            }
                        </FormControl>

                        <FormControl isInvalid={formik.touched.pan && formik.errors.pan} style={styles.form} isRequired>
                            <Input style={styles.f18} value={formik.values.pan} autoCapitalize="characters" onChangeText={(e) => formik.setFieldValue("pan", e.toUpperCase())} type="text" placeholder="PAN Number" />
                            {
                                formik.touched.pan && formik.errors.pan &&
                                <FormControl.ErrorMessage leftIcon={<WarningOutlineIcon size="xs" />}>
                                    <Text adjustsFontSizeToFit={true} style={styles.font_Manrope}>{formik.errors.pan}</Text>
                                </FormControl.ErrorMessage>
                            }
                        </FormControl>


                        <FormControl isInvalid={formik.touched.mobile && formik.errors.mobile} style={styles.form} isRequired>
                            <Input keyboardType="numeric" value={formik.values.mobile} maxLength={10} style={styles.f18} onChangeText={(e) => formik.setFieldValue("mobile", e)} type="text" placeholder="Mobile Number" InputLeftElement={<Text adjustsFontSizeToFit={true} style={styles.countryCode}>+91 |</Text>} />
                            {
                                formik.touched.mobile && formik.errors.mobile &&
                                <FormControl.ErrorMessage leftIcon={<WarningOutlineIcon size="xs" />}>
                                    <Text adjustsFontSizeToFit={true} style={styles.font_Manrope}>{formik.errors.mobile}</Text>
                                </FormControl.ErrorMessage>
                            }
                        </FormControl>

                        <View>
                            <Button style={styles.continueButton} onPress={formik.handleSubmit}>
                                <HStack space={3}>
                                    {
                                        isLoading &&
                                        <Spinner color="#ffffff" />
                                    }
                                    <Text adjustsFontSizeToFit={true} style={styles.continue}>Continue</Text>
                                </HStack>
                            </Button>
                            <Text adjustsFontSizeToFit={true} style={styles.register}>
                                Already Registered <Text adjustsFontSizeToFit={true} style={styles.bold} onPress={() => navigateToLogin()}>Sign In</Text>
                            </Text>
                        </View>

                        {/* <View style={styles.googleContainer}>
                    <View style={styles.googleWrapper}>
                        <GoogleLogo width={24} height={24} />
                        <Text adjustsFontSizeToFit={true} style={styles.continueWithGoogle}>Continue with Google</Text>
                    </View>
                </View> */}
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
    createAccount: {
        fontSize: rMS(32),
        fontWeight: "700",
        color: "#272727",
        marginTop: rMS(20),
        fontFamily: "Inter-Regular"
    },
    formWrapper: {
        marginTop: rMS(50),
        gap: rMS(20)
    },
    form: {
        display: "flex",
        flexDirection: "column",
    },
    continueButton: {
        backgroundColor: '#B6974F',
        color: '#FFFFFF',
        borderRadius: 100,
        paddingVertical: rMS(12),
        paddingHorizontal: rMS(48),
        display: 'flex',
        alignItems: 'center',

        fontSize: rMS(16),
        fontFamily: "Inter-Regular"
    },
    register: {
        color: '#000000',
        marginTop: rMS(10),
    },

    bold: {
        fontWeight: '700',
    },
    googleContainer: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
    f18: {
        fontSize: rMS(18),
        fontFamily: "Inter-Regular"
    },

    googleWrapper: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        gap: rMS(15),
        marginTop: rMS(30),
        borderWidth: 1,
        borderRadius: 100,
        borderColor: "#D2D2D2",
        paddingHorizontal: rMS(20),
        paddingVertical: rMS(10),
        width: "80%"
    },

    continueWithGoogle: {
        fontSize: rMS(16),
        color: "#000000",
        fontWeight: "500",
        fontFamily: "Inter-Regular"
    },
    verfiy: {
        fontSize: rMS(15),
        fontWeight: "600",
        color: "#7A7A7A",
        display: "flex",
        gap: rMS(10),
        paddingRight: rMS(10),
        alignItems: "center",
        fontFamily: "Manrope-Bold"

    },
    font_Manrope: {
        fontFamily: "Inter-Regular"
    },
    countryCode: {
        fontSize: rMS(18),
        fontWeight: '300',
        color: '#27272780',
        paddingLeft: rMS(7),
        fontFamily: "Inter-Regular",
    },
    continue: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 3,
        flexDirection: "row",
        color: '#FFFFFF',
        fontFamily: "Inter-Regular"
    },
})

export default Register;