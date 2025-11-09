import React, { useState } from 'react';
import axios from '../../config/axiosConfig';
import { mostrarError, mostrarExito } from '../../utils/alerts';
import './CheckIn.css';

const CheckIn = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [preview, setPreview] = useState(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
    } else {
      setSelectedFile(null);
      setPreview(null);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedFile) {
      mostrarError('Por favor, selecciona una imagen.', 'No has elegido ningún archivo.');
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append('qrImage', selectedFile);

    try {
      const response = await axios.post('/reservas/check-in', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      mostrarExito('Check-In Exitoso', response.data.message);
      // Reset form
      setSelectedFile(null);
      setPreview(null);
      document.getElementById('file-input').value = '';

    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Ocurrió un error al procesar el QR.';
      mostrarError('Error en el Check-In', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="checkin-container">
      <div className="checkin-card">
        <h2 className="checkin-title">Check-In con Código QR</h2>
        <p className="checkin-instructions">
          Sube la imagen del código QR del espacio deportivo para confirmar tu reserva.
          Recuerda que puedes hacer el check-in desde 5 minutos antes hasta 20 minutos después del inicio de tu reserva.
        </p>
        
        <form onSubmit={handleSubmit} className="checkin-form">
          <label htmlFor="file-input" className="file-input-label">
            {preview ? 'Cambiar imagen' : 'Seleccionar Imagen'}
          </label>
          <input 
            id="file-input"
            type="file" 
            accept="image/*" 
            onChange={handleFileChange} 
            className="file-input"
          />
          
          {preview && (
            <div className="image-preview-container">
              <img src={preview} alt="Vista previa del QR" className="image-preview" />
            </div>
          )}

          <button type="submit" className="submit-btn" disabled={isLoading || !selectedFile}>
            {isLoading ? 'Procesando...' : 'Realizar Check-In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CheckIn;
