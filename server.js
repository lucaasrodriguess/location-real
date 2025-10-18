import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import chalk from "chalk";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

app.use(cors());
app.use(express.json());

let userLocations = {}; // { userId: { lat, lon, timestamp } }

// 🔥 Quando o app envia localização
io.on("connection", (socket) => {
  console.log(chalk.green("🛰️ Nova conexão Socket.IO"));

  socket.on("sendLocation", (data) => {
    const { userId, latitude, longitude } = data;
    userLocations[userId] = {
      lat: latitude,
      lon: longitude,
      timestamp: new Date(),
    };

    // Envia a todos os viewers
    io.emit("locationUpdate", { userId, latitude, longitude });

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

// 📍 Endpoint pra obter última localização
app.get("/api/location/:userId", (req, res) => {
  const { userId } = req.params;
  const loc = userLocations[userId];
  if (!loc) return res.status(404).json({ message: "Usuário ainda não enviou localização" });
  res.json(loc);
});

// 🌎 Página pública com o mapa
app.get("/track/:userId", (req, res) => {
  res.sendFile(process.cwd() + "/viewer.html");
});

// 🚀 Inicia servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(chalk.cyan(`🚀 Servidor rodando na porta ${PORT}`));
});
