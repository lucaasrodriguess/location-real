import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import chalk from "chalk";
import path from "path";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

app.use(cors());
app.use(express.json());

// 🗺️ Armazena a localização dos usuários em memória
let userLocations = {}; // { userId: { latitude, longitude, updatedAt } }

// 🛰️ Quando um cliente se conecta via socket
io.on("connection", (socket) => {
  console.log(chalk.green("🛰️ Nova conexão Socket.IO"));

  // Recebe localização do app
  socket.on("sendLocation", (data) => {
    const { userId, latitude, longitude } = data;
    if (!userId || !latitude || !longitude) return;

    userLocations[userId] = {
      latitude,
      longitude,
      updatedAt: new Date(),
    };

    // Emite atualização apenas para viewers do mesmo usuário
    io.emit(`locationUpdate-${userId}`, {
      latitude,
      longitude,
      updatedAt: new Date(),
    });

    console.log(
      chalk.blue(
        `📍 Localização recebida de ${userId}: ${latitude}, ${longitude}`
      )
    );
  });

  socket.on("disconnect", () => {
    console.log(chalk.yellow("❌ Conexão Socket.IO encerrada"));
  });
});

// 📍 Endpoint para obter última localização de um usuário
app.get("/api/location/:userId", (req, res) => {
  const { userId } = req.params;
  const loc = userLocations[userId];

  if (!loc) {
    return res.status(404).json({ message: "Usuário ainda não enviou localização" });
  }

  res.json(loc);
});

// 🌎 Página pública com o mapa (viewer.html)
app.get("/track/:userId", (req, res) => {
  res.sendFile(path.join(process.cwd(), "viewer.html"));
});

// 🩺 Rota raiz só para confirmar que o servidor está rodando
app.get("/", (req, res) => {
  res.send("✅ Servidor SafeHer ativo e rodando!");
});

// 🚀 Inicializa o servidor
const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(chalk.cyan(`🚀 Servidor rodando na porta ${PORT}`));
});
