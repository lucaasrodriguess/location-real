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
// Agora usa o userName como chave
let userLocations = {}; // { userName: { latitude, longitude, updatedAt } }

// 🛰️ Quando um cliente se conecta via socket
io.on("connection", (socket) => {
  console.log(chalk.green("🛰️ Nova conexão Socket.IO"));

  // Recebe localização do app
  socket.on("sendLocation", (data) => {
    const { userName, latitude, longitude } = data;
    if (!userName || !latitude || !longitude) return;

    userLocations[userName] = {
      latitude,
      longitude,
      updatedAt: new Date(),
    };

    // Emite atualização apenas para viewers desse usuário
    io.emit(`locationUpdate-${userName}`, {
      latitude,
      longitude,
      updatedAt: new Date(),
    });

    console.log(
      chalk.blue(
        `📍 Localização recebida de ${userName}: ${latitude}, ${longitude}`
      )
    );
  });

  socket.on("disconnect", () => {
    console.log(chalk.yellow("❌ Conexão Socket.IO encerrada"));
  });
});

// 📍 Endpoint para obter última localização de um usuário
app.get("/api/location/:userName", (req, res) => {
  const { userName } = req.params;
  const loc = userLocations[userName];

  if (!loc) {
    return res.status(404).json({ message: "Usuário ainda não enviou localização" });
  }

  res.json(loc);
});

// 🌎 Página pública com o mapa (viewer.html)
app.get("/track/:userName", (req, res) => {
  res.sendFile(path.join(process.cwd(), "viewer.html"));
});

// 🩺 Rota raiz só para confirmar que o servidor está rodando
app.get("/", (req, res) => {
  res.send("✅ Servidor SafeHer ativo e rodando!");
});

// 🚀 Inicializa o servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(chalk.cyan(`🚀 Servidor rodando na porta ${PORT}`));
});
