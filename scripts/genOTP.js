function generateOTP(n) {
    var digits = "0123456789";

    var otpLength = n;

    var otp = "";

    for (let i = 1; i <= otpLength; i++) {
        var index = Math.floor(Math.random() * digits.length);

        otp = otp + digits[index];
    }

    return otp;
}
module.exports.generateOTP = generateOTP;
