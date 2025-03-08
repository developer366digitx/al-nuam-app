import { Button, Checkbox, FormControl, HStack, Input, Spinner, Text, View, WarningOutlineIcon, useToast } from "native-base";
import React, { useEffect, useState } from "react";
import { Dimensions, Platform, SafeAreaView, StyleSheet } from "react-native";
import { rMS } from "../../utils/responsive";
import Back from "../../../assets/back.svg";
import { useFormik } from "formik";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ADD_NEW_ADDRESS, GET_LOGGEDIN_USER_DETAILS, UPDATE_ADDRESS } from "../../utils/constant";
import { HTTP_GET, HTTP_POST } from "../../utils/http-service";
import { useIsFocused } from "@react-navigation/native";


const win = Dimensions.get('window');
const UpdateAddress = ({ route, navigation }) => {

    const [isLoading, setIsLoading] = useState(false);
    const [userData, setUserData] = useState(null);
    const [addressData, setAddressData] = useState(null);

    const isScreenFocused = useIsFocused();

    const toast = useToast();


    useEffect(() => {
        if (isScreenFocused) {
            setIsLoading(false);
            formik.resetForm();

            if (route.params) {
                const add_data = route.params.addressData;
                setAddressData(add_data);
                formik.setValues({
                    street: add_data?.streetAddress,
                    city: add_data?.city,
                    state: add_data?.state,
                    zip: add_data?.zipCode,
                    isDefault: add_data?.isDefault == "Y" ? true : false
                });


            } else {
                formik.setValues({
                    street: "",
                    city: "",
                    state: "",
                    zip: "",
                    isDefault: false
                });
                setAddressData(null);
            }
        }
    }, [isScreenFocused])

    const validate = (values) => {
        const errors = {};

        if (!values.street) {
            errors.street = "This field is required."
        }

        if (!values.city) {
            errors.city = "This field is required.";
        }

        if (!values.state) {
            errors.state = "This field is required.";
        }

        if (!values.zip) {
            errors.zip = "This field is required."
        } else if (values.zip.length !== 6) {
            errors.zip = "Please enter valid zip code"
        }

        return errors;
    }


    const formik = useFormik({
        initialValues: {
            street: addressData?.streetAddress ? addressData?.streetAddress : "",
            city: addressData?.city ? addressData?.city : "",
            state: addressData?.state ? addressData?.state : "",
            zip: addressData?.zipCode ? addressData?.zipCode : "",
            isDefault: addressData?.isDefault == "Y" ? true : false
        },
        // enableReinitialize: true,
        validate,
        onSubmit: values => {
            saveAddress();
        }
    })

    const back = () => {
        navigation.navigate("Address");
    }


    const saveAddress = async () => {
        const user = await AsyncStorage.getItem("user");
        setIsLoading(true);
        const URL = addressData == null ? `${ADD_NEW_ADDRESS}` : `${UPDATE_ADDRESS}`;
        let body = {};

        if (addressData == null) {
            body = {
                "customerId": JSON.parse(user).customerId.customerId,
                "streetAddress": formik.values.street,
                "city": formik.values.city,
                "state": formik.values.state,
                "zipCode": formik.values.zip,
                "isDefault": formik.values.isDefault ? "Y" : "N"
            }
        } else {
            body = {
                "addressId": addressData?.addressId,
                "streetAddress": formik.values.street,
                "city": formik.values.city,
                "state": formik.values.state,
                "zipCode": formik.values.zip,
                "isDefault": formik.values.isDefault ? "Y" : "N"
            }
        }

        const data = await HTTP_POST(URL, body);
        if (data != null && data["status"] !== undefined) {
            if (data["status"] === "invalid") {
                toast.show({ description: "Oops! Address couldn't be updated. Please try again." });
            } else if (data["status"] === "error") {
                toast.show({ description: "Oops! Address couldn't be updated. Please try again." });
            }
            setIsLoading(false);
        } else {
            formik.resetForm();
            toast.show({ description: "Success! Your new address is set." }, 5000);
            navigation.navigate("Address");
            setIsLoading(false);
        }
    }

    const onSetDefaultAddress = (e) => {
        formik.setFieldValue("isDefault", e)
    }

    return (
        <SafeAreaView>
            <View style={styles.container}>
                <View style={styles.editProfileTitle}>
                    <View style={styles.button}><Back width={40} height={40} onPress={back} /></View>
                    <Text adjustsFontSizeToFit={true} style={styles.title}>{addressData == null ? "Add Address" : "Update Address"}</Text>
                </View>

                <View style={styles.addressWrapper}>

                    <FormControl isInvalid={formik.touched.street && formik.errors.street} style={styles.form} isRequired>
                        <Input style={styles.f18} value={formik.values.street} onChangeText={e => formik.setFieldValue("street", e)} type="text" placeholder="Street Address" />
                        {
                            formik.touched.street && formik.errors.street &&
                            <FormControl.ErrorMessage leftIcon={<WarningOutlineIcon size="xs" />}>
                                <Text adjustsFontSizeToFit={true} style={styles.font_Manrope}>{formik.errors.street}</Text>
                            </FormControl.ErrorMessage>
                        }
                    </FormControl>


                    <FormControl isInvalid={formik.touched.city && formik.errors.city} style={styles.form} isRequired>
                        <Input style={styles.f18} value={formik.values.city} onChangeText={e => formik.setFieldValue("city", e)} type="text" placeholder="City" />
                        {
                            formik.touched.city && formik.errors.city &&
                            <FormControl.ErrorMessage leftIcon={<WarningOutlineIcon size="xs" />}>
                                <Text adjustsFontSizeToFit={true} style={styles.font_Manrope}>{formik.errors.city}</Text>
                            </FormControl.ErrorMessage>
                        }
                    </FormControl>

                    <View style={{ display: "flex", flexDirection: "row", gap: rMS(10) }}>
                        <FormControl w="50%" isInvalid={formik.touched.state && formik.errors.state} style={styles.form} isRequired>
                            <Input style={styles.f18} value={formik.values.state} onChangeText={e => formik.setFieldValue("state", e)} type="text" placeholder="State" />
                            {
                                formik.touched.state && formik.errors.state &&
                                <FormControl.ErrorMessage leftIcon={<WarningOutlineIcon size="xs" />}>
                                    <Text adjustsFontSizeToFit={true} style={styles.font_Manrope}>{formik.errors.state}</Text>
                                </FormControl.ErrorMessage>
                            }
                        </FormControl>

                        <FormControl w="50%" isInvalid={formik.touched.zip && formik.errors.zip} style={styles.form} isRequired>
                            <Input keyboardType="numeric" maxLength={6} style={styles.f18} value={formik.values.zip} onChangeText={e => formik.setFieldValue("zip", e)} type="text" placeholder="Zip Code" />
                            {
                                formik.touched.zip && formik.errors.zip &&
                                <FormControl.ErrorMessage leftIcon={<WarningOutlineIcon size="xs" />}>
                                    <Text adjustsFontSizeToFit={true} style={styles.font_Manrope}>{formik.errors.zip}</Text>
                                </FormControl.ErrorMessage>
                            }
                        </FormControl>
                    </View>
                    <Checkbox value="Y" accessibilityLabel="Y" defaultIsChecked={addressData?.isDefault == "Y" ? true : false} onChange={(e) => onSetDefaultAddress(e)} _icon={{ color: "#FFFFFF" }} _checked={{ bg: "#B6974E", borderColor: "#B6974E" }}>
                        Set as default address
                    </Checkbox>

                    {/* {
                    addressData?.isDefault == "Y" ?
                    <Checkbox value="All" accessibilityLabel="Y" defaultIsChecked onChange={(e) => onSetDefaultAddress(e)} _icon={{ color: "#FFFFFF" }} _checked={{ bg: "#B6974E", borderColor: "#B6974E" }}>
                    Set as default address
                    </Checkbox> :
                    <Checkbox value="All" accessibilityLabel="Y" onChange={(e) => onSetDefaultAddress(e)} _icon={{ color: "#FFFFFF" }} _checked={{ bg: "#B6974E", borderColor: "#B6974E" }}>
                    Set as default address
                    </Checkbox>
                    } */}
                </View>
                <Button style={styles.saveBtn} onPress={formik.handleSubmit}>
                    <HStack space={3}>
                        {
                            isLoading &&
                            <Spinner color="#ffffff" />
                        }
                        <Text adjustsFontSizeToFit={true} style={styles.continue}>Save</Text>
                    </HStack>
                </Button>

            </View>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: "3%",
        paddingVertical: "3%",
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
    addressWrapper: {
        display: "flex",
        flexDirection: "column",
        gap: rMS(20),
        paddingTop: rMS(50),
        height: Platform.OS === 'ios' ? win.height - rMS(250)  : win.height - rMS(210)
    },
    f18: {
        fontSize: rMS(18),
        fontFamily: "Inter-Regular"
    },
    font_Manrope: {
        fontFamily: "Inter-Regular"
    },
    form: {
        display: "flex",
        flexDirection: "column",
    },
    saveBtn: {
        backgroundColor: '#B6974F',
        color: '#FFFFFF',
        borderRadius: 100,
        paddingVertical: rMS(12),
        paddingHorizontal: rMS(48),
        display: 'flex',
        alignItems: 'center',
        flexDirection: "row",
        marginTop: rMS(10),

        fontSize: rMS(16),
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

export default UpdateAddress;