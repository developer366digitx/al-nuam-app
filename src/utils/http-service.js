
import AsyncStorage from '@react-native-async-storage/async-storage';

export const HTTP_POST_OTP = async (url, body) => {
  try {
    const data = (await fetch(url, {
      method: "POST",
      body: JSON.stringify(body),
      headers: new Headers({
        "content-type": "application/json",
      }),
    }));


    const res = await data.json();

    if (res.statusCodeValue === 200) {
      return res.body;
    }
    return { status: "invalid", message: res.message };
  } catch (error) {
    return { status: "error" };
  }
}

const getToken = async () => {
  const user = await AsyncStorage.getItem("user");
  if (user) {
    const token = await JSON.parse(user).token;
    return token;
  }

  return null;
};

export const HTTP_GET = async (url) => {
  try {
    const data = await fetch(url, {
      method: "GET",
      headers: new Headers({
        "content-type": "application/json",
        Authorization: `Bearer ${await getToken()}`,
      }),
    });

    const res = await data.json();
    if (res.statusCodeValue === 200) {
      return res.body;
    }
    return { status: "invalid" };
  } catch (error) {
    return { status: "error" };
  }
};

export const HTTP_GET_FILE = async (url) => {
  try {
    const data = await fetch(url, {
      method: "GET",
      headers: new Headers({
        "content-type": "application/pdf",
        Authorization: `Bearer ${await getToken()}`,
      }),
    });

    const res = await data.json();
    // return res;
    if (res.statusCodeValue === 200) {
      return res.body;
    }
    return { status: "invalid" };
  } catch (error) {
    return { status: "error" };
  }
};



export const HTTP_POST = async (url, body) => {
  try {
    const data = await fetch(url, {
      method: "POST",
      body: JSON.stringify(body),
      headers: new Headers({
        "content-type": "application/json",
        Authorization: `Bearer ${await getToken()}`,
      }),
    });

    const res = await data.json();
    if (res.statusCodeValue === 200) {
      return res.body;
    }
    return { status: "invalid", errorStatus: "invalid" };
  } catch (error) {
    return { status: "error" };
  }
};