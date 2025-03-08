import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import Back from "../../../assets/back.svg";
import { rMS } from '../../utils/responsive';
import { Box, Modal, ScrollView, Stack, useToast } from 'native-base';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NOTIFICATION, UPDATE_NOTIFICATION } from '../../utils/constant';
import { HTTP_GET, HTTP_POST } from '../../utils/http-service';
import NoNotification from "../../../assets/no-alarm.svg";

const Notification = ({ navigation }) => {

    const [showModal, setShowModal] = useState(false);
    const [selectedNotification, setSelectedNotification] = useState(null);
    const [notificationList, setNotificationList] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const toast = useToast();

    useEffect(() => {
        getAllNotification();
    }, [])

    const back = () => {
        navigation.navigate("Home");
    }

    const openNotification = (noti) => {
        updateNotification(noti)
        setSelectedNotification(noti);
        setShowModal(true);
    }


    const getAllNotification = async () => {
        setIsLoading(true);
        const user = await AsyncStorage.getItem("user");
        const URL = `${NOTIFICATION}/${JSON.parse(user).customerId.customerId}`;
        const data = await HTTP_GET(URL);
        if (data != null && data["status"] !== undefined) {
            if (data["status"] === "invalid") {
                toast.show({ description: "Oops! Something went wrong while fetching your details." });
            } else if (data["status"] === "error") {
                toast.show({ description: "Oops! Something went wrong while fetching your details. " });
            }
            setIsLoading(false);
        } else {
            let cust_id = JSON.parse(user).customerId.customerId;
            let notification_list = data.map(item => {
                item["readBy"] = item["readBy"] != null ? item["readBy"].split(",").length > 1 ? item["readBy"].split(",") : [item["readBy"]] : [];
                item["isRead"] = item["readBy"].includes(cust_id);
                return item;
            });
            setNotificationList(notification_list);
            setIsLoading(false);
        }

    }

    const updateNotification = async (notification) => {
        const URL = `${UPDATE_NOTIFICATION}`;
        const data = await HTTP_POST(URL, {
            notificationIds: [notification?.notificationId]
        });
        if (data != null && data["status"] !== undefined) {
            if (data["status"] === "invalid") {
                toast.show({ description: "Oops! Something went wrong while updating your details." });
            } else if (data["status"] === "error") {
                toast.show({ description: "Oops! Something went wrong while updating your details. " });
            }
            setIsLoading(false);
        } else {
            let cust_id = JSON.parse(user).customerId.customerId;
            setNotificationList(prevNotification => prevNotification["readBy"] = prevNotification["readBy"].push(cust_id));
            setIsLoading(false);
        }
    }

    return (
        <SafeAreaView>
            <View style={styles.container}>
                <View style={styles.editProfileTitle}>
                    <View style={styles.button}><Back width={40} height={40} onPress={back} /></View>
                    <Text adjustsFontSizeToFit={true} style={styles.title}>Notification</Text>
                </View>

                <View style={{ marginTop: rMS(10) }}>
                    {
                        notificationList.length == 0 && isLoading == false ?
                            (<View style={{ flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100%", gap: 15 }}>
                                <NoNotification />
                                <Text style={{
                                    fontFamily: "Inter-Regular",
                                    fontSize: rMS(16),
                                    color: "rgb(86, 101, 115)"
                                }}>No notification available</Text>
                            </View>) :
                            (<ScrollView horizontal={false} showsVerticalScrollIndicator={false}>
                                <View style={{ flexDirection: "column", gap: 10 }}>
                                    {
                                        notificationList.map((ele, index) => {
                                            return (
                                                <Pressable onPress={() => openNotification(ele)} key={`${ele?.notificationId}_${index}`}>
                                                    {/* <View style={{ paddingHorizontal: rMS(5), paddingVertical: rMS(10), flexDirection: "row", alignItems: "center", border: 1, borderWidth: 1, borderColor: "black", borderRadius: 6, backgroundColor: "red" }}>
                                                    <Text style={{ fontFamily: "Inter-Regular", fontSize: rMS(14), color: "black" }} numberOfLines={2}>
                                                        {ele?.message}
                                                    </Text>
                                                </View> */}
                                                    <Box alignItems="center">
                                                        <Box width={"full"} maxW="full" rounded="lg" overflow="hidden" borderColor="coolGray.200" borderWidth="1" _dark={{
                                                            borderColor: "coolGray.600",
                                                            backgroundColor: "gray.700"
                                                        }} _web={{
                                                            shadow: 2,
                                                            borderWidth: 0
                                                        }} _light={{
                                                            backgroundColor: "gray.50"
                                                        }}>
                                                            <Stack p="4" space={3}>

                                                                <Text style={{
                                                                    fontFamily: "Inter-Regular",
                                                                    fontSize: rMS(14),
                                                                    color: "rgb(86, 101, 115)"
                                                                }}>
                                                                    {ele?.message}
                                                                </Text>

                                                            </Stack>
                                                        </Box>
                                                    </Box>
                                                </Pressable>
                                            )
                                        })
                                    }
                                </View>
                            </ScrollView>)
                    }
                </View>


                <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
                    <Modal.Content maxWidth="400px">
                        <Modal.CloseButton />
                        <Modal.Header>
                            <Text adjustsFontSizeToFit={true} style={styles.modalHeader}>Notification</Text></Modal.Header>
                        <Modal.Body>
                            <Text style={{ fontFamily: "Inter-Regular", fontSize: rMS(14), color: "black" }}>{selectedNotification?.message}</Text>
                        </Modal.Body>
                    </Modal.Content>
                </Modal>
            </View>
        </SafeAreaView>
    )
}

export default Notification

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
    modalHeader: {
        fontFamily: "Inter-Regular",
        fontSize: rMS(18),
        fontWeight: "700",
        color: "#000000"
    }
})