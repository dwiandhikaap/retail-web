const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session)

const options = {
	host: process.env.SESSION_HOST,
	port: process.env.SESSION_PORT,
    user: process.env.SESSION_USER,
    password: process.env.SESSION_PASSWORD,
    database: process.env.SESSION_NAME
};

const sessionStore = new MySQLStore(options);

module.exports = {
    sessionStore : sessionStore,
}