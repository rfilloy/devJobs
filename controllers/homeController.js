const mongoose = require("mongoose");
const Vacante = mongoose.model("Vacante");

exports.mostrarTrabajos = async (req, res, next) => {
  const vacantes = await Vacante.find().lean(); // Consultas más rápidas con .lean()

  if (!vacantes) return next();

  res.render("home", {
    nombrePagina: "devJobs",
    tagline: "Encuentra y publica trabajos para desarrolladores Web",
    barra: true,
    boton: true,
    vacantes,
  });
};
