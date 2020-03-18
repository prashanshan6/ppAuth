jwt = require("jsonwebtoken");
const { adminTempLoginModel } = require("../models/adminTempLogin");

async function tempAdminAuth(req, res, next) {
    const token = req.header("x-tempAdmin-token");
    if (!token)
        return res.status(401).send("access denied, token not provided");
    try {
        const tempAdmin = jwt.verify(token, process.env.secret);
        const tempAdminModel = await adminTempLoginModel.find({
            email: tempAdmin.email
        });

        if (tempAdmin.password != tempAdminModel.otp)
            return res.status(401).send("You are not a admin! ");

        req.admin = tempAdmin;
        next();
    } catch (error) {
        res.status(400).send("invalid token");
    }
}
module.exports = tempAdminAuth;
