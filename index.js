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
app.use(
  helmet({contentSecurityPolicy:false,})
  );


const http = require("http").createServer(app);
const io = require("socket.io")(http,{cors:{origin:"*"},});

function Log(message, data){
  console.log((new Date()).toISOString(),message, data);
};

const users = {};
Log("start");

const port = 7000;

Log("server listening on port", port);

let rooms = [];
io.on("connection", (socket) => {
  Log("connection! start");   

    socket.on(SOCKET_EVENT.DISCONNECTED, (reason) => {    
      
      Log(SOCKET_EVENT.DISCONNECTED,reason);
    });


    socket.on(SOCKET_EVENT.CREATEROOM,room  => {
    Log("recive CREATEROOM" + room);

    let clientsInRoom = io.sockets.adapter.rooms[room];    
    let numClients = clientsInRoom? Object.keys(clientsInRoom.socket).length : 0;
    Log("Room" + room +" now Cnt" + numClients);

    if(numClients ===0){
      socket.join(room);
      Log("Client id"+ socket.id + 'created room' + room);
      socket.emit(SOCKET_EVENT.CREATED,socket.id);
    }
    else if(numClients ===1){
      Log("Client id"+ socket.id + 'joined room' + room);
      io.sockets.in(room).emit(SOCKET_EVENT.JOIN,room,socket.id);
      io.sockets.in(room).emit(SOCKET_EVENT.READY);
    }
    else{
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
      Log("client :",msg );
      socket.broadcast.emit(SOCKET_EVENT.MSG,msg);
    });

    
  });

  

  http.listen(port ,() =>console.log("port "+port));