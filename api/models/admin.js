const mongoose = require("mongoose");
const joi = require("@hapi/joi");
const jwt = require("jsonwebtoken");

const adminSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        minlength: 4,
        maxlength: 20
    },
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
        minlength: 8,
        maxlength: 256
    },
    organisation: {
        type: String,
        required: true,
        minlength: 4,
        maxlength: 32,
        unique: true
    }
});

adminSchema.methods.generateAuthToken = function() {
    const token = jwt.sign(
        {
            name: this.name,
            email: this.email,
            organisation: this.organisation
        },
        process.env.secret
    );
    return token;
};

const adminModel = new mongoose.model("admin", adminSchema);

function validateAdmin(admin) {
    const adminJoiSchema = new joi.object({
        name: joi
            .string()
            .min(4)
            .max(255)
            .required(),
        email: joi
            .string()
            .min(8)
            .max(255)
            .required(),
        password: joi
            .string()
            .min(8)
            .max(256)
            .required(),
        organisation: joi
            .string()
            .min(4)
            .max(256)
            .required()
    });
    try {
        const result = adminJoiSchema.validateAsync(admin);
        return result;
    } catch (err) {
        // console.log(err);
        return null;
    }
}

module.exports.adminModel = adminModel;
module.exports.validate = validateAdmin;
