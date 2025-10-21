// 📦 Imports
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import logo from "../../assets/images/Logo-Universidad.png";
import { register, login, loginWithGoogle, } from "../../Services/auth/authService";
import "./Login.css";

const images = [require("../../assets/images/1.jpg"), require("../../assets/images/2.jpg"), require("../../assets/images/3.jpg"),];

//Funciones auxiliares
const soloLetras = (value) => {
  return value
    .replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, "")
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
};

const bloquearCaracteresNoNumericos = (e) => {
  if (["e", "E", "+", "-", ".", ","].includes(e.key)) e.preventDefault();
};

export default function Login() {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0); // carrusel
  const [isRegistering, setIsRegistering] = useState(false);
  const [formClass, setFormClass] = useState("fade-form active");
  const [message, setMessage] = useState("");
  const [showInfo, setShowInfo] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    identificacion: "",
    contrasena: "",
  });

  // Carrusel automático de fondo
  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  // Cambiar entre login y registro
  const handleToggleForm = () => {
    setFormClass("fade-form");
    setTimeout(() => {
      setShowInfo(false);
      setIsRegistering(!isRegistering);
      setFormClass("fade-form active");
      setMessage("");
    }, 250);
  };

  // Controlador de inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    let val = value;

    if (["nombre", "apellido"].includes(name)) val = soloLetras(value);
    if (name === "identificacion" && value.length > 10) return;

    setFormData((prev) => ({ ...prev, [name]: val }));
  };

  // Mensajes temporales
  const mostrarMensaje = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 2000);
  };

  // Limpia el formulario
  const resetFormulario = (tambienRegistro = false) => {
    setFormData({
      nombre: "",
      apellido: "",
      identificacion: "",
      contrasena: "",
    });
    if (tambienRegistro) setIsRegistering(false);
  };

  // Envío de formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    const identificacion = formData.identificacion.trim();

    if (!/^\d{6,10}$/.test(identificacion)) {
      return mostrarMensaje("La identificación debe tener entre 6 y 10 números.");
    }

    try {
      if (isRegistering) {
        await register({ ...formData, rolId: 2 });
        mostrarMensaje("Registro exitoso");
        resetFormulario(true);
      } else {
        await login(identificacion, formData.contrasena);
        mostrarMensaje("Inicio de sesión exitoso");
        resetFormulario();
        setTimeout(() => {
          setMessage("");
          navigate("/inicio");
        }, 2000);
      }
    } catch (err) {
      const errorMsg = err?.response?.data?.message || "Error en el servidor";
      mostrarMensaje(errorMsg);
      resetFormulario()
    }
  };

  // Login con Google
  const handleGoogleLogin = async (credentialResponse) => {
    try {
      const { credential } = credentialResponse;
      if (!credential) throw new Error("No se recibió token de Google");

      await loginWithGoogle(credential);
      mostrarMensaje("Inicio de sesión con Google exitoso");
      setTimeout(() => {
        setMessage("");
        navigate("/inicio");
      }, 2000);

    } catch (error) {
      const msg = error?.response?.data?.message || "Error al iniciar con Google";
      mostrarMensaje(msg);
    }
  };

  // Renderizado
  return (
    <div className={`login-page ${isRegistering ? "register-mode" : ""}`}>
      {/*carrusel de imagenes de fondo */}
      {images.map((img, i) => (
        <div
          key={i}
          className={`background-image ${i === index ? "active" : ""}`}
          style={{ backgroundImage: `url(${img})` }}
        />
      ))}
      <div className="background-overlay" />

      {/* Header de navegación */}
      <div className="top-header">
        <div className="container_button">
          <button onClick={handleToggleForm}>
            {isRegistering ? "Iniciar sesión" : "Regístrate"}
          </button>
          <button onClick={() => setShowInfo(true)}>Información</button></div>
      </div>

      <div className={`login-container ${isRegistering ? "slide-register" : ""}`}>
        <div className={`login-card flip-card ${showInfo ? "flipped" : ""}`}>
          <div className="flip-inner">
            {/* Parte frontal (login/registro) */}
            <div className="flip-front">
              <div className="login-header">
                <h2>{isRegistering ? "Registro" : "Inicio Sesión"}</h2>
                <p>{isRegistering ? "Crea tu cuenta" : "Por favor inicia sesión"}</p>
              </div>

              <form
                onSubmit={handleSubmit}
                className={`${formClass} ${!isRegistering ? "login-form" : ""}`}
              >
                {isRegistering && (
                  <div className="input-row">
                    <input
                      type="text"
                      name="nombre"
                      placeholder="Nombre"
                      value={formData.nombre}
                      onChange={handleChange}
                      required
                    />
                    <input
                      type="text"
                      name="apellido"
                      placeholder="Apellido"
                      value={formData.apellido}
                      onChange={handleChange}
                      required
                    />
                  </div>
                )}

                <div className={`${isRegistering ? "input-row" : ""}`}>
                  <input
                    type="number"
                    name="identificacion"
                    placeholder="Identificación"
                    onKeyDown={bloquearCaracteresNoNumericos}
                    value={formData.identificacion}
                    onChange={handleChange}
                    required
                  />
                  <input
                    type="password"
                    name="contrasena"
                    placeholder="Contraseña"
                    value={formData.contrasena}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="register-button">
                  <button type="submit">
                    {isRegistering ? "Registrarse" : "Iniciar sesión"}
                  </button>
                </div>
              </form>

              {message && (
                <p className={`status-message ${message.includes("exitoso") ? "success" : "error"}`}>
                  {message}
                </p>
              )}

              {!isRegistering && (
                <>
                  <div className="options">
                    <a href="#">¿Olvidaste tu contraseña?</a>
                  </div>
                  <div className="p-login_google">
                    <p>
                      El ingreso solo está permitido para estudiantes{" "}
                      <strong>admitidos y matriculados.</strong>
                    </p>
                    <p>
                      O puedes iniciar sesión con <strong>Correo Institucional</strong>
                    </p>
                  </div>

                  <div className="google-login">
                    <GoogleLogin
                      onSuccess={handleGoogleLogin}
                      onError={() => mostrarMensaje("Error al autenticar con Google")}
                      useOneTap={false}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Parte trasera (información) */}
            <div className="flip-back">
              <h2>Información</h2>
              <p>
                Plataforma para gestión de espacios deportivos del{" "}
                <strong>Instituto Tecnológico del Putumayo</strong>.
              </p>
              <p>Solo estudiantes admitidos y matriculados pueden acceder al sistema.</p>
              <img src={logo} alt="Logo del ITP" className="info-logo" />
              <button className="back-button" onClick={() => setShowInfo(false)}>
                Volver
              </button>
            </div>
          </div>
        </div>

        {/* Panel decorativo */}
        <div className="decorative">
          <h1>Bienvenido</h1>
          <p>
            Panel de gestión de horarios para el campus universitario del{" "}
            <strong>Instituto Tecnológico del Putumayo</strong>
          </p>
        </div>
        <img src={logo} alt="Logo del ITP" className="Logo_Itp" />
      </div>
    </div>
  );
}
