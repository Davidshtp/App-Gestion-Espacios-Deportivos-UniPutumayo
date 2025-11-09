import Swal from "sweetalert2";

export const mostrarCargando = (mensaje = "Procesando...") => {
  Swal.fire({
    title: mensaje,
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    },
  });
};

export const mostrarExito = (mensaje = "Operación exitosa") => {
  Swal.fire({
    icon: "success",
    title: mensaje,
    timer: 1500,
    showConfirmButton: false,
  });
};

export const mostrarError = (mensaje = "Ocurrió un error") => {
  Swal.fire({
    icon: "error",
    title: "Error",
    text: mensaje,
    confirmButtonColor: "#3085d6",
  });
};
