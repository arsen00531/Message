const express = require('express');
const app = express();
const server = require('http').createServer(app);
const { Server } = require("socket.io");
const io = new Server(server)
const multer  = require("multer");
const authRouter = require('./auth/authRouter.js');
const mysql = require('mysql');
const connect = require('./db/db.js')
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const PORT = 3000;

const connection = mysql.createPool(connect, (err) => {console.log(err)});

app.use(express.json())

app.use("/", authRouter);

app.use(require('cors')())

app.use(express.static(__dirname + '/'));
app.use(bodyParser.urlencoded({extend:false}));
app.use(bodyParser.json());
app.use(multer({dest:"user_images"}).single("file"));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.set('views', __dirname);

server.listen(PORT);

function getDecodedName(cookies) {
	cookies = cookies.split(';')
  	for (var i = 0; i < cookies.length; i++) {
		var cookie = cookies[i];
		var eqPos = cookie.indexOf("=") + 1;
		var leng = cookie.length - eqPos
		var name = eqPos > -1 ? cookie.substr(eqPos, leng) : cookie;
		var login = name;
		var decoded = jwt.decode(login)
    return decoded
  }
}

app.get('/', (req, res) => {
	var cooki = req.headers.cookie;
	if(cooki === undefined) {
		res.render('auth/unlogged.ejs', {error: undefined})
	}
	else {
		const decoded = getDecodedName(cooki)
		connection.query("SELECT * FROM ajax_chat", function(err, row) {
			if(err) return console.log(err)
			res.render('pages/logged.ejs', {row: row, my_name: decoded, count: row.length})
		});
	}
	
})

app.get('/login', (req, res) => {
	res.render('pages/unlogged.ejs', {error: undefined})
})

app.get('/logall', (req, res) => {
	res.render('pages/logall.ejs', {error: undefined})
})

app.get('/chat', (req, res) => {
	const second = req.query.id
	const cookie = req.headers.cookie
	const decoded = getDecodedName(cookie)

	var query = "SELECT * FROM `one_to_one` WHERE name = '"+ decoded +"' AND second_name = '"+ second +"' OR  name = '"+ second +"' AND second_name = '"+ decoded +"'";
	var result = connection.query(query, function(err, row) {
		if(err) return console.log(err)
		res.render('pages/anonim.ejs', {row: row, second: second, my_name: decoded, count: row.length})
	});
})

app.get("/profile", (req, res) => {
	var cooki = req.headers.cookie.split(";");
	for (var i = 0; i < cooki.length; i++) {
    var cookie = cooki[i];
    var eqPos = cookie.indexOf("=") + 1;
    var leng = cookie.length - eqPos
    var name = eqPos > -1 ? cookie.substr(eqPos, leng) : cookie;
  }
  var decoded = jwt.decode(name)
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

app.post("/profile", function (req, res) {
	var cooki = req.headers.cookie.split(";");
	for (var i = 0; i < cooki.length; i++) {
    var cookie = cooki[i];
    var eqPos = cookie.indexOf("=") + 1;
    var leng = cookie.length - eqPos
    var name = eqPos > -1 ? cookie.substr(eqPos, leng) : cookie;
  }
  var decoded = jwt.decode(name)
	var login = req.query.login;
	var filedata = req.file;
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

users = [];
connections = [];

io.sockets.on('connection', function (socket) {
	console.log("Успешное соединение");
	connections.push(socket);

	socket.on('disconnect', function (data) {
		connections.splice(connections.indexOf(socket), 1);
		console.log("Отключились");
	});

	socket.on('send mess', function (data) {
		connection.query("SELECT * FROM `ajax_chat`", function(err, row) {
			io.sockets.emit('add mess', {mess: data.mess, name: data.name, count: row.length + 1});
		})
		
		var query = "INSERT INTO `ajax_chat` (name, text) VALUES ('"+ data.name +"', '"+ data.mess +"')"
		connection.query(query);
	});

	// one_to_one
	socket.on('send', function(data) {
		var decoded = jwt.decode(data.name)
		connection.query(" INSERT INTO `one_to_one` (text, name, second_name) VALUES ('"+ data.mess +"', '"+ decoded +"', '"+ data.second_name +"')" )

		var query = "SELECT * FROM `one_to_one` WHERE name = '"+ decoded +"' AND second_name = '"+ data.second_name +"' OR  name = '"+ data.second_name +"' AND second_name = '"+ decoded +"'";

		connection.query(query, function(err, row) {
			io.sockets.emit('give', {mess: data.mess, name: decoded, count: row.length + 1})
		})
	})
});