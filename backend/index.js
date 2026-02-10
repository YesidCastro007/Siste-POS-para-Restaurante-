const express = require("express")
const cors = require("cors")

const app = express()
const PORT = 8080

app.use(cors())
app.use(express.json())

// Ruta de prueba
app.get("/", (req, res) => {
  res.send("Servidor backend activo 🚀")
})

// Ejemplo API
app.get("/usuarios", (req, res) => {
  res.json([
    { id: 1, nombre: "Admin" },
    { id: 2, nombre: "Mesero" }
  ])
})

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`)
})
