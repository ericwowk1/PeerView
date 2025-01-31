const path = require("node:path");
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const rooms = {};  // Add this back

// Set up view engine and static files
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

// Socket.IO setup
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Handle joining a room
  socket.on("join-room", (roomId) => {
    const room = io.sockets.adapter.rooms.get(roomId);
    const size = room ? room.size : 0;
  
    if (size >= 2) {
        console.log("Room is full!");
        return;
    }
    socket.join(roomId);

    if (size === 0) {
        console.log(`First user joined: ${socket.id}`);
        
    } else if (size === 1) {
        console.log(`Second user joined: ${socket.id}`);
        socket.emit('ispolite');  // Only emit to this socket
        io.to(roomId).emit('haspeer');
    }
});

  socket.on("offer", ({description}, roomId) => {
    socket.to(roomId).emit("offer", { description });
  })
  socket.on('answer', ({description}, roomId) => {
    socket.to(roomId).emit('answer', { description });
});

socket.on('ice-candidate', ({ candidate, roomId }) => {
  socket.to(roomId).emit('ice-candidate', { candidate });
});

});


// Routes
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

// Start server
server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});

// Function to generate a random room ID
function generateRandomCode(length = 5) {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}
