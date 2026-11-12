const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Servir archivos estaticos
app.use(express.static("public"));

const LARGO_MAXIMO_NOMBRE = 24;

// Detectar conexiones
io.on("connection", (socket) => {
    console.log("Usuario conectado", socket.id);

    // El usuario elige su nombre al entrar
    socket.on("unirse", (nombre, responder) => {
        const limpio = String(nombre ?? "").trim().slice(0, LARGO_MAXIMO_NOMBRE);
        if (!limpio) {
            if (typeof responder === "function") responder({ ok: false, error: "Escribe un nombre" });
            return;
        }
        socket.data.nombre = limpio;
        console.log("Se unio", limpio, socket.id);
        if (typeof responder === "function") responder({ ok: true, nombre: limpio });
        socket.broadcast.emit("aviso", `${limpio} ha llegado a la sala`);
    });

    // Recibir mensajes
    socket.on("mensaje", (texto) => {
        // Solo se aceptan mensajes de quien ya eligio nombre
        if (!socket.data.nombre) return;
        const limpio = String(texto ?? "").trim();
        if (!limpio) return;

        console.log("Mensaje recibido", socket.data.nombre, limpio);
        // Se envia el id (para saber si el mensaje es propio) y el nombre
        // (para mostrar en pantalla quien lo escribio)
        io.emit("mensaje", { id: socket.id, nombre: socket.data.nombre, texto: limpio });
    });

    // Detectar desconexion
    socket.on("disconnect", () => {
        console.log("Usuario desconectado", socket.id);
        if (socket.data.nombre) {
            io.emit("aviso", `${socket.data.nombre} se ha marchado`);
        }
    });
});

server.listen(3000, () => {
    console.log("Servidor activo en http://localhost:3000");
});
