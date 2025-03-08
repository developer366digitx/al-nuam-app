import { SafeAreaView, StyleSheet, Text, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import LottieView from "lottie-react-native";
import { rMS } from '../../utils/responsive';

const PaymentSuccess = ({ navigation }) => {

  const [counter, setCounter] = useState(5);
  const orderPlacedRef = React.useRef(null);


  useEffect(() => {
    orderPlacedRef.current.play(0);

    const timeInterval = setInterval(() => {
      setCounter(prevCounter => {
        if (prevCounter !== 0) {
          return prevCounter - 1;
        } else {
          clearInterval(timeInterval);
          navigateToOrder();
          return prevCounter;
        }
      });
    }, 1000);

    return () => {
      clearInterval(timeInterval)
    }
  }, [])

  const navigateToOrder = () => {
    navigation.navigate("Dashboard", { screen: "Order" });
  }


  return (
    <SafeAreaView>
      <View style={styles.wrapper}>
        <LottieView
          source={require("../../../assets/orderplaced.json")}
          loop={false}
          ref={orderPlacedRef}
          style={styles.lottie}
        />
        <Text adjustsFontSizeToFit={true} style={styles.lbl}>Order Confirmed</Text>
        <View style={styles.noteWrapper}>
          <Text adjustsFontSizeToFit={true} style={styles.note}>You will be redirected to Order's in {counter} seconds</Text>
        </View>
      </View>
    </SafeAreaView>
  )
}

export default PaymentSuccess

const styles = StyleSheet.create({

  wrapper: {
    width: "100%",
    height: "80%",
    position: "relative",
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center"
  },
  lottie: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    // zIndex: 1000,
    pointerEvents: "none",
  },
  lbl: {
    position: "absolute",
    top: "70%",
    fontSize: rMS(24),
    fontFamily: "Inter-Regular",
    fontWeight: "700",
    color: "rgb(86, 101, 115)"
  },
  noteWrapper: {
    position: "absolute",
    top: "75%",
  },
  note: {
    fontSize: rMS(16),
    fontFamily: "Inter-Regular",
    marginTop: rMS(10),
    color: "rgb(86, 101, 115)"
  }
})