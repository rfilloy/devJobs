const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const mongoose = require("mongoose");
const Usuarios = mongoose.model("Usuarios");

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    async (email, password, done) => {
      const usuario = await Usuarios.findOne({
        email,
      });
      if (!usuario)
        return done(null, false, {
          message: "Usuario no dado de alta",
        });

      const verificarPass = usuario.compararPassword(password);
      if (!verificarPass)
        return done(null, false, {
          message: "Password incorrecto",
        });

      return done(null, usuario);
    }
  )
);

passport.serializeUser((usuario, done) => done(null, usuario._id));
passport.deserializeUser(async (id, done) => {
  const usuario = await Usuarios.findById(id);
  return done(null, usuario);
});

module.exports = passport;
