const path = require("node:path");
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  allowUpgrades: true,
  transports: ['websocket', 'polling']
});

const rooms = new Map(); // Track room states instead of socket states

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

io.on("connection", (socket) => {
  socket.on("join-room", (roomId) => {
    const room = io.sockets.adapter.rooms.get(roomId);
    const size = room ? room.size : 0;

    if (size >= 2) {
      console.log("Room is full!");
      return;
    }

    socket.join(roomId);
    
    if (rooms.has(roomId)) {
      const roomState = rooms.get(roomId);
      roomState.participants.add(socket.id);
    } else {
      // New room
      rooms.set(roomId, {
        created: Date.now(),
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

  socket.on("offer", ({description}, roomId) => {
    socket.to(roomId).emit("offer", { description });
  });

  socket.on('answer', ({description}, roomId) => {
    socket.to(roomId).emit('answer', { description });
  });

  socket.on('ice-candidate', ({ candidate, roomId }) => {
    socket.to(roomId).emit('ice-candidate', { candidate });
  });
  socket.on('manual-disconnect', () => {
    // Find which room this socket was in
    for (const [roomId, roomState] of rooms.entries()) {
      if (roomState.participants.has(socket.id)) {
        // Remove this participant
        roomState.participants.delete(socket.id);
        
        // Notify remaining participants in the room
        socket.to(roomId).emit('peer-disconnected');
        
        // If room is empty, clean it up
        if (roomState.participants.size === 0) {
          rooms.delete(roomId);
        }
        
        console.log(`User ${socket.id} manually disconnected from room ${roomId}`);
        break;
      }
    }
    // Disconnect the socket
    socket.disconnect(true);
  });

  socket.on('disconnect', () => {
    // Keep existing disconnect handler for unexpected disconnections
    for (const [roomId, roomState] of rooms.entries()) {
      if (roomState.participants.has(socket.id)) {
        roomState.participants.delete(socket.id);
        socket.to(roomId).emit('peer-disconnected');
        if (roomState.participants.size === 0) {
          rooms.delete(roomId);
        }
        console.log(`User ${socket.id} disconnected from room ${roomId}`);
        break;
      }
    }
  });
}); // End of io.on("connection") callback

app.get("/", (req, res) => {
  const message = req.query.disconnected ? "The other participant disconnected from the room." : null;
  res.render("home");
});

app.get("/create-room", (req, res) => {
  const roomId = generateRandomCode();
  res.redirect(`/room/${roomId}`);
});

app.get("/room/:id", (req, res) => {
  const roomId = req.params.id.toUpperCase();
  // Validate room ID format
  if (!/^[A-Z]{5}$/.test(roomId)) {
      return res.redirect('/?error=invalid');
  }
  res.render("room", { roomId: roomId });
});

app.get("/room", (req, res) => {
  const roomId = req.query.id.toUpperCase();
  // Redirect to the room/:id route
  res.redirect(`/room/${roomId}`);
});

const port = process.env.PORT || 3000;

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

function generateRandomCode(length = 5) {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}