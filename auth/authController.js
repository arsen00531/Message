const mysql = require('mysql')
const jwt = require('jsonwebtoken')
const connect = require('../db/db')
const getDecodedName = require('../middlewares/getDecodedName')
const url = require('../db/url')

const connection = mysql.createPool(connect);

class authController {
	async logup(req, res) {
		try {
			const userName = req.body.userName;
			const password = req.body.password;
			connection.query(`SELECT * FROM users WHERE login = '${userName}' `, function(err, row) {
				if(row.length > 0) {
					res.render('pages/logall.ejs', {error: "Такой пользователь уже существует"})
				}
				else {
					const user = connection.query(`INSERT INTO users (login, password) VALUES ('${userName}', '${password}') `);
					res.redirect(url)
				}
			});
		}
		
		catch(e) {
			res.status(400).json({message: "reg error"})
		}
	}
	async login(req, res) {
		try {
			const userName = req.body.login;
			const password = req.body.password_log;
			
			const user = connection.query(`SELECT * FROM users WHERE login = '${userName}' `, function(err, row) {
				if(row.length > 0) {
					// found user
					if(row[0].login == userName) {
						// login correct
						const pass = row[0].password;
					    if(pass == password) {
					    	// password correct
					    	const token = jwt.sign(userName, 'shhhhh');
							res.cookie(row[0].id, token)
							res.redirect(url)
						}
						else {
							// Password is not correct
							res.render('pages/unlogged.ejs', {error: "Не верный пароль"})
						}
					}
					else {
						// login is not correct
						console.log('login is not correct')
					}
				}
				else {
					// user was not registered
					res.render('pages/logall.ejs', {error: "Зарегистрируйся"})
				}
			});
		}

		catch(e) {
			// error
			res.status(400).json({message: "reg error"})
		}
	}

	async logout(req, res) {
		try {
			req.headers.cookie.split(';').forEach((value) => {
				const decoded = jwt.decode(value.split('=')[1])
				if (decoded != null) {
					res.clearCookie(value);
            		res.redirect(url)
				}
			})
		}

		catch(e) {
			// error
			res.status(400).json({message: "reg error"})
		}
	}

	async users(req, res) {
		try {
		const decoded = jwt.decode(getDecodedName(req.headers.cookie))
		connection.query(`SELECT * FROM users WHERE login NOT IN ('${decoded}')`, function(err, row) {
		  		if(err) return console.log(err)
		  		res.render('pages/users.ejs', {row: row, name: decoded})
			});
		}

		catch(e) {
			// error
			res.status(400).json({message: "reg error"})
		}
	}
}

module.exports = new authController();