import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import Back from "../../../assets/back.svg";
import { rMS } from '../../utils/responsive';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { ScrollView, Skeleton } from 'native-base';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GET_ORDER } from '../../utils/constant';
import { HTTP_POST } from '../../utils/http-service';
import OrderItem from "../../../assets/orderitem.svg";
import ArrowRight from "../../../assets/arrowright2.svg";
import NoOrderIcon from "../../../assets/no-order.svg";

const OrderList = ({ navigation }) => {

    const [orderList, setOrderList] = useState([]);
    const [isOrderListLoading, setIsOrderListLoading] = useState(false);

    useEffect(() => {
        getAllOrder();
    }, []);

    const getAllOrder = async () => {
        setIsOrderListLoading(true);
        const user = await AsyncStorage.getItem("user");
        const URL = `${GET_ORDER}`;
        const data = await HTTP_POST(URL, {
            customerId: JSON.parse(user).customerId.customerId
        });

        if (data != null && data["errorStatus"] !== undefined) {
            if (data["status"] === "invalid") {
                toast.show({ description: "Oops! Something went wrong while fetching your details." });
            } else if (data["status"] === "error") {
                toast.show({ description: "Oops! Something went wrong while fetching your details. " });
            }
            setIsOrderListLoading(false);
        } else {
            if (data == null) {
                setOrderList([]);
            } else if (data.length) {
                setOrderList(data);
            }
            setIsOrderListLoading(false);

        }
    }

    const back = () => {
        navigation.navigate("Account");
    }

    const navigateToOrderDetail = (orderId, order) => {
        navigation.navigate("OrderDetail", {
            orderId: orderId,
            orderData: order
        });
    }

    return (
        <SafeAreaView>
            <View style={styles.container}>
                <View style={styles.editProfileTitle}>
                    <View style={styles.button}><Back width={40} height={40} onPress={back} /></View>
                    <Text adjustsFontSizeToFit={true} style={styles.title}>Order</Text>
                </View>

                {isOrderListLoading && orderList.length == 0 ?
                    <View style={{ marginTop: rMS(15) }}>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((ele) => (
                            <View key={ele} style={{ height: hp("10%"), marginBottom: rMS(10) }}>
                                <Skeleton h={'20'} rounded='md' />
                            </View>
                        ))}
                    </View>
                    :

                    orderList.length !== 0 ?
                        (<View style={styles.orderListWrapper}>
                            <ScrollView horizontal={false} showsVerticalScrollIndicator={false}>
                                {
                                    orderList.map(item => {
                                        return (
                                            <View key={item?.orderInfoId}>
                                                <Pressable onPress={() => navigateToOrderDetail(item?.orderInfoId, item)}>
                                                    <View style={styles.orderItemWrapper}>
                                                        <View style={{ flexDirection: "row", alignItems: "center", gap: 20 }}>
                                                            <View>
                                                                <OrderItem />
                                                            </View>
                                                            <View style={{ width: "60%" }}>
                                                                <Text style={styles.orderLbl} numberOfLines={1}>Order #{item?.orderNo}</Text>
                                                                <Text adjustsFontSizeToFit={true} stye={{ fontFamily: "Inter-Regular", fontSize: rMS(14), color: "rgb(86, 101, 115)" }}>{item?.totalProductCountInOrder} Items</Text>
                                                                <Text adjustsFontSizeToFit={true} stye={{ fontFamily: "Inter-Regular", fontSize: rMS(14), color: "rgb(86, 101, 115)" }}>{item?.orderStatusName}</Text>
                                                            </View>
                                                        </View>

                                                        <View>
                                                            <ArrowRight />
                                                        </View>

                                                    </View>
                                                </Pressable>
                                            </View>
                                        )
                                    })
                                }
                            </ScrollView>
                        </View>)

                        :
                        <View style={{ height: "80%", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 15 }}>
                            <NoOrderIcon />
                            <Text adjustsFontSizeToFit={true} style={{ fontSize: rMS(18), color: "#000000" }}>No Orders available</Text>
                        </View>
                }

                {/* {
                !isOrderListLoading && orderList.length == 0 &&

                <View style={{ height: "80%", flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "red"}}>
                    <Text adjustsFontSizeToFit={true}>No Orders available</Text>
                </View>
            } */}
            </View>
        </SafeAreaView>
    )
}

export default OrderList

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: "5%",
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
    orderListWrapper: {
        height: hp("85%")
    },
    orderItemWrapper: {
        // borderWidth: 1,
        borderRadius: 6,
        paddingHorizontal: rMS(10),
        paddingVertical: rMS(10),
        marginBottom: rMS(10),
        marginTop: "3%",
        backgroundColor: "lightgrey",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center"
    },
    fontStyle: {
        fontFamily: "Inter-Regular",
        fontSize: rMS(14),
        marginBottom: rMS(3)
    },
    fontColor: {
        color: "#B6974E",
        fontWeight: "700"
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        position: "relative"
    },
    circle: {
        width: rMS(20),
        height: rMS(20),
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ddd',
    },
    circleText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: rMS(12),
        fontFamily: "Inter-Regular"

    },
    statusText: {
        marginLeft: 10,
        marginRight: 10,
        fontFamily: "Inter-Regular"
    },
    line: {
        width: wp("15%"),
        height: 2,
        backgroundColor: '#ddd',
    },
    completed: {
        backgroundColor: '#4caf50'
    },
    orderLbl: {
        fontSize: rMS(16),
        fontWeight: "700",
        color: "#000000"
    }
})