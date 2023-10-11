module.exports = (server) => {
    const mysql = require('mysql');
    const connect = require('../db/db.js')

    const connection = mysql.createPool(connect, (err) => {console.log(err)});

    const { Server } = require("socket.io");
    const io = new Server(server)
    let connections = [];

    io.sockets.on('connection', function (socket) {
        console.log("Успешное соединение");
        connections.push(socket);

        socket.on('disconnect', function (data) {
            connections.splice(connections.indexOf(socket), 1);
            console.log("Отключились");
        });

        socket.on('send mess', function (data) {
            connection.query("SELECT * FROM ajax_chat", function(err, row) {
                io.sockets.emit('add mess', {mess: data.mess, name: data.name, count: row.length + 1});
            })
            
            connection.query(`INSERT INTO ajax_chat (name, text) VALUES ('${data.name}', '${data.mess}')`);
        });

        // one_to_one
        socket.on('send', function(data) {
            let decoded = jwt.decode(data.name)
            connection.query(`INSERT INTO one_to_one (text, name, second_name) VALUES ('${data.mess}', '${decoded}', '${data.second_name}')` )

            const query = `SELECT * FROM one_to_one WHERE name = '${decoded}' AND second_name = '${data.second_name}' OR name = '${data.second_name}' AND second_name = '${decoded}'`;

            connection.query(query, function(err, row) {
                io.sockets.emit('give', {mess: data.mess, name: decoded, count: row.length + 1})
            })
        })
    });
}