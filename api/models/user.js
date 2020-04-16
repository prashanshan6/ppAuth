const mongoose = require("mongoose");
const joi = require("@hapi/joi");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        minlength: 4,
        maxlength: 20,
    },
    regno: {
        type: String,
        required: true,
        minlength: 4,
        maxlength: 32,
        unique: true,
    },
    email: {
        type: String,
        required: true,
        minlength: 4,
        maxlength: 32,
        unique: true,
    },
    password: {
        type: String,
        default: "tempPassword",
        required: false,
        minlength: 8,
        maxlength: 256,
    },
    organisation: {
        type: String,
        required: true,
        minlength: 4,
        maxlength: 32,
    },
    isActive: {
        type: Boolean,
        default: false,
    },
    status: {
        type: Number,
        default: 0,
        // -1 - rejected,
        // 0 - accept/recject (new requests),
        // 1 - password reset reqested,
        // 2 - valid user
    },
});
userSchema.methods.generateAuthToken = function () {
    const token = jwt.sign(
        {
            name: this.name,
            email: this.email,
            organisation: this.organisation,
        },
        process.env.secret
    );
    return token;
};
const userModel = new mongoose.model("user", userSchema);

function validateUser(user) {
    const userJoiSchema = new joi.object({
        name: joi.string().min(4).max(255).required(),
        regno: joi.string().min(8).max(255).required(),
        email: joi.string().min(8).max(255).required(),
        password: joi.string().min(8).max(256),
        organisation: joi.string().min(4).max(256).required(),
    });
    try {
        const result = userJoiSchema.validateAsync(user);
        return result;
    } catch (err) {
        return null;
    }
}

module.exports.userModel = userModel;
module.exports.validate = validateUser;
