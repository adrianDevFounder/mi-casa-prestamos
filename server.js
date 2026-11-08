import express from "express";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 3000;

// Token para que SOLO tu (el operador) veas el panel con las coordenadas.
// Pasalo por variable de entorno:  PANEL_TOKEN=xxxx npm start
const PANEL_TOKEN = process.env.PANEL_TOKEN || "cambia-este-token";

// Identifican QUIEN pide la ubicacion y PARA QUE. La transparencia es obligatoria:
// la persona debe saber que esta compartiendo su ubicacion y con quien.
const ORG_NOMBRE = process.env.ORG_NOMBRE || "Demo de geolocalización";
const MOTIVO = process.env.MOTIVO || "mostrar cómo se captura la ubicación en una práctica de ciberseguridad";

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Almacen simple en memoria + log en archivo.
const registros = [];
const LOG_FILE = path.join(__dirname, "ubicaciones.log");

// Config publica para que la pagina muestre el aviso (nombre y motivo).
app.get("/api/config", (req, res) => {
  res.json({ org: ORG_NOMBRE, motivo: MOTIVO });
});

// Recibe las coordenadas que el navegador entrego TRAS el permiso del usuario.
app.post("/api/location", (req, res) => {
  const { lat, lon, accuracy, consentimiento, caso } = req.body || {};

  // No guardamos nada si la persona no marco el consentimiento explicito.
  if (consentimiento !== true) {
    return res.status(400).json({ ok: false, error: "sin consentimiento" });
  }
  if (typeof lat !== "number" || typeof lon !== "number") {
    return res.status(400).json({ ok: false, error: "coordenadas invalidas" });
  }

  const registro = {
    id: crypto.randomUUID(),
    caso: typeof caso === "string" && caso.trim() ? caso.trim().slice(0, 64) : null,
    lat,
    lon,
    accuracy: typeof accuracy === "number" ? accuracy : null,
    fecha: new Date().toISOString(),
    ip: req.ip,
    userAgent: req.get("user-agent") || null,
  };

  registros.push(registro);
  fs.appendFileSync(LOG_FILE, JSON.stringify(registro) + "\n");

  console.log(
    `\n[UBICACION RECIBIDA] ${registro.fecha}\n` +
      `  caso     : ${registro.caso ?? "-"}\n` +
      `  lat, lon : ${lat}, ${lon}\n` +
      `  precision: ${registro.accuracy} m\n` +
      `  mapa     : https://www.google.com/maps?q=${lat},${lon}\n` +
      `  ip       : ${registro.ip}`
  );

  res.json({ ok: true });
});

// Panel del operador: protegido por token. Aqui ves TODAS las coordenadas.
app.get("/panel", (req, res) => {
  if (req.query.token !== PANEL_TOKEN) {
    return res
      .status(401)
      .send("No autorizado. Usa /panel?token=TU_TOKEN");
  }

  const filas = [...registros]
    .reverse()
    .map(
      (r) => `
      <tr>
        <td>${r.fecha}</td>
        <td>${r.caso ?? "-"}</td>
        <td><code>${r.lat}, ${r.lon}</code></td>
        <td>${r.accuracy ?? "-"} m</td>
        <td><a href="https://www.google.com/maps?q=${r.lat},${r.lon}" target="_blank" rel="noopener">Ver mapa</a></td>
        <td>${r.ip ?? "-"}</td>
      </tr>`
    )
    .join("");

  res.send(`<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Panel de ubicaciones</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 2rem; color: #111; }
    h1 { font-size: 1.3rem; }
    table { border-collapse: collapse; width: 100%; margin-top: 1rem; }
    th, td { border: 1px solid #ddd; padding: .5rem .7rem; text-align: left; font-size: .9rem; }
    th { background: #f3f4f6; }
    code { background: #f3f4f6; padding: .1rem .3rem; border-radius: 4px; }
    .vacio { color: #666; margin-top: 1rem; }
  </style>
</head>
<body>
  <h1>Ubicaciones recibidas (${registros.length})</h1>
  <p>Solo registros con consentimiento explicito del usuario.</p>
  ${
    registros.length
      ? `<table>
          <thead><tr><th>Fecha (UTC)</th><th>Coordenadas</th><th>Precision</th><th>IP</th></tr></thead>
          <tbody>${filas}</tbody>
        </table>`
      : `<p class="vacio">Aun no hay ubicaciones.</p>`
  }
  <p style="margin-top:1.5rem"><a href="/panel?token=${PANEL_TOKEN}">Actualizar</a></p>
</body>
</html>`);
});

app.listen(PORT, () => {
  console.log(`\nServidor en http://localhost:${PORT}`);
  console.log(`Enlace para la persona : http://localhost:${PORT}/`);
  console.log(`Tu panel (operador)    : http://localhost:${PORT}/panel?token=${PANEL_TOKEN}\n`);
});
