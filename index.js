const mongoose = require("mongoose");
require("./config/db");

const express = require("express");
const exphbs = require("express-handlebars");
const path = require("path");
const router = require("./routes");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const mongoStore = require("connect-mongo")(session); // Le pasa como parámetro la sesión
const bodyParser = require("body-parser");
const expressValidator = require("express-validator");
const flash = require("connect-flash");
const createError = require("http-errors");
const passport = require("./config/passport");
const { resourceUsage } = require("process");

require("dotenv").config({ path: "variables.env" });

const app = express();

// Habilitar body-parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Validación de campos
app.use(expressValidator());

// Habilitar Handlebars como views
app.engine(
  "handlebars",
  exphbs({
    defaultLayout: "layout",
    // extname: ".handlebars",
    // partialsDir: 'views/emails',
    // Funciones de javascript que se inyectan en la plantilla
    helpers: require("./helpers/handlebars"),
  })
);

app.set("view engine", "handlebars");

// Ficheros estáticos
app.use(express.static(path.join(__dirname, "public")));

app.use(cookieParser());

app.use(
  session({
    // Necesario para firmar la sesión
    secret: process.env.SECRETO,
    key: process.env.KEY,
    resave: false,
    saveUninitialized: false,
    store: new mongoStore({ mongooseConnection: mongoose.connection }),
  })
);

// Inicializar passport
app.use(passport.initialize());
app.use(passport.session());

// Alertas y flash messages
app.use(flash());

// Crear nuestro middleware
app.use((req, res, next) => {
  res.locals.mensajes = req.flash();
  next();
});

app.use("/", router());

// Error 404: Página no existente
app.use((req, res, next) => {
  next(createError(404, "No Encontrado"));
});

// Administración de errores
app.use((error, req, res) => {
  res.locals.mensaje = error.message;
  const status = error.status || 500;
  res.locals.status = status;
  res.status(status);
  res.render("error");
});

// Dejar que Heroku asigne el puerto
const host = "0.0.0.0";
const port = process.env.PORT;

app.listen(port, host, () => {
  console.log("El servidor está funcionando");
});
