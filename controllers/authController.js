const passport = require("passport");
const mongoose = require("mongoose");
const Vacante = mongoose.model("Vacante");
const Usuarios = mongoose.model("Usuarios");
const crypto = require("crypto");
const enviarEmail = require("../handlers/email");

exports.autenticarUsuarios = passport.authenticate("local", {
  successRedirect: "/administracion",
  failureRedirect: "/iniciar-sesion",
  failureFlash: true,
  badRequestMessage: "Ambos campos son obligatorios",
});

// Revisar si el usuario está autenticado
exports.verificarUsuario = (req, res, next) => {
  // Revisar el usuario
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/iniciar-sesion");
};

exports.mostrarPanel = async (req, res) => {
  // Consultar el usuario autenticado.
  // Se puede poner .lean() para que no falle la vista, o instalando esta dependencia
  // express-handlebars@3.0.2, también funcionaría
  const vacantes = await Vacante.find({ autor: req.user._id });

  res.render("administracion", {
    nombrePagina: "Panel de Administración",
    tagline: "Crea y administra tus vacantes desde este punto",
    cerrarSesion: true,
    nombre: req.user.nombre,
    imagen: req.user.imagen,
    vacantes,
  });
};

exports.cerrarSesion = (req, res) => {
  req.logout();
  req.flash("correcto", "Sesión cerrada correctamente");
  return res.redirect("/iniciar-sesion");
};

exports.formRestablecerPassword = (req, res) => {
  res.render("restablecer-password", {
    nombrePagina: "Restablece tu Password",
    tagline:
      "Si ya tienes una cuenta pero olvidaste tu password, coloca tu email",
  });
};

// Genera el token en la tabla de Usuarios
exports.enviarToken = async (req, res) => {
  const usuario = await Usuarios.findOne({ email: req.body.email });

  if (!usuario) {
    req.flash("error", "No existe el email especificado");
    return res.redirect("/iniciar-sesion");
  }

  // Si el usuario existe, generar token
  usuario.token = crypto.randomBytes(20).toString("hex");
  usuario.expira = Date.now() + 3600000;

  await usuario.save();

  const resetUrl = `http://${req.headers.host}/restablecer-password/${usuario.token}`;

  // Enviar notificación por email
  await enviarEmail.enviar({
    usuario,
    subject: "Reset Password",
    resetUrl,
    archivo: "reset",
  });

  req.flash("correcto", "Por favor, revisa tu email");
  res.redirect("/iniciar-sesion");
};

// Valida si el token es válido y, si el usuario existe, muestra la vista
exports.restablecerPassword = async (req, res) => {
  const usuario = await Usuarios.findOne({
    token: req.params.token,
    expira: {
      $gt: Date.now(),
    },
  });

  if (!usuario) {
    req.flash("error", "El formulario de validación no es correcto");
    return res.redirect("/restablecer-password");
  }

  // Si todo va bien, mostrar el formulario
  res.render("nuevo-password", {
    nombrePagina: "Nuevo Password",
  });
};

// Almacena el nuevo password en la BD
exports.guardarPassword = async (req, res) => {
  const usuario = await Usuarios.findOne({
    token: req.params.token,
    expira: {
      $gt: Date.now(),
    },
  });

  // Si no existe el usuario o el token es inválido
  if (!usuario) {
    req.flash("error", "El formulario de validación no es correcto");
    return res.redirect("/restablecer-password");
  }

  // Asignar nuevo password, limpiar valores previos
  usuario.password = req.body.password;
  usuario.token = undefined;
  usuario.expira = undefined;

  await usuario.save();

  req.flash("correcto", "Password modificada correctamente");
  res.redirect("/iniciar-sesion");
};
