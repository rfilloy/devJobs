// También se puede poner:
// const Vacante = require('../models/Vacantes')

const mongoose = require("mongoose");
const Vacante = mongoose.model("Vacante");
const multer = require("multer");
const shortid = require("shortid");

exports.formularioNuevaVacante = (req, res) => {
  res.render("nueva-vacante", {
    nombrePagina: "Nueva vacante",
    tagline: "Rellena el formulario y publica tu vacante",
    cerrarSesion: true,
    nombre: req.user.nombre,
    imagen: req.user.imagen,
  });
};

exports.agregarVacante = async (req, res) => {
  const vacante = new Vacante(req.body);

  // Añadir el autor de la vacante
  vacante.autor = req.user._id;

  // Crear array de skills
  vacante.skills = req.body.skills.split(",");

  const nuevaVacante = await vacante.save();

  // Redireccionamos
  res.redirect(`/vacantes/${nuevaVacante.url}`);
};

exports.mostrarVacante = async (req, res, next) => {
  const vacante = await Vacante.findOne({
    url: req.params.url,
  }).populate("autor"); // Extendemos la consulta y recuperamos también datos de la tabla 'Usuarios'

  if (!vacante) {
    return next();
  }

  res.render("vacante", { vacante, nombrePagina: vacante.titulo, barra: true });
};

exports.formEditarVacante = async (req, res, next) => {
  const vacante = await Vacante.findOne({ url: req.params.url }).lean();

  if (!vacante) return next();

  res.render("editar-vacante", {
    vacante,
    nombrePagina: `Editar - ${vacante.titulo}`,
    cerrarSesion: true,
    nombre: req.user.nombre,
    imagen: req.user.imagen,
  });
};

exports.editarVacante = async (req, res) => {
  const vacanteActualizada = req.body;
  vacanteActualizada.skills = req.body.skills.split(",");

  const vacante = await Vacante.findOneAndUpdate(
    {
      url: req.params.url,
    },
    vacanteActualizada,
    {
      new: true, // Posteriormente se trae el valor nuevo ya actualizado
      runValidators: true,
    }
  );

  res.redirect(`/vacantes/${vacante.url}`);
};

// Validar y sanitizar los campos de las nuevas vacantes
exports.validarVacante = (req, res, next) => {
  req.sanitizeBody("titulo").escape();
  req.sanitizeBody("empresa").escape();
  req.sanitizeBody("ubicacion").escape();
  req.sanitizeBody("salario").escape();
  req.sanitizeBody("contrato").escape();
  req.sanitizeBody("skills").escape();

  req.checkBody("titulo", "Agrega un título a la Vacante").notEmpty();
  req.checkBody("empresa", "Agrega una empresa a la Vacante").notEmpty();
  req.checkBody("ubicacion", "Agrega una ubicación a la Vacante").notEmpty();
  req.checkBody("contrato", "Agrega un Tipo de Contrato").notEmpty();
  req.checkBody("skills", "Agrega al menos una habilidad").notEmpty();

  const errores = req.validationErrors();

  console.log(errores);

  if (errores) {
    // Recargar la vista con los errores
    req.flash(
      "error",
      errores.map((error) => error.msg)
    );
    res.render("nueva-vacante", {
      nombrePagina: "Nueva vacante",
      tagline: "Rellena el formulario y publica tu vacante",
      cerrarSesion: true,
      nombre: req.user.nombre,
      mensajes: req.flash(),
    });
  }

  next();
};

exports.eliminarVacante = async (req, res) => {
  const { id } = req.params;

  const vacante = await Vacante.findById(id);

  if (verificarAutor(vacante, req.user)) {
    vacante.remove();
    res.status(200).send("Vacante eliminada correctamente");
  } else {
    res.status(403).send("Error");
  }
};

const verificarAutor = (vacante = {}, usuario = {}) => {
  if (!vacante.autor.equals(usuario._id)) {
    return false;
  }
  return true;
};

// Subir archivos en PDF
exports.subirCV = (req, res, next) => {
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
      res.redirect("back");
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
      cb(null, __dirname + "../../public/uploads/cv");
    },
    filename: (req, file, cb) => {
      // Para un tipo: audio/mpeg, extraería mpeg
      const extension = file.mimetype.split("/")[1];
      cb(null, `${shortid.generate()}.${extension}`);
    },
  })),
  fileFilter(req, file, cb) {
    if (file.mimetype === "application/pdf") {
      // El callback se ejecuta como true cuando la imagen es válida
      cb(null, true);
    } else {
      cb(new Error("Formato inválido"), false);
    }
  },
};

const upload = multer(configuracionMulter).single("cv");

// Almacenar los candidatos en la BD
exports.contactar = async (req, res, next) => {
  const vacante = await Vacante.findOne({ url: req.params.url });

  // Si no existe la vacante
  if (!vacante) return next();

  // Si todo está ok, se construye el nuevo objeto
  const nuevoCandidato = {
    nombre: req.body.nombre,
    email: req.body.email,
    cv: req.file.filename,
  };

  // Almacenar la vacante
  vacante.candidatos.push(nuevoCandidato);
  await vacante.save();

  // Mensaje flash y redirección
  req.flash("correcto", "Tu CV fue subido correctamente");
  res.redirect("/");
};

exports.mostrarCandidatos = async (req, res, next) => {
  const vacante = await Vacante.findById(req.params.id);

  // Necesario especificar toString(), porque son tipos de objetos diferentes
  if (vacante.autor != req.user._id.toString()) {
    return next();
  }

  if (!vacante) return next();

  res.render("candidatos", {
    nombrePagina: `Candidatos Vacante - ${vacante.titulo}`,
    cerrarSesion: true,
    nombre: req.user.nombre,
    imagen: req.user.imagen,
    candidatos: vacante.candidatos,
  });
};

// Buscador de vacantes
exports.buscarVacantes = async (req, res) => {
  const vacantes = await Vacante.find({
    $text: {
      $search: req.body.q,
    },
  });

  // Mostrar las vacantes
  res.render("home", {
    nombrePagina: `Resultados para la búsqueda : ${req.body.q}`,
    barra:true, 
    vacantes
  });
};
