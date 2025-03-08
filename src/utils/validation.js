

export const validateEmail = (email) => {
    const emailRegx = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(email);
    return emailRegx
}

export const validateMobile = (mobile) => {
    if (mobile.length != 0 && /^[0-9]{10}$/.test(mobile)) {
        return true;
      }
      return false;
}

export const validateGST = (gst) => {
    var gstRegx = /^([0-9]){2}([a-zA-Z]){5}([0-9]){4}([a-zA-Z]){1}([0-9]){1}([a-zA-Z]){1}([0-9]){1}?$/.test(gst);
    return gstRegx;
}

export const validatePAN = (pan) => {
    const panRegx = /^([a-zA-Z]){5}([0-9]){4}([a-zA-Z]){1}?$/.test(pan);
    return panRegx;
}

