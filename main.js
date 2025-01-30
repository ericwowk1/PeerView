const path = require("node:path");
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

<<<<<<< HEAD
const rooms = {}; // Room management
const beginStatus = {}; // Track begin counts for each room
=======
const rooms = {};  // Add this back

>>>>>>> 20ad411 (webcam webrtc logic fixed, still buggy with users joining/leaving)
// Set up view engine and static files
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

// Socket.IO setup
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

<<<<<<< HEAD

  // Handle joining a room
  socket.on("join-room", (roomId) => {
    const room = io.sockets.adapter.rooms.get(roomId); // Fetch the current room
    const size = room ? room.size : 0; // Get the current room size
  
    if (size >= 2) {
      console.log("Room is full!");
      return; // Prevent joining if the room is already full
    }
    socket.join(roomId); // Join the room only if it's not full
    //initialize array index for room counter
    if (!beginStatus[roomId]) {
      beginStatus[roomId] = { count: 0 };
    }

    if (size === 0) {
      io.to(socket.id).emit("offerer", roomId);
      console.log(`SocketId: ${socket.id} joined room: ${roomId}, room size is ${size + 1}`);
      console.log('still waiting for 2nd member to join');
      
    } else if (size === 1) {
      
      console.log(`SocketId: ${socket.id} joined room: ${roomId}, room size is ${size + 1}`);
      console.log("Ready for handshake connection");
      socket.emit("receiver", roomId);

       setTimeout(() => {
    io.to(roomId).emit("room-ready", roomId);
    console.log("Room-ready event emitted.");
  }, 1000);
    }
  });


  socket.on("begin", (roomId) => {
    const room = io.sockets.adapter.rooms.get(roomId);
    if (room) {
      // Increment the counter for the room
      beginStatus[roomId].count++;
      console.log(`Begin count for room ${roomId}: ${beginStatus[roomId].count}`);

      // Check if all clients in the room are ready
      if (beginStatus[roomId].count === 2) {
        io.to(roomId).emit("room-ready", roomId);
        console.log(`Room ${roomId} is now ready.`);
      }
    }
  });





  
  socket.on("offer", ({ offer, roomId }) => {
   
    console.log(`Server received an "offer" from ${socket.id} for room ${roomId}`);
    
    // Relay that "offer" to the other peer in the same room
    socket.to(roomId).emit("offer", { offer });
    console.log(`"offer" event relayed to room ${roomId}`);
  });

  socket.on("answer", ({ answer, roomId }) => {
  
    console.log(`Server received an "answer" from ${socket.id} for room ${roomId}`);
    
    // Relay that "answer" to the other peer in the same room
    socket.to(roomId).emit("answer", { answer });
    console.log(`"answer" event relayed to room ${roomId}`);
  });
  socket.on("add-webcam", ({roomId}) => {

    socket.to(roomId).emit("add-webcam", {roomId });
  })
  
  
  socket.on("ice-candidate", (candidate, roomId) => {
    
    console.log(`Server received an "ice-candidate" from ${socket.id} for room ${roomId}`);
    
    // Relay that "ice-candidate" to the other peer
    socket.to(roomId).emit("ice-candidate", candidate);
    
  });
 
  // Handle disconnection
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
    for (const roomId in rooms) {
      rooms[roomId] = rooms[roomId].filter((id) => id !== socket.id);
      if (rooms[roomId].length === 0) {
        delete rooms[roomId];
        console.log(`Room ${roomId} deleted.`);
      }
    }
  });
});

=======
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


>>>>>>> 20ad411 (webcam webrtc logic fixed, still buggy with users joining/leaving)
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

<<<<<<< HEAD

=======
>>>>>>> 20ad411 (webcam webrtc logic fixed, still buggy with users joining/leaving)
// Start server
server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});

// Function to generate a random room ID
function generateRandomCode(length = 5) {
<<<<<<< HEAD
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"; // Set of characters
=======
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
>>>>>>> 20ad411 (webcam webrtc logic fixed, still buggy with users joining/leaving)
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}
