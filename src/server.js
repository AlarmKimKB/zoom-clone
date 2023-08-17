import http from "http";
// import WebSocket from "ws";
import express from "express";
import { Server } from "socket.io";
import { instrument } from "@socket.io/admin-ui";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"))
app.get("/", (req, res) => res.render("home"));
app.get("/*", (req, res) => res.redirect("/"));

const handleListen = () => console.log(`Listening on http://localhost:3000`);

const httpServer = http.createServer(app);
const wsServer = new Server(httpServer, {
  cors: {
    origin: ["https://admin.socket.io"],
    credentials: true,
  }
});

instrument(wsServer, {
  auth: false
})

// Public Room 체크 함수
function publicRooms() {
  const {
    sockets: {
      adapter: { sids, rooms },
    },
  } = wsServer

  const publicRooms = [];
  rooms.forEach((_, key) => {
    if (sids.get(key) === undefined) {
      publicRooms.push(key);
    }
  })
  return publicRooms;
};

// Room 안에 사람이 얼마나 있는 지 확인
function countRoom(roomName) {
  return wsServer.sockets.adapter.rooms.get(roomName)?.size;
}

// SocketIO 연결
wsServer.on("connection", socket => {
  socket["nickname"] = "Anon";
  socket.onAny((event) => {
    console.log(`Socket Event: ${event}`);
  });

  // Room 입장 시 출력
  socket.on("enter_room", (roomName, done) => {
    socket.join(roomName);
    done();

    socket.to(roomName).emit("welcome", socket.nickname, countRoom(roomName));
    wsServer.sockets.emit("room_change", publicRooms());
  });

  // Room 퇴장 시 출력
  socket.on("disconnecting", () => {
    socket.rooms.forEach((room) => socket.to(room).emit("bye", socket.nickname, countRoom(room) - 1))
  });

  // Room 제거 시 출력
  socket.on("disconnect", () => {
    wsServer.sockets.emit("room_change", publicRooms());
  })

  // Message 입력 시 출력
  socket.on("new_message", (msg, room, done) => {
    socket.to(room).emit("new_message", `${socket.nickname}: ${msg}`);
    done();
  });

  // Nickname 출력
  socket.on("nickname", (nickname) => (socket["nickname"] = nickname));
});

// # Web Socket Code
// const wss = new WebSocket.Server({ server });
// const sockets = [];
// wss.on("connection", (socket) => {
//   sockets.push(socket);
//   socket["nickname"] = "Anno";
//   console.log("Connected to Browser !")
//   socket.on("close", () => {console.log("Disconnected to Browser X")})
//   socket.on("message", (msg) => {
//     const message = JSON.parse(msg);
//     switch (message.type) {
//       case "new_message":
//         sockets.forEach((aSocket) => aSocket.send(`${socket.nickname}: ${message.payload}`.toString('utf8')));
//         break;
//       case "nickname":
//         socket["nickname"] = message.payload;
//         break;
//     }
//   });
// });

httpServer.listen(3000, handleListen);