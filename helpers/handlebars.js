module.exports = {
  seleccionarSkills: (seleccionadas = [], opciones) => {
    const skills = [
      "HTML5",
      "CSS3",
      "CSSGrid",
      "Flexbox",
      "JavaScript",
      "jQuery",
      "Node",
      "Angular",
      "VueJS",
      "ReactJS",
      "React Hooks",
      "Redux",
      "Apollo",
      "GraphQL",
      "TypeScript",
      "PHP",
      "Laravel",
      "Symfony",
      "Python",
      "Django",
      "ORM",
      "Sequelize",
      "Mongoose",
      "SQL",
      "MVC",
      "SASS",
      "WordPress",
    ];

    let html = "";
    skills.forEach((skill) => {
      // Si los elementos seleccionados están en el array de skill, pondrá una clase
      html += `
            <li ${
              seleccionadas.includes(skill) ? 'class = "activo"' : ""
            }>${skill}</li>
        `;
    });
    return (opciones.fn().html = html);
  },

  tipoContrato: (seleccionado, opciones) => {
    return opciones.fn(this).replace(
      // Le pasa el valor de BD desde la vista. opciones será todo lo que se encuentra dentro de las etiquetas
      // (dentro de la vista), entre #tipoContrato y /tipoContrato. En el valor seleccionado, si encuentra el valor,
      // reemplaza y con $& inserta un string
      new RegExp(` value="${seleccionado}"`),
      '$& selected="selected"'
    );
  },

  mostrarAlertas: (errores = {}, alertas) => {
    const categoria = Object.keys(errores);
    // Actúa de filtro
    // console.log(errores[categoria]);

    let html = "";
    if (categoria.length) {
      errores[categoria].forEach((error) => {
        html += `<div class="${categoria} alerta">
          ${error}
        </div>`;
      });
    }
    return alertas.fn().html = html;
  },
};
