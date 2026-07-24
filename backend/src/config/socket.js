import { Server } from "socket.io";

let io;

export const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: "*", // Allow all origins for now (can be restricted to frontend URL later)
            methods: ["GET", "POST", "PUT", "DELETE"]
        }
    });

    io.on("connection", (socket) => {
        console.log("New client connected:", socket.id);

        // When a user connects from frontend, they emit their userId to join their private room
        socket.on("join_room", (userId) => {
            socket.join(userId);
            console.log(`User ${userId} joined their personal room.`);
        });

        socket.on("disconnect", () => {
            console.log("Client disconnected:", socket.id);
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error("Socket.io not initialized!");
    }
    return io;
};
