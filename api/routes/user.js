const express = require("express");
const bodyParser = require("body-parser");
const router = express.Router();
const morgan = require("morgan");
const _ = require("lodash");
crypto = require("crypto");

router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());

const { userModel, validate } = require("../models/user");
const { adminModel } = require("../models/admin");
const { resetRequestQueueModel } = require("../models/resetRequestQueue");

router.post("/register", async (req, res) => {
    try {
        // console.log(11111);
        let result = await userModel.findOne({
            $or: [{ email: req.body.email }, { regno: req.body.regno }],
        });
        if (result)
            return res
                .status(500)
                .send({ error: "register number/email already registered" });

        result = await adminModel.findOne({
            organisation: req.body.organisation,
        });
        if (!result)
            return res.status(500).json({ error: "Organisation not found" });

        result = validate(req.body);
        if (!result) return res.status(400).json({ message: "invalid data" });
        // console.log(req.body);
        const user = await new userModel(req.body);
        user.password = "tempPassword";
        // const salt = await bcrypt.genSalt(10);
        // const hash = await bcrypt.hash(user.password, salt);
        // user.password = hash;

        result = await user.save();
        console.log(1);

        return res.json(_.pick(user, ["name", "email", "organisation"]));
        // console.log(admin);
    } catch (err) {
        console.log("error : ", err);
        return res.status(400).json({ error: err });
    }
});

router.post("/login", async (req, res) => {
    const user = await userModel.findOne({ email: req.body.email });
    if (!user) return res.status(500).send("Email doesn't exist");

    if (user.isActive == false)
        return res
            .status(500)
            .send("You do not have permission to access this account");

    // console.log(req.body.password);
    const result = await bcrypt.compare(req.body.password, user.password);
    // console.log(result);
    if (result) {
        const token = user.generateAuthToken();
        console.log(token);
        const temp = _.pick(user, ["_id", "name", "email", "organisation"]);
        temp.token = token;
        temp.error = null;
        return res.header("x-user-token", token).send(temp);
    } else {
        return res.status(400).json({
            error: "you dont have permission or password didn't match",
        });
    }
});
// router.post("/resetKey", async (req, res) => {
//     try {
//         const user = await userModel.findOne({ email: req.body.email });
//         if (!user) return res.status(500).send("Email doesn't exist");

//         const temp = await resetRequestQueueModel.findOne({ user: user._id });
//         if (temp)
//             return res
//                 .status(500)
//                 .send("You have submitted your request already!");

//         const resetReq = new resetRequestQueueModel({ user: user._id });
//         const result = await resetReq.save();
//         if (result) return res.json({ status: "done" });
//         else return res.json({ status: "failed" });
//     } catch (error) {
//         return res.status(401).send("error, reset request not sent");
//     }
// });

router.get("/forget/:email", async (req, res) => {
    const email = req.params.email;
    console.log(email);
    try {
        let result = await userModel.findOne({ email: email });
        if (result.status == 0 || result.status == 1) {
            return res.json({
                status: "password reset request is already under review",
            });
        }
        result.status = 1;
        console.log(result);

        if (result) result = await result.save();
        else return res.status(403).json({ error: "email not registered" });
        return res.json({ status: "password reset request has been sent" });
    } catch (error) {
        console.log(error);
        return res.status(403).json({ error: "reqeust not sent" });
    }
});

module.exports = router;
