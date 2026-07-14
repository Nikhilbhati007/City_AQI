const { Server } = require("socket.io");

let io;

const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: "*"
        }
    });

    io.on("connection", (socket) => {

        console.log("Connected:", socket.id);

        socket.on("disconnect", () => {
            console.log("Disconnected:", socket.id);
        });

    });

    return io;
};

const getIO = () => io;

module.exports = {
    initSocket,
    getIO
};