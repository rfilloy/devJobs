const emailConfig = require("../config/email");
const nodemailer = require("nodemailer");
const hbs = require("nodemailer-express-handlebars");
const util = require("util");
// const { port } = require("../config/email");

let transport = nodemailer.createTransport({
  host: emailConfig.host,
  port: emailConfig.port,
  auth: {
    user: emailConfig.user,
    pass: emailConfig.pass,
  },
});

// Utilizar templates de Handlebars
transport.use(
  "compile",
  hbs({
    viewEngine: "handlebars",
    // viewPath: __dirname + "/../views/emails",
    viewPath: __dirname+'/../views/partials/emails',
    extName: ".handlebars",
  })
);

exports.enviar = async (opciones) => {
  const opcionesEmail = {
    from: "devJobs <noreply@devJobs.com>",
    to: opciones.usuario.email,
    subject: opciones.subject,
    template: opciones.archivo,
    // En context irá todo lo que se pueda usar dentro de la vista
    context: {
      resetUrl: opciones.resetUrl,
    },
  };

  try {
    const sendMail = util.promisify(transport.sendMail, transport);
    return sendMail.call(transport, opcionesEmail);
  } catch (error) {
    console.log(error);
  }
};
