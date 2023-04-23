const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose')
const PORT = process.env.PORT || 80;
const userRoutes = require('./routes');
const app = express();
const http = require("http");
const {Server} =require("socket.io");
const cookieParser = require("cookie-parser")

app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({extended:false}))
app.use('/api',userRoutes)

var DB ='mongodb+srv://anuragjha:anuragjha%40123@cluster0.hwpqbgw.mongodb.net/?retryWrites=true&w=majority';
mongoose.connect(DB,{
    useNewurlParser: true,
    useUnifiedTopology:true,
}).then(()=>{
    console.log('connection successful');
}).catch((err) =>console.log('no connection',err));

const server = http.createServer(app);

const io = new Server(server,{
    cors:{
        origin:"http://localhost:3000",
        credentials:true
    }
})
global.activeUsers =[]
io.on("connection",(Socket)=>{
    console.log("user connected")
    Socket.on('new-user-add',(newUserId)=>{
    if(!activeUsers.some((user)=>user.userId === newUserId)){
            activeUsers.push({
                userId: newUserId,
                socketId: Socket.id
            })
    }
    console.log("Connected",activeUsers);
    io.emit('get-user',activeUsers)
})
Socket.on('send-message',(data)=>{
    const reciverId = data.to;
    const sendUserSocket = activeUsers.find((user)=>user.userId === reciverId); 
    if(sendUserSocket){
       io.to(sendUserSocket.socketId).emit('receive-message',data.messages)
     }
})
Socket.on('logout', () => {
    Socket.disconnect();
  });
Socket.on("disconnect",()=>{
    activeUsers = activeUsers.filter((user)=>user.socketId !== Socket.id);
    console.log("Disonnected",activeUsers);
    io.emit('get-user',activeUsers)
})
})
server.listen(PORT,()=>{
    console.log(`server started on port ${PORT}`)
})
