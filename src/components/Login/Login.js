import React, { useEffect, useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Button, FormControl, HStack, Input, Spinner, WarningOutlineIcon, useToast } from "native-base";
import GoogleLogo from "../../../assets/google.svg";
import { useFocusEffect } from '@react-navigation/native';
import { SEND_OTP } from '../../utils/constant';
import { HTTP_POST_OTP } from '../../utils/http-service';
import { rMS } from '../../utils/responsive';

const Login = ({ navigation }) => {
  const [inputValue, setInputValue] = useState('');
  const [showErrorMessage, setShowErrorMessage] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  useFocusEffect(
    React.useCallback(() => {
      setInputValue("");
    }, [])
  )

  const validateInput = (text) => {
    if (inputValue.length != 0 && /^[0-9]{10}$/.test(text)) {
      return true;
    }
    return false;
  }

  const handleInputChange = (text) => {
    setInputValue(text);
  }

  const onLogin = async () => {
    if (validateInput(inputValue)) {
      setIsLoading(true);
      setShowErrorMessage(false);
      const URL = `${SEND_OTP}`;
      const body = {
        "mobileExt": "+91",
        "mobileNumber": inputValue,
        "otpScreen": "LOGIN"
      }
      const data = await HTTP_POST_OTP(URL, body);
      if (data != null && data["status"] !== undefined) {
        if (data["status"] === "invalid") {
          toast.show({ description: "Oops! It seems you haven't registered yet." });
        } else if (data["status"] === "error") {
          toast.show({ description: "Something went wrong!!" });
        }
        setIsLoading(false);
      } else {

        toast.show({
          description: `OTP send to +91${inputValue}`,
          duration: 5000
        });

        navigation.navigate("Otp", {
          mobileNumber: `${inputValue}`,
          ext: "+91"
        });

        setIsLoading(false);

      }

    } else {
      setShowErrorMessage(true);
      setIsLoading(false);
    }
  }

  const navigateToRegister = () => {
    navigation.navigate("Register");
  }

  return (
    <SafeAreaView>
      <View style={styles.container}>
        <Text adjustsFontSizeToFit={true} style={styles.signin} >Sign In</Text>

        <View style={styles.wrapper}>
          <Text adjustsFontSizeToFit={true} style={styles.label}>Mobile Number</Text>
          <View>
            <FormControl isInvalid={showErrorMessage} isRequired>
              <Input keyboardType='numeric' maxLength={10} value={inputValue} onChangeText={(e) => handleInputChange(e)} InputLeftElement={<Text adjustsFontSizeToFit={true} style={styles.countryCode}>+91 |</Text>} style={styles.f18} type="text" placeholder="Enter mobile number" />
              {
                showErrorMessage &&
                <FormControl.ErrorMessage leftIcon={<WarningOutlineIcon size="xs" />}>
                  <Text adjustsFontSizeToFit={true} style={styles.font_Manrope}>Please Enter valid mobile number</Text>
                </FormControl.ErrorMessage>
              }

            </FormControl>
          </View>
          <View>
            <Button style={styles.button} onPress={() => onLogin()}>
              <HStack space={3}>
                {
                  isLoading &&
                  <Spinner color="#ffffff" />
                }
                <Text adjustsFontSizeToFit={true} style={styles.continue}>Continue</Text>
              </HStack>
            </Button>
            <Text adjustsFontSizeToFit={true} style={styles.register}>
              Not yet registered? <Text adjustsFontSizeToFit={true} style={styles.bold} onPress={() => navigateToRegister()}>Register</Text>
            </Text>
          </View>

          {/* <View style={styles.googleContainer}>
          <View style={styles.googleWrapper}>
            <GoogleLogo width={24} height={24} />
            <Text adjustsFontSizeToFit={true} style={styles.continueWithGoogle}>Continue with Google</Text>
          </View>
        </View> */}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: rMS(50),
    paddingVertical: rMS(100),
  },

  signin: {
    color: '#000000',
    fontSize: rMS(32),
    fontFamily: "Inter-Regular",
    fontWeight: '700',
  },

  wrapper: {
    marginTop: rMS(40),
    display: 'flex',
    flexDirection: 'column',
    gap: 15,
  },

  label: {
    fontSize: rMS(18),
    fontWeight: '300',
    color: '#27272780',
    fontFamily: "Inter-Regular",
  },
  countryCode: {
    fontSize: rMS(18),
    fontWeight: '300',
    color: '#27272780',
    paddingLeft: rMS(7),
    fontFamily: "Inter-Regular",
  },

  inputMobileWrapper: {
    borderWidth: 1,
    borderRadius: 8,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: '#D2D2D2',
    paddingHorizontal: rMS(25),
  },

  input: {
    width: '100%',
    fontSize: rMS(18),
  },

  button: {
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

  f18: {
    fontSize: rMS(18),
    fontFamily: "Inter-Regular"
  },

  font_Manrope: {
    fontFamily: "Inter-Regular"
  },

  register: {
    color: '#000000',
    marginTop: rMS(10),
    fontFamily: "Inter-Regular"
  },

  bold: {
    fontWeight: '700',
    fontFamily: "Inter-Regular"
  },

  googleContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },

  googleWrapper: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 15,
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
    fontFamily: "Inter-Regular",
  }
});
export default Login;
