crypto = require("crypto");

async function run() {
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = crypto
        .pbkdf2Sync("abc", salt, 1000, 64, `sha512`)
        .toString(`hex`);

    console.log(salt);
    console.log(hash);
}

run();
