const mongoose = require("mongoose");
const Usuarios = mongoose.model("Usuarios");
const multer = require("multer");
const shortid = require("shortid");

exports.formCrearCuenta = (req, res) => {
  res.render("crear-cuenta", {
    nombrePagina: "Crea tu cuenta en DevJobs",
    tagline:
      "Comienza a publicar tus ofertas gratis. Solo tienes que crear una cuenta",
  });
};

exports.validarRegistro = (req, res, next) => {
  // Sanitizar los campos para que no se inserten caracteres extraños
  req.sanitizeBody("nombre").escape();
  req.sanitizeBody("email").escape();
  req.sanitizeBody("password").escape();
  req.sanitizeBody("confirmar").escape();

  req.checkBody("nombre", "El Nombre es obligatorio").notEmpty();
  req.checkBody("email", "El email debe tener un formato válido").isEmail();
  req.checkBody("password", "El password no puede ir vacío").notEmpty();
  req.checkBody("confirmar", "Confirmar password no puede ir vacío").notEmpty();
  req
    .checkBody("confirmar", "Las password son diferentes")
    .equals(req.body.password);

  const errores = req.validationErrors();

  if (errores) {
    req.flash(
      "error",
      // Recorre el array de errores
      errores.map((error) => error.msg)
    );

    // Recarga la página, pero con la inclusión de los errores producidos
    res.render("crear-cuenta", {
      nombrePagina: "Crea tu cuenta en DevJobs",
      tagline:
        "Comienza a publicar tus ofertas gratis. Solo tienes que crear una cuenta",
      mensajes: req.flash(),
    });
    return;
  }

  next();
};

exports.crearUsuario = async (req, res, next) => {
  const usuario = new Usuarios(req.body);

  try {
    await usuario.save();
    res.redirect("/iniciar-sesion");
  } catch (error) {
    req.flash("error", error);
    res.redirect("/crear-cuenta");
  }
};

exports.formIniciarSesion = (req, res) => {
  res.render("iniciar-sesion", {
    nombrePagina: "Iniciar Sesión devJobs",
  });
};

exports.formEditarPerfil = (req, res) => {
  res.render("editar-perfil", {
    nombrePagina: "Edita tu perfil en devJobs",
    usuario: req.user,
    cerrarSesion: true,
    nombre: req.user.nombre,
    imagen: req.user.imagen,
  });
};

exports.editarPerfil = async (req, res, next) => {
  const usuario = await Usuarios.findById(req.user._id);

  usuario.nombre = req.body.nombre;
  usuario.email = req.body.email;
  // Solo si se rellena el password
  if (req.body.password) {
    Usuarios.password = req.body.password;
  }

  // Si la imagen es válida y no es echada atrás por ninguna de las causas de ConfigurationMulter.
  // Si no hay imagen se mantiene igualmente y continúa grabando
  if (req.file) {
    usuario.imagen = req.file.filename;
  }
  await usuario.save();

  req.flash("correcto", "Cambios guardados correctamente");

  res.redirect("/administracion");
};

// Sanitizar y validar el formulario de editar clientes
exports.validarPerfil = (req, res, next) => {
  req.sanitizeBody("nombre").escape();
  req.sanitizeBody("email").escape();
  if (req.body.password) {
    req.sanitizeBody("password").escape();
  }

  req.checkBody("nombre", "El nombre no puede ir vacío").notEmpty();
  req.checkBody("email", "El email no puede ir vacío").notEmpty();

  const errores = req.validationErrors();

  if (errores) {
    req.flash(
      "error",
      errores.map((error) => error.msg)
    );
    res.render("editar-perfil", {
      nombrePagina: "Edita tu perfil en devJobs",
      usuario: req.user,
      cerrarSesion: true,
      nombre: req.user.nombre,
      mensajes: req.flash(),
      imagen: req.user.imagen,
    });
  }
};

exports.subirImagen = (req, res, next) => {
  upload(req, res, function (error) {
    if (error) {
      // Si es error de Multer
      if (error instanceof multer.MulterError) {
        if (error.code === "LIMIT_FILE_SIZE") {
          req.flash("error", "El archivo es demasiado grande");
        } else {
          req.flash("error", error.message);
        }
      } else {
        req.flash("error", error.message);
      }
      // Para evitar el mensaje de que los cambios se han efectuado correctamente, se redirecciona
      res.redirect("/administracion");
      return;
    } else {
      return next();
    }
  });
};

// Opciones de Multer https://github.com/expressjs/multer#multeropts
const configuracionMulter = {
  limits: {
    fileSize: 100000,
  },
  storage: (fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, __dirname + "../../public/uploads/perfiles");
    },
    filename: (req, file, cb) => {
      // Para un tipo: audio/mpeg, extraería mpeg
      const extension = file.mimetype.split("/")[1];
      cb(null, `${shortid.generate()}.${extension}`);
    },
  })),
  fileFilter(req, file, cb) {
    if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
      // El callback se ejecuta como true cuando la imagen es válida
      cb(null, true);
    } else {
      cb(new Error("Formato inválido"), false);
    }
  },
};

const upload = multer(configuracionMulter).single("imagen");

