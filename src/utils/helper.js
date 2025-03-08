
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Cache } from "react-native-cache";

let cartData = null;
let isAccountBack = true;

export const getAccountBack = () => {
    return isAccountBack;
};

export const setAccountBack = (params) => {
    isAccountBack = params;
}

export const setCartDataInGlobal = (data) => {
    cartData = data;
}

export const getCartDataInGlobal = () => {
    return cartData;
}

const cache = new Cache({
    namespace: "Alnuaim_Cache",
    policy: {
        stdTTL: 0 // the standard ttl as number in seconds, default: 0 (unlimited)
    },
    backend: AsyncStorage
});

export const getCustomerId = async () => {
    const user = await AsyncStorage.getItem("user");
    if (user) {
        return JSON.parse(user).customerId.customerId;
    }
    return null;
}

export const getUserInfo = async () => {
    const user = await AsyncStorage.getItem("user");
    if(user){
        return JSON.parse(user);
    }
    return null;
}

export const setCache = async (key, value) => {
    await cache.set(key, value);
}

export const getCache = async (key) => {
    return await cache.get(key);
}