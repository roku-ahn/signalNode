const SOCKET_EVENT = {
  CONNECTED: "connected",
  DISCONNECTED: "disconnect", 
  CREATEROOM : "createroom",
  CREATED: "created",
  JOIN:"join",
  READY :"ready",
  FULL:"full",
  IP:"ipaddr",
  MSG : "message",
};
const port = 7000;
const os = require('os');
const index = require("./route/index");
const path = require('path');
const usernameGen = require("username-generator");
const helmet = require("helmet");
const cors = require("cors");
const express = require("express");
const { defaultMaxListeners } = require('events');

const app = express();
app.use(index);
  

//const http = require("http").createServer(app);
//let socketio = require("socket.io")(http,{cors:{origin:"*"},});

//http.listen(port ,() =>console.log("port "+port));
//let io = socketio.listen(port);

const server = require("http").Server(app);
const io = require("socket.io")(server,{cors:{origin:"*"},});

function Log(message, data){
  console.log((new Date()).toISOString(),message ," : ", data);
};

const users = {};
Log("start", "server");
server.listen(port , ()=>{Log("server listening on port", port);});



let rooms = [];
io.sockets.on("connection", (socket) => {
  Log("get socket "+socket.id,"connection! start");   
  
  socket.join("poo");
  io.to('poo').emit("hoo");
    socket.on(SOCKET_EVENT.DISCONNECTED, (reason) => {    
      
      Log(SOCKET_EVENT.DISCONNECTED,reason);
    });


    socket.on(SOCKET_EVENT.CREATEROOM,room  => {

    Log(SOCKET_EVENT.CREATEROOM, room);
  
    let roomName = room;
    let clientsInRoom = io.sockets.adapter.rooms[roomName]; 
    
    let numClients = clientsInRoom? Object.keys(clientsInRoom.socket).length : 0;
    Log(SOCKET_EVENT.CREATEROOM,"Room" + room +" now Cnt " + numClients);

    if(numClients ==0){
      Log(1);
      socket.join(roomName);
      const id = socket.id;
      Log(SOCKET_EVENT.CREATEROOM ,"Client id" + id + ' created room ' + room);

      let numClients = clientsInRoom? Object.keys(clientsInRoom.socket).length : 0;
      Log(SOCKET_EVENT.CREATEROOM,"Room" + room +" now Cnt " + numClients);

      socket.emit(SOCKET_EVENT.CREATED, id );
    }
    else if(numClients ==1){
      Log(2);
      Log(SOCKET_EVENT.CREATEROOM,'joined room ' + room);
      socket.join(roomName);

      socket.emit(SOCKET_EVENT.JOIN,roomName);
      
      io.sockets.in(roomName).emit(SOCKET_EVENT.READY,room);
      socket.broadcast.emit(SOCKET_EVENT.READY,room)
    }
    else{
      Log(3);
      socket.emit(SOCKET_EVENT.FULL,room);
    }

    })
    socket.on(SOCKET_EVENT.IP, ()=>{
      var ifaces = os.networkInterfaces();
      for(var dev in ifaces){
        ifaces[dev].forEach(details =>{
          socket.emit(SOCKET_EVENT.IP,details.address);
        })      
      }
    });
  
    socket.on(SOCKET_EVENT.MSG
      , (msg)=>{
      Log("MSG","client :",msg );
      socket.broadcast.emit(SOCKET_EVENT.MSG,msg);
    });

    
  });

  
  