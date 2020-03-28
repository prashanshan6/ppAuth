jwt = require("jsonwebtoken");

function auth(req, res, next) {
    const token = req.header("x-admin-token");
    if (!token)
        return res.status(401).send("access denied, token not provided");
    try {
        const user = jwt.verify(token, process.env.secret);

        if (!user)
            return res.status(400).json({ error: "invalid/expired token" });
        req.admin = user;
        // console.log(req.admin);

        next();
    } catch (error) {
        res.status(400).send("invalid token");
    }
}
module.exports = auth;
