import { Scale, verticalScale, moderateScale, scale} from "react-native-size-matters";

export const rS = (size) => {
    return scale(size);
}

export const rVS = (size) => {
    return verticalScale(size);
}

export const rMS = (size, factor = 0) => {
    return moderateScale(size, factor);
}