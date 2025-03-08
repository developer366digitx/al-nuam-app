import { Text, View } from "native-base";
import React, { useEffect, useState } from "react";
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import BulkOrder from "../BulkOrder/BulkOrder";
import Home from "./Home";
import Cart from "../Cart/Cart";
import HomeInactive from "../../../assets/home-inactive.svg";
import HomeActive from "../../../assets/home-active.svg";
import BulkOrderInactive from "../../../assets/bulk-inactive.svg";
import BulkOrderActive from "../../../assets/bulk-active.svg";
import CartInactive from "../../../assets/cart-inactive.svg";
import CartActive from "../../../assets/cart-active.svg";
import ProfileInactive from "../../../assets/user-inactive.svg";
import ProfileActive from "../../../assets/user-active.svg";
import Account from "../Profile/Account";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import EditProfile from "../Profile/EditProfile";
import Address from "../Address/Address";
import UpdateAddress from "../Address/UpdateAddress";
import BulkSummary from "../BulkOrder/BulkSummary";
import OrderPlaced from "../Order/OrderPlaced";
import OrderList from "../Order/OrderList";
import OrderDetail from "../Order/OrderDetail";
import ProductDetail from "../Product/ProductDetail";
import CustomerSupport from "../Support/CustomerSupport";
import ChatSupport from "../Support/ChatSupport";
import Tooltip from 'react-native-walkthrough-tooltip';
import { CopilotProvider } from "react-native-copilot";
import { Alert, BackHandler } from "react-native";

const Dashboard = ({ navigation }) => {

    const [isBulkOrderTooltipVisible, setBulkOrderTooltipVisible] = useState(true);

    const Tab = createBottomTabNavigator();
    const Stack = createNativeStackNavigator();

    useEffect(() => {
        const backAction = () => {
            Alert.alert('Hold on!', 'Are you sure you want to go back?', [
                {
                    text: 'Cancel',
                    onPress: () => null,
                    style: 'cancel',
                },
                { text: 'YES', onPress: () => BackHandler.exitApp() },
            ]);
            return true;
        };

        const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

        return () => backHandler.remove();
    }, []);


    // , tabBarStyle: {height: 60} in screen options
    return (
        <Tab.Navigator screenOptions={{ unmountOnBlur: true, headerShown: false }} tabBarOptions={{
            tabStyle: {
                paddingTop: 10,
                backgroundColor: '#fff',
            },
        }}  >
            <Tab.Screen name="Home" component={Home} options={{
                title: "Home",
                tabBarLabelStyle: { fontFamily: "Inter-Regular", fontSize: 12 },
                tabBarIcon: ({ size, focused, color }) => {
                    let iconName;

                    return (
                        <View>
                            {
                                iconName = focused ?
                                    <HomeActive /> :
                                    <HomeInactive />
                            }
                        </View>
                    )
                },
                tabBarInactiveTintColor: "#D2D2D2",
                tabBarActiveTintColor: "#B6974E",
                tabBarStyle: {
                    // marginTop: 15,
                }
            }} />

            <Tab.Screen name="BulkOrder" component={() => (
                <CopilotProvider stopOnOutsideClick androidStatusBarVisible>
                    <BulkOrder />
                </CopilotProvider>
            )} options={{
                title: "Bulk Order",
                tabBarLabelStyle: { fontFamily: "Inter-Regular", fontSize: 12 },
                tabBarIcon: ({ size, focused, color }) => {
                    let iconName;

                    return (
                        <View>
                            {
                                iconName = focused ?

                                    <BulkOrderActive />
                                    :
                                    <Tooltip
                                        isVisible={isBulkOrderTooltipVisible}
                                        content={<Text style={{ color: "#fff" }}>Easily place bulk orders by selecting a category and adding multiple products to your cart at once!</Text>}
                                        onClose={() => setBulkOrderTooltipVisible(false)}
                                        placement="top"
                                        backgroundColor="transparent"
                                        contentStyle={{ backgroundColor: '#000000', color: "#fff" }}
                                    >
                                        <BulkOrderInactive />
                                    </Tooltip>
                            }
                        </View>
                    )
                },
                tabBarInactiveTintColor: "#D2D2D2",
                tabBarActiveTintColor: "#B6974E",
                tabBarStyle: {
                    // marginTop: 15
                }
            }} />

            < Tab.Screen name="Cart" component={Cart} options={{
                title: "Cart",
                tabBarLabelStyle: { fontFamily: "Inter-Regular", fontSize: 12 },
                tabBarIcon: ({ size, focused, color }) => {
                    let iconName;

                    return (
                        <View>
                            {
                                iconName = focused ?
                                    <CartActive /> :
                                    <CartInactive />
                            }
                        </View>
                    )
                },
                tabBarInactiveTintColor: "#D2D2D2",
                tabBarActiveTintColor: "#B6974E",
                tabBarStyle: {
                    // marginTop: 15
                }
            }} />
            < Tab.Screen name="Account" component={Account} options={{
                title: "Account",
                tabBarLabelStyle: { fontFamily: "Inter-Regular", fontSize: 12 },
                tabBarIcon: ({ size, focused, color }) => {
                    let iconName;

                    return (
                        <View>
                            {
                                iconName = focused ?
                                    <ProfileActive /> :
                                    <ProfileInactive />
                            }
                        </View>
                    )
                },
                tabBarInactiveTintColor: "#D2D2D2",
                tabBarActiveTintColor: "#B6974E",
                tabBarStyle: {
                    // marginTop: 15
                }
            }} />

            < Tab.Screen name="EditProfile" component={EditProfile} options={{ tabBarVisible: false, tabBarButton: () => null }} />

            < Tab.Screen name="Address" component={Address} options={{ tabBarVisible: false, tabBarButton: () => null }} />

            < Tab.Screen name="UpdateAddress" component={UpdateAddress} options={{ tabBarVisible: false, tabBarButton: () => null }} />
            < Tab.Screen name="Bulk_Summary" component={BulkSummary} options={{ tabBarVisible: false, tabBarButton: () => null }} />
            < Tab.Screen name="OrderPlaced" component={OrderPlaced} options={{ tabBarVisible: false, tabBarButton: () => null }} />
            < Tab.Screen name="Order" component={OrderList} options={{ tabBarVisible: false, tabBarButton: () => null }} />
            < Tab.Screen name="OrderDetail" component={OrderDetail} options={{ tabBarVisible: false, tabBarButton: () => null }} />
            < Tab.Screen name="ProductDetail" component={ProductDetail} options={{ tabBarVisible: false, tabBarButton: () => null }} />
            < Tab.Screen name="CustomerSupport" component={CustomerSupport} options={{ tabBarVisible: false, tabBarButton: () => null }} />
            < Tab.Screen name="ChatSupport" component={ChatSupport} options={{ tabBarVisible: false, tabBarButton: () => null }} />
        </Tab.Navigator >
    )
}


export default Dashboard;