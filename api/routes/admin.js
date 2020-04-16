const express = require("express");
const bodyParser = require("body-parser");
const router = express.Router();
const morgan = require("morgan");
const _ = require("lodash");
const { generateOTP } = require("../../scripts/genOTP");
const auth = require("../middlewares/auth");
const tempAdminAuth = require("../middlewares/tempAdminAuth");
bcrypt = require("bcryptjs");

router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());

const { userModel } = require("../models/user");
const { adminModel, validate } = require("../models/admin");
const { resetRequestQueueModel } = require("../models/resetRequestQueue");
const { adminTempLoginModel } = require("../models/adminTempLogin");
// create an account
router.post("/register", async (req, res) => {
    try {
        // console.log(req.body);

        let result = await adminModel.findOne({ email: req.body.email });
        if (result) return res.status(500).send("email already registered");
        result = validate(req.body);
        if (!result) return res.status(403).json({ message: "invalid data" });

        admin = await new adminModel(req.body);
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(admin.password, salt);
        admin.password = hash;

        result = await admin.save();
        if (result) {
            temp = _.pick(admin, ["name", "email", "organisation"]);
            temp.error = null;
            return res.json(temp);
        } else {
            temp = { error: "Admin Registration failed" };
            return res.json(temp);
        }
        // console.log(admin);
    } catch (err) {
        console.log("error : ", err);
        return res.status(400).json({ error: err });
    }
});
// login
router.post("/login", async (req, res) => {
    try {
        const admin = await adminModel.findOne({ email: req.body.email });
        if (!admin) return res.status(500).send("Email doesn't exist");

        const result = bcrypt.compare(req.body.password, admin.password);
        const token = admin.generateAuthToken();
        // console.log(token);
        const temp = _.pick(admin, ["_id", "name", "email", "organisation"]);
        temp.token = token;
        return res.header("x-admin-token", token).send(temp);
    } catch (error) {}
});
router.get("/newRequests", auth, async (req, res) => {
    try {
        const users = await userModel.find({
            status: 0,
            organisation: req.admin.organisation,
        });
        user_details = [];
        users.forEach((element) => {
            user_details.push(
                _.pick(element, [
                    "_id",
                    "name",
                    "regno",
                    "email",
                    "organisation",
                    "status",
                    "isActive",
                ])
            );
        });
        console.log(user_details);
        // allow cors
        // res.setHeader("Access-Control-Allow-Origin", "*");
        return res.json(user_details);
        // console.log(admin);
    } catch (err) {
        console.log("error : ", err);
        return res.status(400).json({ error: err });
    }
});

// inserted from user
// router.get("/resetRequests", auth, async (req, res) => {
//     try {
//         const users = await resetRequestQueueModel.find();
//         return res.json(users);
//     } catch (err) {
//         console.log("error : ", err);
//     }
// });

// get temp login details (email, and otp) when clicked allow
router.get("/newRequests/:id", auth, async (req, res) => {
    try {
        const result = await adminTempLoginModel.find({
            email: req.admin.email,
        });
        const otp = generateOTP(4);
        if (result.length) {
            const tempAdmin = await adminTempLoginModel.findOneAndUpdate(
                { email: req.admin.email },
                { $set: { password: otp, user: req.params.id } }
            );
            temp = _.pick(tempAdmin, ["email", "user"]);
            temp.password = otp;
            return res.json(temp);
        } else {
            const tempAdmin = new adminTempLoginModel({
                email: req.admin.email,
                password: otp,
                user: req.params.id,
            });
            const result = await tempAdmin.save();
            return res.json(result);
        }
    } catch (err) {
        console.log("error : ", err);
        return res.status(400).json({ error: err });
    }
});
// temp login
router.post("/tempLogin", async (req, res) => {
    try {
        const admin = await adminTempLoginModel.findOne({
            email: req.body.email,
        });
        if (!admin) return res.status(500).send("Email doesn't exist");
        // console.log(admin.user);
        if (req.body.password == admin.password) {
            const token = admin.generateAuthToken();
            console.log(token);
            console.log(1111);
            const temp = _.pick(admin, ["_id"]);
            temp.otp = req.body.password;
            temp.token = token;
            temp.user = admin.user;

            // console.log(temp);

            return res.header("x-admin-token", token).send(temp);
        } else return res.status(403).send("invalid temp admin details");
    } catch (error) {
        console.log(error);
        return res.status(400).json({ error: err });
    }
});
// temp login click allow , generate client private key and set password with key
router.post("/setPassword/:id", tempAdminAuth, async (req, res) => {
    try {
        const id = req.params.id;
        const newPassword = req.body.password;
        console.log(newPassword);

        const clientKey = generateOTP(20);
        console.log(clientKey + newPassword);
        const salt = await bcrypt.genSalt(10);
        const hashed = await bcrypt.hash(clientKey + newPassword, salt);

        const result = await userModel.findOneAndUpdate(
            { _id: id },
            { $set: { password: hashed, status: 2 } }
        );

        if (result) {
            // del from adminTempLoginModel
            await adminTempLoginModel.deleteOne({ user: id });
            return res.json({
                status: "password is set",
                clientKey: clientKey,
            });
        } else return res.status(403).send("password is not set");
    } catch (error) {
        console.log(error);
        return res.status(400).json({ error: error });
    }
});

router.get("/aprove/:id", auth, async (req, res) => {
    try {
        const userId = req.params.id;

        const user = await userModel.updateOne(
            { _id: userId, organisation: req.admin.organisation },
            { $set: { isActive: true } }
        );

        return res.json({ id: userId, status: "active" });
    } catch (err) {
        console.log("id not approved ", err);
        return res.status(400).json({ error: err });
    }
});
router.get("/reject/:id", auth, async (req, res) => {
    try {
        const userId = req.params.id;

        const user = await userModel.updateOne(
            { _id: userId, organisation: req.admin.organisation },
            { $set: { isActive: false } }
        );
        return res.json({ id: userId, status: "blocked" });
    } catch (err) {
        console.log("id not blocked ", err);
        return res.status(400).json({ error: err });
    }
});

router.get("/users", auth, async (req, res) => {
    try {
        const users = await userModel.find({
            $or: [
                { organisation: req.admin.organisation, status: 2 },
                { organisation: req.admin.organisation, isActive: true },
            ],
        });
        user_details = [];
        users.forEach((element) => {
            // return valid active accounts(not new accounts, not forget password accounts)
            user_details.push(
                _.pick(element, [
                    "_id",
                    "name",
                    "regno",
                    "email",
                    "organisation",
                    "isActive",
                    "status",
                ])
            );
        });
        return res.json(user_details);

        // console.log(admin);
    } catch (err) {
        console.log("error : ", err);
    }
});

//
router.get("/forgetPasswordRequests", auth, async (req, res) => {
    try {
        const users = await userModel.find({
            status: 1,
            organisation: req.admin.organisation,
        });
        user_details = [];
        users.forEach((element) => {
            user_details.push(
                _.pick(element, [
                    "_id",
                    "name",
                    "regno",
                    "email",
                    "organisation",
                    "status",
                    "isActive",
                ])
            );
        });
        console.log(user_details);

        return res.json(user_details);
    } catch (err) {
        console.log("error : ", err);
        return res.status(400).json({ error: err });
    }
});
router.get("/forgetPasswordRequests/accept/:id", auth, async (req, res) => {
    console.log("sdad");
    const id = req.params.id;
    try {
        const user = await userModel.findOne({
            _id: id,
            organisation: req.admin.organisation,
        });
        let result;
        if (user) {
            user.status = 0;
            user.isActive = false;
            result = await user.save();
        } else {
            return res
                .status(400)
                .json({ error: "given details doesn't match with database" });
        }
        return res.json({ status: "password request is accepted" });
    } catch (err) {
        console.log("error : ", err);
        // return res.status(400).json({ error: "request isn't completed" });
        return res.status(400).json({ error: err });
    }
});
router.get("/forgetPasswordRequests/reject/:id", auth, async (req, res) => {
    const id = req.params.id;
    try {
        const user = await userModel.findOne({
            _id: id,
            organisation: req.admin.organisation,
        });
        let result;
        if (user.isActive == true) {
            user.status = 2;
            result = await user.save();
        } else if (user.isActive == false) {
            user.status = -1;
            result = await user.save();
        } else {
            return res
                .status(400)
                .json({ error: "given details doesn't match with database" });
        }
        return res.json({ status: "password request is rejected" });
    } catch (err) {
        console.log("error : ", err);
        return res.status(400).json({ error: err });
    }
});

//
module.exports = router;
