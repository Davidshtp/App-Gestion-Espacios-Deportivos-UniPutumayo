import Swal from 'sweetalert2';

// Inyectar estilos CSS para el spinner customizado
const spinnerStyles = `
  <style>
    .swal2-spinner {
      display: none !important;
    }

    .custom-loader {
      width: 50px;
      height: 50px;
      margin: 20px auto 30px;
      position: relative;
    }

    .custom-loader svg {
      width: 100%;
      height: 100%;
      animation: rotateSpinner 2s linear infinite;
    }

    @keyframes rotateSpinner {
      0% {
        transform: rotate(0deg);
      }
      100% {
        transform: rotate(360deg);
      }
    }

    .custom-loader-dots {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 6px;
      margin: 20px 0 30px 0;
    }

    .dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      animation: bounceDot 1.4s infinite ease-in-out both;
    }

    .dot:nth-child(1) {
      animation-delay: -0.32s;
    }

    .dot:nth-child(2) {
      animation-delay: -0.16s;
    }

    @keyframes bounceDot {
      0%, 80%, 100% {
        transform: scale(0);
        opacity: 0.5;
      }
      40% {
        transform: scale(1);
        opacity: 1;
      }
    }

    .swal2-title {
      color: #1f2937;
      font-weight: 600;
    }

    .swal2-html-container {
      margin: 0 !important;
      padding: 0 !important;
    }
  </style>
`;

export const mostrarCargando = (mensaje = 'Procesando...') => {
  const loaderHTML = `
    ${spinnerStyles}
    <div class="custom-loader-dots">
      <div class="dot"></div>
      <div class="dot"></div>
      <div class="dot"></div>
    </div>
  `;

  Swal.fire({
    title: mensaje,
    html: loaderHTML,
    allowOutsideClick: false,
    allowEscapeKey: false,
    didOpen: () => {
      // Ocultar el spinner por defecto
      const spinner = document.querySelector('.swal2-spinner');
      if (spinner) {
        spinner.style.display = 'none';
      }
    }
  });
};

export const mostrarExito = (mensaje = 'Operación exitosa') => {
  Swal.fire({
    icon: 'success',
    title: mensaje,
    timer: 1500,
    showConfirmButton: false,
  });
};

export const mostrarError = (mensaje = 'Ocurrió un error') => {
  Swal.fire({
    icon: 'error',
    title: 'Error',
    text: mensaje,
    confirmButtonColor: '#3085d6'
  });
};
