import { Button, FormControl, HStack, Input, Spinner, Text, View, WarningOutlineIcon, useToast } from "native-base";
import React, { useEffect, useState } from "react";
import { SafeAreaView, StyleSheet } from "react-native";
import Back from "../../../assets/back.svg";
import { rMS } from "../../utils/responsive";
import { useFormik } from "formik";
import { GET_LOGGEDIN_USER_DETAILS, REGISTER_USER, UPDATE_USER } from "../../utils/constant";
import { HTTP_GET, HTTP_POST } from "../../utils/http-service";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { validateEmail, validateGST, validateMobile, validatePAN } from "../../utils/validation";
import { useIsFocused } from "@react-navigation/native";

const EditProfile = ({ navigation }) => {

    const toast = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [userData, setUserData] = useState(null);
    const isScreenFocused = useIsFocused();

    useEffect(() => {
        if (isScreenFocused) {
            getUserProfileDetails();
        }
        return () => { };
    }, [isScreenFocused]);


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

        if (!values.gst) {
            errors.gst = "Please enter valid GST number";
        } else if (!validateGST(values.gst)) {
            errors.gst = "Please enter valid GST number";
        }

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
            updateData();
        }
    });


    const getUserProfileDetails = async () => {
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
            // bind form values here
            setUserData(data);
            formik.setValues({
                name: data?.customerName,
                email: data?.emailId,
                gst: data?.gstNumber,
                pan: data?.panNumber,
                mobile: data?.mobileNumber
            });
        }
    }

    const updateData = async () => {
        setIsLoading(true);
        const URL = `${UPDATE_USER}`;

        const body = {
            customerId: userData?.customerId,
            "customerName": formik.values.name,
            "emailId": formik.values.email,
            "gstNumber": formik.values.gst,
            "panNumber": formik.values.pan,
            "mobileExt": userData?.mobileExt,
            "mobileNumber": userData?.mobileNumber
        }

        const data = await HTTP_POST(URL, body);

        if (data != null && data["status"] !== undefined) {
            if (data["status"] === "invalid") {
                toast.show({ description: "Registration failed! Hang tight, we're onto it." });
            } else if (data["status"] === "error") {
                toast.show({ description: "Something went wrong!!" });
            }
            setIsLoading(false);
        } else {
            toast.show({
                description: `Profile Updated Successfully !!!`,
                duration: 5000
            });
            setIsLoading(false);
        }
    }

    const back = () => {
        navigation.navigate("Account");
    }

    return (
        <SafeAreaView>
            <View style={styles.container}>
                <View style={styles.editProfileTitle}>
                    <View style={styles.button}><Back width={40} height={40} onPress={back} /></View>
                    <Text adjustsFontSizeToFit={true} style={styles.title}>Edit Profile</Text>
                </View>

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
                                <Text adjustsFontSizeToFit={true} autoCapitalize="characters" style={styles.font_Manrope}>{formik.errors.gst}</Text>
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
                        <Input readOnly keyboardType="numeric" value={formik.values.mobile} maxLength={10} style={styles.f18} onChangeText={(e) => formik.setFieldValue("mobile", e)} type="text" placeholder="Mobile Number" InputLeftElement={<Text adjustsFontSizeToFit={true} style={styles.countryCode}>+91 |</Text>} />
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
                    </View>

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
    f18: {
        fontSize: rMS(18),
        fontFamily: "Inter-Regular"
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
});

export default EditProfile;