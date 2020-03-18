const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const resetRequestQueueSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user"
    }
});

const resetRequestQueueModel = new mongoose.model(
    "resetRequestQueue",
    resetRequestQueueSchema
);

module.exports.resetRequestQueueModel = resetRequestQueueModel;
