// src/hooks/useHorasDelDia.js
import { useEffect, useState, useCallback } from "react";
import Swal from "sweetalert2";
import { getReservasPorDia, crearReserva, cancelarReserva, marcarReservaEnUso, liberarReservaEnUso, getDeportes, } from "../../../Services/reservas/reservaService";
import { obtenerEventosPublicos, } from "../../../Services/eventos/eventosService";
import { useAuth } from "../../../context/AuthContext";

const HORAS_DEL_DIA = Array.from({ length: 17 }, (_, i) =>
  `${String(7 + i).padStart(2, "0")}:00`
);

const esHoraPasada = (fechaStr, horaStr) => {
  const [a, m, d] = fechaStr.split("-").map(Number);
  const [h, mins] = horaStr.split(":").map(Number);
  const fechaHoraIntervaloFin = new Date(a, m - 1, d, h + 1, mins || 0);
  return new Date() > fechaHoraIntervaloFin;
};

export default function useHorasDelDia(fecha, espacioId) {
  const [reservas, setReservas] = useState({});
  const [deportes, setDeportes] = useState([]);
  const [eventos, setEventos] = useState([]);
  const { user } = useAuth();

  const actualizarReservasLocalmente = useCallback(async () => {
    if (!fecha || !espacioId) return;
    try {
      const data = await getReservasPorDia(fecha, espacioId);
      const obj = {};
      data.forEach((r) => {
        obj[r.hora] = r;
      });
      setReservas(obj);
    } catch (error) {
      console.error("Error al actualizar reservas:", error);
      Swal.fire("Error", "No se pudieron recargar las reservas.", "error");
    }
  }, [fecha, espacioId]);

  useEffect(() => {
    const cargarDatosIniciales = async () => {
      try {
        const deportesData = await getDeportes();
        setDeportes(deportesData);

        if (user && user.rolId === 1) {
          const eventosData = await obtenerEventosPublicos();
          setEventos(eventosData);
        }
      } catch (error) {
        console.error("Error al cargar deportes o eventos:", error);
        Swal.fire(
          "Error",
          "No se pudieron cargar los datos adicionales (deportes/eventos).",
          "error"
        );
      }
    };
    cargarDatosIniciales();
  }, [user]);
  useEffect(() => {
    actualizarReservasLocalmente();

    const handleNovedadReservas = () => {
      actualizarReservasLocalmente();
    };

    window.addEventListener("novedad-reservas", handleNovedadReservas);

    return () => {
      window.removeEventListener("novedad-reservas", handleNovedadReservas);
    };
  }, [actualizarReservasLocalmente]);

  const handleCrearReserva = useCallback(async (hora) => {
    if (!user) {
      Swal.fire(
        "Error",
        "No se pudo identificar al usuario para crear la reserva.",
        "error"
      );
      return;
    }

    const fechaCompleta = `${fecha}T${hora}:00`;
    let deporte_id_a_enviar = null;
    let evento_id_a_enviar = null;

    if (user.rolId === 2) {
      if (espacioId === 2) {
        if (deportes.length === 0) {
          Swal.fire("Error", "No hay deportes disponibles para seleccionar.", "error");
          return;
        }
        const inputOptionsDeportes = deportes.reduce((options, d) => {
          options[d.id_deporte] = d.nombre;
          return options;
        }, {});

        const { value: selectedDeporteId } = await Swal.fire({
          title: `¿Qué deporte practicarás a las ${hora}?`,
          input: 'select',
          inputOptions: inputOptionsDeportes,
          inputPlaceholder: 'Selecciona un deporte',
          showCancelButton: true,
          confirmButtonText: 'Sí, reservar',
          cancelButtonText: 'Cancelar',
          inputValidator: (value) => {
            return !value && 'Necesitas seleccionar un deporte!';
          }
        });

        if (!selectedDeporteId) {
          return;
        }
        deporte_id_a_enviar = parseInt(selectedDeporteId);

      } else {
        deporte_id_a_enviar = 1;
      }

    } else if (user.rolId === 1) { // Administrador
      const { value: eventOption } = await Swal.fire({
        title: `¿Qué tipo de reserva será a las ${hora}?`,
        input: 'radio',
        inputOptions: {
          'eventoExistente': 'Asociar a evento predefinido/existente',
          'reservaNormal': 'Reserva normal (sin evento ni deporte específico)'
        },
        inputPlaceholder: 'Selecciona una opción',
        showCancelButton: true,
        confirmButtonText: 'Continuar',
        cancelButtonText: 'Cancelar',
        inputValidator: (value) => {
          return !value && 'Necesitas seleccionar una opción!';
        }
      });

      if (!eventOption) {
        return;
      }

      if (eventOption === 'eventoExistente') {
        if (eventos.length === 0) {
          Swal.fire("Error", "No hay eventos predefinidos para seleccionar. Crea uno nuevo desde el panel de gestión de eventos.", "error");
          return;
        }
        const inputOptionsEventos = eventos.reduce((options, e) => {
          options[e.id_evento] = e.nombre;
          return options;
        }, {});

        const { value: selectedEventoId } = await Swal.fire({
          title: `Selecciona un evento predefinido para las ${hora}`,
          input: 'select',
          inputOptions: inputOptionsEventos,
          inputPlaceholder: 'Selecciona un evento',
          showCancelButton: true,
          confirmButtonText: 'Sí, reservar',
          cancelButtonText: 'Cancelar',
          inputValidator: (value) => {
            return !value && 'Necesitas seleccionar un evento!';
          }
        });

        if (!selectedEventoId) {
          return;
        }
        evento_id_a_enviar = parseInt(selectedEventoId);

      } else if (eventOption === 'reservaNormal') {

      }

    } else {

      deporte_id_a_enviar = 1;
    }

    try {
      const payload = {
        fecha_hora: fechaCompleta,
        espacio_id: espacioId,
        deporte_id: deporte_id_a_enviar,
        evento_id: evento_id_a_enviar,
      };
      console.log(payload);

      await crearReserva(payload);

      Swal.fire("¡Reservado!", `La hora ${hora} ha sido reservada.`, "success");
      await actualizarReservasLocalmente();
    } catch (error) {
      Swal.fire("Error", error.response?.data?.message || "No se pudo crear la reserva.", "error");
    }
  }, [fecha, espacioId, user, deportes, eventos, actualizarReservasLocalmente]);


  const handleCancelarReserva = useCallback(async (reservaHora, horaDisplay) => {
    const result = await Swal.fire({
      title: `¿Cancelar la reserva de las ${horaDisplay}?`,
      text: "Esta acción anulará tu reserva.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Sí, cancelar",
      cancelButtonText: "No",
    });

    if (result.isConfirmed) {
      try {
        await cancelarReserva({
          fecha_hora: `${fecha}T${reservaHora}:00`,
          espacio_id: espacioId
        });
        Swal.fire("¡Cancelada!", `La reserva de las ${horaDisplay} ha sido cancelada.`, "success");
        await actualizarReservasLocalmente();
      } catch (error) {
        Swal.fire("Error", error.response?.data?.message || "No se pudo cancelar la reserva.", "error");
      }
    }
  }, [fecha, espacioId, actualizarReservasLocalmente]);

  const handleMarcarEnUso = useCallback(async (reservaHora, horaDisplay) => {
    const result = await Swal.fire({
      title: `¿Marcar en uso la reserva de las ${horaDisplay}?`,
      text: "Esta acción marcará la reserva como 'en uso'.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, marcar",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      try {
        await marcarReservaEnUso({
          fecha_hora: `${fecha}T${reservaHora}:00`,
          espacio_id: espacioId
        });
        Swal.fire("¡En uso!", `La reserva de las ${horaDisplay} ha sido marcada como en uso.`, "success");
        await actualizarReservasLocalmente();
      } catch (error) {
        Swal.fire("Error", error.response?.data?.message || "No se pudo marcar la reserva en uso.", "error");
      }
    }
  }, [fecha, espacioId, actualizarReservasLocalmente]);

  const handleLiberarReserva = useCallback(async (reservaHora, horaDisplay) => {
    const result = await Swal.fire({
      title: `¿Liberar la reserva de las ${horaDisplay}?`,
      text: "Esta acción liberará la reserva y la marcará como 'uso libre'.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, liberar",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      try {
        await liberarReservaEnUso(`${fecha}T${reservaHora}:00`, espacioId);
        Swal.fire("¡Liberada!", `La reserva de las ${horaDisplay} ha sido liberada.`, "success");
        await actualizarReservasLocalmente();
      } catch (error) {
        Swal.fire("Error", error.response?.data?.message || "No se pudo liberar la reserva.", "error");
      }
    }
  }, [fecha, espacioId, actualizarReservasLocalmente]);


  return {
    reservas,
    user,
    HORAS_DEL_DIA,
    esHoraPasada,
    handleCrearReserva,
    handleCancelarReserva,
    handleMarcarEnUso,
    handleLiberarReserva,
  };
}