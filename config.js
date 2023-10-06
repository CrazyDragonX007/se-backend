const env = require("dotenv");
env.config();
module.exports = {
    db_string: process.env.DATABASE_CONNECTION_STRING,
    port: process.env.PORT,
    session_secret: process.env.SESSION_SECRET
}