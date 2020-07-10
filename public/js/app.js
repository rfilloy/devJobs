import axios from "axios";
import Swal from "sweetalert2";

// Lo leerá cuando el documento esté listo
document.addEventListener("DOMContentLoaded", () => {
  const skills = document.querySelector(".lista-conocimientos");

  // Limpiar las alertas
  let alertas = document.querySelector(".alertas");
  if (alertas) {
    limpiarAlertas();
  }

  if (skills) {
    skills.addEventListener("click", agregarSkills);

    // Cuando estamos editando, llamar a una función
    skillsSeleccionados();
  }

  const vacantesListado = document.querySelector(".panel-administracion");
  if (vacantesListado) {
    vacantesListado.addEventListener("click", accionesListado);
  }
});

// Similar a un array https://developer.mozilla.org/es/docs/Web/JavaScript/Referencia/Objetos_globales/Set
const skills = new Set();
const agregarSkills = (e) => {
  if (e.target.tagName === "LI") {
    if (e.target.classList.contains("activo")) {
      // Se quita del Set y la clase
      skills.delete(e.target.textContent);
      e.target.classList.remove("activo");
    } else {
      // Se añade al Set y la clase
      skills.add(e.target.textContent);
      e.target.classList.add("activo");
    }
  }

  // Convierte una copia de skills en un array
  const skillsArray = [...skills];
  document.querySelector("#skills").value = skillsArray;
};

const skillsSeleccionados = () => {
  // Convierte en un array todo lo que selecciona de document
  const seleccionadas = Array.from(
    document.querySelectorAll(".lista-conocimientos .activo")
  );

  // De todos los elementos seleccionados se seleccionará únicamente el texto de su interior
  seleccionadas.forEach((seleccionada) => {
    skills.add(seleccionada.textContent);
  });

  // Pasarlo al campo hidden de la vista
  const skillsArray = [...skills];
  document.querySelector("#skills").value = skillsArray;
};

const limpiarAlertas = () => {
  const alertas = document.querySelector(".alertas");
  // Para producir el efecto de ir borrando las alertas desde arriba hacia abajo cada 2 segundos
  const interval = setInterval(() => {
    if (alertas.children.length > 0) {
      alertas.removeChild(alertas.children[0]);
    } else {
      alertas.parentElement.removeChild(alertas);
      clearInterval(interval);
    }
  }, 2000);
};

// Eliminar vacantes
const accionesListado = (e) => {
  e.preventDefault(); // Cancela la ejecución del evento

  // Referencia a elemento creado dentro de la vista
  if (e.target.dataset.eliminar) {
    // Eliminar por axios

    Swal.fire({
      title: "¿Confirmar eliminación?",
      text: "Una vez eliminada, no se podrá recuperar",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "No, cancelar",
    }).then((result) => {
      if (result.value) {
        // Enviar la petición con axios
        const url = `${location.origin}/vacantes/eliminar/${e.target.dataset.eliminar}`;

        // Axios para eliminar el registro
        axios.delete(url, { params: { url } }).then(function (respuesta) {
          if (respuesta.status === 200) {
            Swal.fire("Eliminado!", respuesta.data, "success");

            // Eliminar del DOM
            e.target.parentElement.parentElement.parentElement.removeChild(
              e.target.parentElement.parentElement
            );
          }
        }).catch(() => {
          Swal.fire({
            type: 'error',
            title: 'Se produjo un error',
            text: 'No se pudo eliminar la vacante'
          })
        });
      }
    });
  } else if (e.target.tagName === "A") {
    // Ir hacia los enlaces para cada uno de los otros botones, siempre y cuando tenga referencias a enlaces
    window.location.href = e.target.href;
  }
};
