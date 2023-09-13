const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const fs = require('fs');
const mysql = require('mysql');
const connect = require('../db/db')
const getDecodedName = require('../middlewares/getDecodedName')

const connection = mysql.createPool(connect, (err) => {
	if (err) throw err
	console.log('connect')
});

router.get('/', (req, res) => {
	var cooki = req.headers.cookie;
	if(cooki === undefined) {
		res.render('pages/unlogged.ejs', {error: undefined})
	}
	else {
		const decoded = jwt.decode(getDecodedName(cooki))
		connection.query("SELECT * FROM ajax_chat", function(err, row) {
			if(err) return console.log(err)
			res.render('pages/logged.ejs', {row: row, my_name: decoded, count: row.length})
		})
	}
	
})

router.get('/login', (req, res) => {
	res.render('pages/unlogged.ejs', {error: undefined})
})

router.get('/logall', (req, res) => {
	res.render('pages/logall.ejs', {error: undefined})
})

router.get('/chat', (req, res) => {
	const second = req.query.id
	const decoded = jwt.decode(getDecodedName(req.headers.cookie))

	var query = "SELECT * FROM `one_to_one` WHERE name = '"+ decoded +"' AND second_name = '"+ second +"' OR  name = '"+ second +"' AND second_name = '"+ decoded +"'";
	var result = connection.query(query, function(err, row) {
		if(err) return console.log(err)
		res.render('pages/anonim.ejs', {row: row, second: second, my_name: decoded, count: row.length})
	});
})

router.get("/profile", (req, res) => {
	const decoded = jwt.decode(getDecodedName(req.headers.cookie))
	var login = req.query.login;
	if(decoded == login) {
		connection.query("SELECT * FROM `users` WHERE login = '"+ login +"'", function(err, row) {
			res.render('pages/profile.ejs', {row: row, name: decoded})
		})
	}
	else {
		connection.query("SELECT * FROM `users` WHERE login = '"+ login +"'", function(err, row) {
			res.render('pages/profile_guest.ejs', {row: row, name: decoded})
		})
	}
})

router.post("/profile", function (req, res) {
	const decoded = jwt.decode(getDecodedName(req.headers.cookie))
	const login = req.query.login;
	const filedata = req.file;
	connection.query("SELECT * FROM `users` WHERE login = '"+ login +"'", function(err, row) {
		if (row[0].image == "camera.png") {
			var filedata = req.file;
		  if(filedata == undefined) {
		    res.send("Ошибка при загрузке файла");
		  }
		  else {
		  	connection.query("UPDATE `users` SET `image`='"+ filedata.filename +"' WHERE login = '"+ login +"' ")
		    res.render('pages/checked.ejs', {row: row, name: decoded, file: filedata.filename})
		  }

		}
		else {
			var path1 = "user_images/" + row[0].image
			if(fs.existsSync(path1)) {
				fs.unlinkSync(path1);
				var filedata = req.file;
			  if(!filedata) {
			    res.send("Ошибка при загрузке файла");
			  }
			  else {
			  	connection.query("UPDATE `users` SET `image`='"+ filedata.filename +"' WHERE login = '"+ login +"' ")
			    res.render('pages/checked.ejs', {row: row, name: decoded, file: filedata.filename})
			  }
			}
			else {
				var filedata = req.file;
				if(!filedata) {
					res.send("Ошибка при загрузке файла");
				}
				else {
					connection.query("UPDATE `users` SET `image`='"+ filedata.filename +"' WHERE login = '"+ login +"' ")
			  	res.render('pages/checked.ejs', {row: row, name: decoded, file: filedata.filename})
				}
				
			}
			
		}
	})
  
});

module.exports = router