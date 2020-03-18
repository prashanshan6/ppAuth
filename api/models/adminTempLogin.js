const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const adminTempLoginSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        minlength: 4,
        maxlength: 32,
        unique: true
    },
    password: {
        type: String,
        required: true,
        minlength: 4,
        maxlength: 10
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user"
    }
});
adminTempLoginSchema.methods.generateAuthToken = function() {
    const token = jwt.sign(
        {
            email: this.email,
            otp: this.password
        },
        process.env.secret
    );
    return token;
};

const adminTempLoginModel = new mongoose.model(
    "adminTempLogin",
    adminTempLoginSchema
);

module.exports.adminTempLoginModel = adminTempLoginModel;
