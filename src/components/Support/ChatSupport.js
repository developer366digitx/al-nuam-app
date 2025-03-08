import { KeyboardAvoidingView, Pressable, StyleSheet, Text, View } from 'react-native'
import React, { useEffect, useId, useState } from 'react'
import Back from "../../../assets/back.svg";
import { rMS } from '../../utils/responsive';
import { Button, FlatList, HStack, Input, ScrollView, Spinner, useToast } from 'native-base';
import { TypingAnimation } from 'react-native-typing-animation';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { SafeAreaView } from 'react-native-safe-area-context';
import uuid from 'react-native-uuid';
import SendIcon from "../../../assets/send_fill.svg";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GET_ORDER, SAVE_SUPPORT_TICKET } from '../../utils/constant';
import { HTTP_POST } from '../../utils/http-service';
import { getCustomerId } from '../../utils/helper';


const ChatSupport = ({ navigation }) => {

    const [messageList, setMessageList] = useState([]);
    const [isBotTyping, setIsBotTyping] = useState(false);
    const [userMessage, setUserMessage] = useState("");
    const [isInputHide, setIsInputHide] = useState(false);
    const [isOrderListLoading, setIsOrderListLoading] = useState(false);
    const [orderList, setOrderList] = useState([]);

    const [selectedOrder, setSelectedOrder] = useState(null);

    const toast = useToast();

    useEffect(() => {

        setIsBotTyping(true);
        setTimeout(() => {
            setMessageList([...messageList, {
                message: "Hello and welcome to Alnuaim! How can I assist you today?",
                author: "bot",
                type: "default",
                id: uuid.v4()
            }, {
                message: "Is your concern related to your recent order?",
                author: "bot",
                type: "bot-ask-yes-no",
                id: uuid.v4()
            }])
        }, 3000);
        setIsBotTyping(false);
    }, []);


    // useEffect(() => {
    //     let orderMsg = messageList.findIndex(ele => ele?.type === "default" && ele?.author == "user" && ele?.message == "Yes");
    //     if (orderMsg) {
    //         getAllOrder();
    //     }
    // }, [messageList]);


    const BubbleMessage = (item) => {
        const { author, message, id, type } = item?.item.item;
        if (type == "default") {
            return (
                <View
                    style={{
                        maxWidth: "80%",
                        marginVertical: rMS(10),
                        borderRadius: 15,
                        padding: 10,
                        alignSelf: author === "user" ? "flex-end" : "flex-start",
                        backgroundColor: author === "user" ? "#EAECEE" : "#EAECEE",
                    }}
                >
                    <Text adjustsFontSizeToFit={true} style={{ fontFamily: "Inter-Regular", color: "#000000" }}>{message}</Text>
                </View>
            )
        } else if (type == "bot-ask-support") {
            return (
                <View>
                    <View style={{
                        maxWidth: "80%",
                        marginVertical: rMS(10),
                        borderRadius: 15,
                        padding: 10,
                        alignSelf: author === "user" ? "flex-end" : "flex-start",
                        backgroundColor: author === "user" ? "#EAECEE" : "#EAECEE",
                    }}>
                        <Text adjustsFontSizeToFit={true} style={{ fontFamily: "Inter-Regular", color: "#000000" }}>{message}</Text>

                    </View>
                    <View style={{ flexDirection: "row", gap: 10 }}>
                        <Pressable style={[styles.actionBtn]} onPress={() => setIsInputHide(false)}>
                            <Text adjustsFontSizeToFit={true} style={{ fontFamily: "Inter-Regular", fontSize: rMS(14), color: "rgb(86, 101, 115)" }}>Yes, I have a query </Text>
                        </Pressable>
                        <Pressable style={[styles.actionBtn]} onPress={() => endChat()}>
                            <Text adjustsFontSizeToFit={true} style={{ fontFamily: "Inter-Regular", fontSize: rMS(14), color: "rgb(86, 101, 115)" }}>No, End Chat</Text>
                        </Pressable>
                    </View>
                </View>

            )
        } else if (type == "bot-ask-yes-no") {
            return (
                <View>
                    <View style={{
                        maxWidth: "80%",
                        marginVertical: rMS(10),
                        borderRadius: 15,
                        padding: 10,
                        alignSelf: author === "user" ? "flex-end" : "flex-start",
                        backgroundColor: author === "user" ? "#EAECEE" : "#EAECEE",
                    }}>
                        <Text adjustsFontSizeToFit={true} style={{ fontFamily: "Inter-Regular", color: "#000000" }}>{message}</Text>

                    </View>
                    <View style={{ flexDirection: "row", gap: 10 }}>
                        <Pressable style={[styles.actionBtn]} onPress={() => yesOrderQuery()}>
                            <Text adjustsFontSizeToFit={true} style={{ fontFamily: "Inter-Regular", fontSize: rMS(14), color: "rgb(86, 101, 115)" }}>Yes </Text>
                        </Pressable>
                        <Pressable style={[styles.actionBtn]} onPress={() => addBotMessage()}>
                            <Text adjustsFontSizeToFit={true} style={{ fontFamily: "Inter-Regular", fontSize: rMS(14), color: "rgb(86, 101, 115)" }}>No</Text>
                        </Pressable>
                    </View>
                </View>)
        } else if (type == "bot-order-list") {
            return (
                <View>
                    <View style={{
                        maxWidth: "80%",
                        marginVertical: rMS(10),
                        borderRadius: 15,
                        padding: 10,
                        alignSelf: author === "user" ? "flex-end" : "flex-start",
                        backgroundColor: author === "user" ? "#EAECEE" : "#EAECEE",
                    }}>
                        <Text adjustsFontSizeToFit={true} style={{ fontFamily: "Inter-Regular", color: "rgb(86, 101, 115)" }}>{message}</Text>

                    </View>
                    <View style={{ flexDirection: "column", gap: 10, width: "60%" }}>
                        {
                            isOrderListLoading && orderList.length == 0 &&
                            <View>
                                <HStack>
                                    <Text adjustsFontSizeToFit={true} style={{ fontFamily: "Inter-Regular", color: "rgb(86, 101, 115)" }}>Getting your orders</Text>
                                    <Spinner />
                                </HStack>
                            </View>


                        }
                        {!isOrderListLoading && orderList.length != 0 &&
                            <ScrollView horizontal={false}>
                                <Text adjustsFontSizeToFit={true} style={{ fontFamily: "Inter-Regular", color: "#000000" }}>Please select order</Text>
                                <View style={{ flexDirection: "row", width: "100%", flexWrap: "wrap", gap: 10 }}>
                                    {
                                        orderList.map(ele => {
                                            return (
                                                <Pressable key={ele?.orderInfoId} style={[styles.actionBtn]} onPress={() => onOrderSelect(ele)}>
                                                    <Text numberOfLines={1} style={{ fontFamily: "Inter-Regular", color: "rgb(86, 101, 115)" }}>Order_{ele?.orderNo} </Text>
                                                    <Text adjustsFontSizeToFit={true} style={{ fontFamily: "Inter-Regular", color: "rgb(86, 101, 115)" }}>₹ {ele?.finalAmount} </Text>
                                                </Pressable>
                                            )
                                        })
                                    }
                                </View>
                            </ScrollView>
                        }

                        {
                            !isOrderListLoading && orderList.length == 0 &&
                            <View>
                            <View style={{
                                maxWidth: "80%",
                                marginVertical: rMS(10),
                                borderRadius: 15,
                                padding: 10,
                                alignSelf: author === "user" ? "flex-end" : "flex-start",
                                backgroundColor: author === "user" ? "#EAECEE" : "#EAECEE",
                            }}>
                                <Text adjustsFontSizeToFit={true} style={{ fontFamily: "Inter-Regular", color: "#000000" }}>You have not placed any order yet. Do you have any other concerns or questions?</Text>
        
                            </View>
                        </View>
                        }
                    </View>
                </View>
            )
        }
    }

    const onOrderSelect = (ele) => {
        setSelectedOrder(ele);

        const msg = {
            message: `Order_${ele?.orderNo}`,
            author: "user",
            type: "default",
            id: uuid.v4()
        };

        setMessageList([...messageList, msg]);

        setTimeout(() => {
            addBotMessage();
        }, 3000);
    }

    const yesOrderQuery = () => {
        const msg = {
            message: "Yes",
            author: "user",
            type: "default",
            id: uuid.v4()
        };

        const botMsg = {
            message: "",
            author: "bot",
            type: "bot-order-list",
            id: uuid.v4()
        };


        setMessageList([...messageList, msg, botMsg]);
        getAllOrder();
    }


    const getAllOrder = async () => {



        setIsOrderListLoading(true);
        const user = await AsyncStorage.getItem("user");
        const URL = `${GET_ORDER}`;
        const data = await HTTP_POST(URL, {
            customerId: JSON.parse(user).customerId.customerId
        });

        if (data != null && data["errorStatus"] !== undefined) {
            if (data["status"] === "invalid") {
                toast.show({ description: "Oops! Something went wrong while fetching your order details." });
            } else if (data["status"] === "error") {
                toast.show({ description: "Oops! Something went wrong while fetching your order details. " });
            }
            setIsOrderListLoading(false);
        } else {
            if(data != null && data.length){
                setOrderList(data.slice(0, 5));
            }
            setIsOrderListLoading(false);

        }
    }


    const onMessageSend = (messageText) => {
        if (messageText.length) {
            setUserMessage(messageText);
            const msg = {
                message: messageText,
                author: "user",
                type: "default",
                id: uuid.v4()
            };

            setMessageList([...messageList, msg]);
            setUserMessage("");
            setTimeout(() => {
                addBotMessage();
            }, 3000);
        }
    }

    const addBotMessage = () => {
        const msg = {
            message: "Thank you for reaching out to us. We will create a support ticket for you.",
            author: "bot",
            type: "bot-ask-support",
            id: uuid.v4()
        };

        setMessageList(prevMessageList => [...prevMessageList, msg]);
        setIsInputHide(true);
    }

    const endChat = () => {
        saveSupportTicket();
    }

    const back = () => {
        navigation.navigate("Account");
    }

    const getUserResponses = () => {
        let userMessages = messageList
            .filter(ele => ele?.author === 'user')
            .map(ele => ele?.message)
            .join(',');
        return `${selectedOrder?.orderNo}: ${userMessages}`;
    }

    const saveSupportTicket = async () => {
        const user = await AsyncStorage.getItem("user");
        const URL = `${SAVE_SUPPORT_TICKET}`;
        const body = {
            customerId: await getCustomerId(),
            requestMsg: getUserResponses(),
            mobileNumber: JSON.parse(user).customerId.mobileNumber
        }

        const data = await HTTP_POST(URL, body);
        if (data != null && data["status"] !== undefined) {
            if (data["status"] === "invalid") {
                toast.show({ description: "Oops! Something went wrong while fetching your details." });
            } else if (data["status"] === "error") {
                toast.show({ description: "Oops! Something went wrong while fetching your details. " });
            }
            setIsLoading(false);
        } else {
            toast.show({
                description: "Thanks for reaching out. Your support request has raised, Team will contact you soon."
            }, 3000);
            setTimeout(() => {
                navigation.navigate("Account");
            }, 2000);
            setIsLoading(false);
        }

    }

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.container}>
                <View style={styles.editProfileTitle}>
                    <View style={styles.button}><Back width={40} height={40} onPress={back} /></View>
                    <Text adjustsFontSizeToFit={true} style={styles.title}>Chat with us</Text>
                </View>

                <View style={{ flex: 1, paddingBottom: "0%" }}>
                    {
                        messageList.length ?
                            <View style={{ flex: 1 }}>
                                <FlatList
                                    showsVerticalScrollIndicator={false}
                                    data={messageList}
                                    renderItem={(item) => <BubbleMessage item={item} />}
                                    keyExtractor={(_, index) => index.toString()}
                                />

                                {
                                    isInputHide ? null :
                                        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "position" : undefined}>
                                            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                                                <Input w={"90%"} fontFamily="Inter-Regular" fontSize="14" placeholder="Write a message" value={userMessage} onChangeText={(e) => setUserMessage(e)} />
                                                <Pressable onPress={() => onMessageSend(userMessage)}>
                                                    <SendIcon />
                                                </Pressable>
                                            </View>
                                        </KeyboardAvoidingView>
                                }
                            </View>

                            :

                            <View style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
                                <Text adjustsFontSizeToFit={true} style={styles.loadingText}>How may I help you today!!</Text>
                            </View>
                    }
                </View>
            </View>
        </SafeAreaView>
    )
}

export default ChatSupport

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: "3%",
        paddingVertical: "5%",
        position: "relative",
        flex: 1
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
        width: "100%",
        fontFamily: "Inter-Regular"
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
    messageItemWrap: {
        backgroundColor: "#EAECEE",
        padding: rMS(10),
        borderRadius: 8,
        width: wp("50%")
    },
    messageBot: {
        flexDirection: "row",
        justifyContent: "flex-start"
    },
    messageText: {
        fontFamily: "Inter-Regular",
        fontSize: rMS(13),
        color: "#000000"
    },
    actionBtn: {
        borderWidth: 1,
        borderRadius: 4,
        padding: rMS(5),
        borderColor: "#B6974E",
        backgroundColor: "lightgrey"
    },
    loadingText: {
        fontFamily: "Inter-Regular",
        fontSize: rMS(18),
        color: "#B6974E"
    }
})