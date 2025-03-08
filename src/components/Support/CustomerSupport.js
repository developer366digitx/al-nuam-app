import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import Back from "../../../assets/back.svg";
import { rMS } from '../../utils/responsive';
import CallSupport from "../../../assets/callsupport.svg";
import { Button, useToast } from 'native-base';
import CallSupportBtn from "../../../assets/callsupportbtn.svg";
import CallBtn from "../../../assets/callsupportbtn-1.svg";
import ChatSupport from "../../../assets/chatsupport.svg";
import { Linking } from 'react-native';
import { Modal } from "native-base";
import { GET_SUPPORT_NUMBERS } from '../../utils/constant';
import { HTTP_GET } from '../../utils/http-service';


const CustomerSupport = ({ navigation }) => {
    const [showModal, setShowModal] = useState(false);
    const [phoneNumbers, setPhoneNumbers] = useState([]);

    const toast = useToast();

    useEffect(() => {
        getSupportContact();
    }, []);

    const back = () => {
        navigation.navigate("Account");
    }

    const gotoChat = () => {
        navigation.navigate("ChatSupport");
    }

    const getSupportContact = async () => {
        const URL = `${GET_SUPPORT_NUMBERS}`;
        const data = await HTTP_GET(URL);
        if (data != null && data["status"] !== undefined) {
            if (data["status"] === "invalid") {
                toast.show({ description: "Oops! Something went wrong while fetching your details." });
            } else if (data["status"] === "error") {
                toast.show({ description: "Oops! Something went wrong while fetching your details. " });
            }
            setIsLoading(false);
        } else {
            setPhoneNumbers(data);
            setIsLoading(false);
        }

    }

    return (
        <SafeAreaView>
            <View style={styles.container}>
                <View style={styles.editProfileTitle}>
                    <View style={styles.button}><Back width={40} height={40} onPress={back} /></View>
                    <Text adjustsFontSizeToFit={true} style={styles.title}>Support</Text>
                </View>

                <View>
                    <View style={{ flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
                        <CallSupport />
                    </View>

                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                        <Button style={[styles.actionBtn]}>
                            <Pressable onPress={() => gotoChat()}>
                                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                                    <ChatSupport />
                                    <Text adjustsFontSizeToFit={true} style={styles.actionBtnLbl}>
                                        Chat Support
                                    </Text>
                                </View>
                            </Pressable>
                        </Button>

                        <Button style={[styles.actionBtn]}>
                            <Pressable onPress={() => setShowModal(true)}>
                                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                                    <CallSupportBtn />
                                    <Text adjustsFontSizeToFit={true} style={styles.actionBtnLbl}>
                                        Call Support
                                    </Text>
                                </View>
                            </Pressable>
                        </Button>
                    </View>

                    {/* <Pressable>
                    <Text adjustsFontSizeToFit={true} onPress={() => { Linking.openURL('tel:8605957929'); }} style={styles.funcNavText}>8605957929</Text>
                </Pressable> */}
                </View>


                <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
                    <Modal.Content maxWidth="400px">
                        <Modal.CloseButton />
                        <Modal.Header>
                            <Text adjustsFontSizeToFit={true} style={styles.modalHeader}>Contact Us</Text></Modal.Header>
                        <Modal.Body>
                            {
                                phoneNumbers.map((item) => {
                                    return (
                                        <View key={item} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: rMS(10) }}>
                                            <Text adjustsFontSizeToFit={true} style={styles.phoneNumberLbl}
                                            >{item}</Text>

                                            <Pressable onPress={() => { Linking.openURL(`tel:${item}`); }}>
                                                <View style={{ backgroundColor: "#EAECEE", borderRadius: 100, padding: rMS(10) }}>
                                                    <CallBtn />
                                                </View>
                                            </Pressable>
                                        </View>
                                    )
                                })
                            }
                        </Modal.Body>
                    </Modal.Content>
                </Modal>
            </View>
        </SafeAreaView>
    )
}

export default CustomerSupport

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
    actionBtn: {
        backgroundColor: "#B6974E",
        borderRadius: 8
    },
    actionBtnLbl: {
        fontFamily: "Inter-Regular",
        fontSize: rMS(18),
        color: "#ffffff",
        flexDirection: "row",
        alignItems: "center"
    },
    phoneNumberLbl: {
        fontFamily: "Inter-Regular",
        fontSize: rMS(18),
        color: "rgb(86, 101, 115)"
    },
    modalHeader: {
        fontFamily: "Inter-Regular",
        fontSize: rMS(18),
        fontWeight: "700",
        color: "#000000"
    }
})