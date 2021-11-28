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
  OFFER : "offer",
  ANSWER :"answer",
  CANDIDATE:"cadidate",
  GETOFFER : "getoffer",
  GETANSWER :"getanswer",
  GETCANDIDATE:"getcadidate",
  
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
app.use(cors);
app.use(index);
  

//const http = require("http").createServer(app);
//let socketio = require("socket.io")(http,{cors:{origin:"*"},});

//http.listen(port ,() =>console.log("port "+port));
//let io = socketio.listen(port);

const server = require("http").Server(app);
const io = require("socket.io")(server,{cors:{origin:"*"}, 'pingInterval':300000,'pingTimeout':1500000,
});

function Log(message, data){
  console.log((new Date()).toISOString(),message ," : ", data);
};


Log("start", "server");
server.listen(port , ()=>{Log("server listening on port", port);});




let rooms = {};
const users = {};
const maximum =2;
io.sockets.on("connection", (socket) => {
  Log("get socket "+socket.id,"connection! start");   
  
    socket.on(SOCKET_EVENT.CREATEROOM,room  => {
    //  socket.join("foo");
    Log(SOCKET_EVENT.CREATEROOM, room);
    if (users[room]) {
      const length = users[room].length;
      if (length === maximum) {
        socket.to(socket.id).emit("room_full");
        return;
      }
      users[room].push({ id: socket.id });
    } else {
      users[room] = [{ id: socket.id }];
    }
    rooms[socket.id] = room;

    socket.join(room);
    console.log(`[${rooms[socket.id]}]: ${socket.id} enter`);

    const usersInThisRoom = users[room].filter(
      (user) => user.id !== socket.id
    );
    console.log(usersInThisRoom);
    //  io.sockets.to(socket.id).emit(SOCKET_EVENT.READY);
    const length = users[room].length;
    if(length === 1){
      socket.emit(SOCKET_EVENT.CREATED, socket.id );
    }
    else{
      socket.emit(SOCKET_EVENT.JOIN,room);
      io.sockets.in(room).emit(SOCKET_EVENT.READY,room);
      socket.broadcast.emit(SOCKET_EVENT.READY,room)
    }
    });



    socket.on(SOCKET_EVENT.IP, ()=>{
      var ifaces = os.networkInterfaces();
      for(var dev in ifaces){
        ifaces[dev].forEach(details =>{
          socket.emit(SOCKET_EVENT.IP,details.address);
        })      
      }
    });

    socket.on(SOCKET_EVENT.OFFER, sdp => {
      Log(SOCKET_EVENT.OFFER,  socket.id);
      Log(SOCKET_EVENT.OFFER , sdp);    
      socket.broadcast.emit(SOCKET_EVENT.GETOFFER, sdp);
    });

    socket.on(SOCKET_EVENT.ANSWER, sdp => {
      Log(SOCKET_EVENT.ANSWER,  socket.id);
        
      socket.broadcast.emit(SOCKET_EVENT.GETANSWER, sdp);
    });


    socket.on(SOCKET_EVENT.CANDIDATE, candidate => {
      Log(SOCKET_EVENT.CANDIDATE , socket.id);

      socket.broadcast.emit(SOCKET_EVENT.GETCANDIDATE, candidate);
    })

    socket.on(SOCKET_EVENT.MSG
      , (msg)=>{
      Log("MSG client :",msg );
      Log("MSG SOCKET_EVENT.MSG",socket.id );
      socket.broadcast.emit(SOCKET_EVENT.MSG,msg);
    });

    socket.on(SOCKET_EVENT.DISCONNECTED ,() =>{
      const roomID = rooms[socket.id];
      let room = users[roomID];
      if (room) {
        room = room.filter((user) => user.id !== socket.id);
        users[roomID] = room;
        if (room.length === 0) {
          delete users[roomID];
          return;
        }
      }
      socket.broadcast.to(room).emit("user_exit", { id: socket.id });
      console.log(users);

    });
    
  });

  
  