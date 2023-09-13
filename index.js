const express = require('express')
const app = express()
const server = require('http').createServer(app)
const multer  = require("multer")
const userRouter = require('./src/user-router.js')
const authRouter = require('./auth/authRouter')
const io = require('./socket/io')
const bodyParser = require('body-parser')
const PORT = process.env.PORT || 3000

io(server)

app.use(express.json())
app.use("/", authRouter);
app.use("/", userRouter);
app.use(require('cors')())
app.use(express.static(__dirname + '/'));
app.use(bodyParser.urlencoded({extend:false}));
app.use(bodyParser.json());
app.use(multer({dest:"user_images"}).single("file"));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.set('views', __dirname);

server.listen(PORT, () => console.log(PORT))