import React, { useEffect, useState, useRef, useCallback } from "react";
import { obtenerEventosPublicos } from "../../Services/eventos/eventosService";
import "./NoticiasSlider.css";
import ModalDetalleEvento from "../Eventos/ModalDetalleEvento/ModalDetalleEvento";
import useEventoSocket from "../../hooks/useEventoSocket";
import { mostrarError } from "../../utils/alerts";

export default function NoticiasSlider() {
  const [eventos, setEventos] = useState([]);
  const [eventoSeleccionado, setEventoSeleccionado] = useState(null);
  const sliderRef = useRef(null);
  const [mostrarFlechaIzq, setMostrarFlechaIzq] = useState(false);
  const [mostrarFlechaDer, setMostrarFlechaDer] = useState(false);

  useEventoSocket();

  const cargarEventos = useCallback(async () => {
    try {
      const data = await obtenerEventosPublicos();
      setEventos(data);
    } catch (error) {
      console.error("Error cargando noticias:", error);
    }
  }, []);

  useEffect(() => {
    cargarEventos();
  }, [cargarEventos]);

  // 🔄 Escuchar cambios en eventos (socket o trigger global)
  useEffect(() => {
    const handler = async () => {
      try {
        const data = await obtenerEventosPublicos();
        setEventos(data);

        if (eventoSeleccionado) {
          const actualizado = data.find(
            (e) => e.id_evento === eventoSeleccionado.id_evento,
          );
          if (actualizado) {
            setEventoSeleccionado(actualizado);
          } else {
            mostrarError("Este evento ya no está disponible");
            setEventoSeleccionado(null);
          }
        }
      } catch (error) {
        console.error("Error recargando eventos:", error);
      }
    };

    window.addEventListener("novedad-evento", handler);
    return () => window.removeEventListener("novedad-evento", handler);
  }, [eventoSeleccionado]);

  // Lógica para mostrar/ocultar flechas
  const actualizarVisibilidadFlechas = useCallback(() => {
    if (!sliderRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
    setMostrarFlechaIzq(scrollLeft > 0);
    // Se suma una pequeña tolerancia para asegurar que al llegar al final, la flecha se oculte.
    setMostrarFlechaDer(scrollLeft + clientWidth < scrollWidth - 1);
  }, []);

  useEffect(() => {
    const sliderElement = sliderRef.current;
    if (sliderElement) {
      sliderElement.addEventListener("scroll", actualizarVisibilidadFlechas);
      window.addEventListener("resize", actualizarVisibilidadFlechas);
      // Llamada inicial para establecer el estado correcto de las flechas al cargar
      actualizarVisibilidadFlechas();
    }

    return () => {
      if (sliderElement) {
        sliderElement.removeEventListener(
          "scroll",
          actualizarVisibilidadFlechas,
        );
        window.removeEventListener("resize", actualizarVisibilidadFlechas);
      }
    };
  }, [eventos.length, actualizarVisibilidadFlechas]);

  const avanzar = useCallback(() => {
    if (!sliderRef.current) return;
    const card = sliderRef.current.querySelector(".noticia-card");
    if (card) {
      const cardWidth = card.offsetWidth + 15; // Ancho real + el gap
      sliderRef.current.scrollBy({ left: cardWidth, behavior: "smooth" });
    }
  }, []);

  const retroceder = useCallback(() => {
    if (!sliderRef.current) return;
    const card = sliderRef.current.querySelector(".noticia-card");
    if (card) {
      const cardWidth = card.offsetWidth + 15;
      sliderRef.current.scrollBy({ left: -cardWidth, behavior: "smooth" });
    }
  }, []);

  const abrirModal = (evento) => setEventoSeleccionado(evento);
  const cerrarModal = () => setEventoSeleccionado(null);

  // Navegación con teclado
  useEffect(() => {
    const manejarTecla = (e) => {
      // Solo permite navegación si hay más de una tarjeta y las flechas están visibles
      if (eventos.length <= 1) return;
      if (e.key === "ArrowRight" && mostrarFlechaDer) {
        avanzar();
      } else if (e.key === "ArrowLeft" && mostrarFlechaIzq) {
        retroceder();
      }
    };
    window.addEventListener("keydown", manejarTecla);
    return () => window.removeEventListener("keydown", manejarTecla);
  }, [avanzar, retroceder, eventos.length, mostrarFlechaIzq, mostrarFlechaDer]);

  return (
    <div className="noticias-section">
      <h3 className="noticias-title">Noticias y eventos</h3>
      <div className="slider-wrapper">
        {/* Siempre renderiza el botón, su visibilidad se controla con CSS */}
        <button
          className={`arrow ${!mostrarFlechaIzq ? "arrow-hidden" : ""}`}
          onClick={retroceder}
          aria-label="Anterior"
          disabled={!mostrarFlechaIzq} // Deshabilita si no es visible para mejor UX
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="22"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        {eventos.length === 0 ? (
          <div className="noticias-empty">
            <p>No hay noticias o eventos disponibles</p>
          </div>
        ) : (
          <div className="slider-container" ref={sliderRef}>
            <div className="slider">
              {eventos.map((item) => (
                <div
                  className="noticia-card"
                  key={item.id_evento}
                  onClick={() => abrirModal(item)}
                >
                  <img
                    src={`${item.url_imagen_evento}?v=${item.updated_at || Date.now()}`}
                    alt={item.nombre}
                  />
                  <h4>{item.nombre}</h4>
                  <p>{item.descripcion}</p>
                  <div className="fecha-evento">
                    {new Date(item.fecha_hora_evento).toLocaleString("es-CO", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Siempre renderiza el botón, su visibilidad se controla con CSS */}
        <button
          className={`arrow ${!mostrarFlechaDer ? "arrow-hidden" : ""}`}
          onClick={avanzar}
          aria-label="Siguiente"
          disabled={!mostrarFlechaDer} // Deshabilita si no es visible para mejor UX
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="22"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path d="M9 6l6 6-6 6" />
          </svg>
        </button>
      </div>

      {eventoSeleccionado && (
        <ModalDetalleEvento evento={eventoSeleccionado} onClose={cerrarModal} />
      )}
    </div>
  );
}
