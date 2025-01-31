const path = require("node:path");
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const rooms = new Map(); // Track room states instead of socket states

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

io.on("connection", (socket) => {
  socket.on("request-offset", (roomId, callback) => {
    const offset = Date.now();
    if (rooms.has(roomId)) {
      const roomState = rooms.get(roomId);
      roomState.currentOffset = offset;
    }
    callback(offset);
  });

  socket.on("join-room", (roomId, offset) => {
    const room = io.sockets.adapter.rooms.get(roomId);
    const size = room ? room.size : 0;

    if (size >= 2) {
      console.log("Room is full!");
      return;
    }

    socket.join(roomId);
    
    // Check if this is a reconnection with valid offset
    if (rooms.has(roomId)) {
      const roomState = rooms.get(roomId);
      if (offset && roomState.lastOffset === offset) {
        console.log(`Valid reconnection for room ${roomId} with offset ${offset}`);
        socket.emit('ispolite');
        socket.emit('initiate-reconnect');
      }
      roomState.participants.add(socket.id);
    } else {
      // New room
      rooms.set(roomId, {
        created: Date.now(),
        currentOffset: null,
        lastOffset: null,
        participants: new Set([socket.id])
      });
    }

    if (size === 0) {
      console.log(`First user joined room ${roomId}: ${socket.id}`);
    } else if (size === 1) {
      console.log(`Second user joined room ${roomId}: ${socket.id}`);
      socket.emit('ispolite');
      io.to(roomId).emit('haspeer');
    }
  });

  socket.on("client-disconnect", ({ roomId }, offset, callback) => {
    if (rooms.has(roomId)) {
      const roomState = rooms.get(roomId);
      if (offset === roomState.currentOffset) {
        roomState.lastOffset = offset;
        roomState.participants.delete(socket.id);
        console.log(`User ${socket.id} disconnected from room ${roomId} with valid offset ${offset}`);
        callback({ success: true });
      } else {
        console.log(`Invalid offset for room ${roomId}: expected ${roomState.currentOffset}, got ${offset}`);
        callback({ success: false });
      }
    }
  });

  socket.on("offer", ({description}, roomId) => {
    socket.to(roomId).emit("offer", { description });
  });

  socket.on('answer', ({description}, roomId) => {
    socket.to(roomId).emit('answer', { description });
  });

  socket.on('ice-candidate', ({ candidate, roomId }) => {
    socket.to(roomId).emit('ice-candidate', { candidate });
  });

  socket.on('disconnect', () => {
    rooms.forEach((state, roomId) => {
      if (state.participants.has(socket.id)) {
        state.participants.delete(socket.id);
        console.log(`User ${socket.id} disconnected from room ${roomId} - keeping room state`);
      }
    });
  });
});

app.get("/", (req, res) => {
  res.render("home");
});

app.get("/create-room", (req, res) => {
  const roomId = generateRandomCode();
  res.redirect(`/room/${roomId}`);
});

app.get("/room/:id", (req, res) => {
  res.render("room", { roomId: req.params.id });
});

server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});

function generateRandomCode(length = 5) {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}