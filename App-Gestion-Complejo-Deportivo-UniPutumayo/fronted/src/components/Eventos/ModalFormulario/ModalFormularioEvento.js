// src/components/GestionEventos/ModalFormularioEvento.jsx
import React, { useState, useEffect, useRef } from 'react';
import { FiX, FiImage, FiClock, FiFileText, FiType } from 'react-icons/fi';
import CalendarioReserva from '../../CalendarioReserva/CalendarioReserva';
import './ModalFormularioEvento.css';
import Swal from 'sweetalert2';

export default function ModalFormularioEvento({ visible, onClose, onSubmit, eventoInicial = null }) {
    const [nombre, setNombre] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [fecha, setFecha] = useState(null);
    const [hora, setHora] = useState('');
    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const dropRef = useRef();

    useEffect(() => {
        if (eventoInicial) {
            setNombre(eventoInicial.nombre || '');
            setDescripcion(eventoInicial.descripcion || '');
            const fechaCompleta = new Date(eventoInicial.fecha_hora_evento);
            if (!isNaN(fechaCompleta)) {
                setFecha(fechaCompleta.toISOString().split('T')[0]);
                setHora(fechaCompleta.toTimeString().substring(0, 5));
            }
            setPreviewUrl(eventoInicial.url_imagen_evento || '');
        } else {
            setNombre('');
            setDescripcion('');
            setFecha(null);
            setHora('');
            setFile(null);
            setPreviewUrl('');
        }
    }, [eventoInicial]);

    const handleFile = (selected) => {
        if (!selected) return;

        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];
        if (!allowedTypes.includes(selected.type)) {
            Swal.fire({
                icon: 'warning',
                title: 'Tipo de archivo no permitido',
                text: 'Solo se permiten imágenes PNG, JPG, SVG o WEBP.',
                confirmButtonColor: '#3085d6'
            });
            return;
        }

        if (selected.size > 2 * 1024 * 1024) {
            Swal.fire({
                icon: 'error',
                title: 'Imagen demasiado grande',
                text: 'El tamaño máximo permitido es 2MB.',
                confirmButtonColor: '#3085d6'
            });
            return;
        }

        setFile(selected);
        const reader = new FileReader();
        reader.onload = () => setPreviewUrl(reader.result);
        reader.readAsDataURL(selected);
    };


    const resetFormulario = () => {
        setNombre('');
        setDescripcion('');
        setFecha(null);
        setHora('');
        setFile(null);
        setPreviewUrl('');
    };


    const handleDrop = (e) => {
        e.preventDefault();
        dropRef.current.classList.remove('evtForm-dragover');
        const droppedFile = e.dataTransfer.files[0];
        handleFile(droppedFile);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        dropRef.current.classList.add('evtForm-dragover');
    };

    const handleDragLeave = () => {
        dropRef.current.classList.remove('evtForm-dragover');
    };

    const handleSubmit = () => {
        if (!nombre || !fecha || !hora) {
            Swal.fire({
                icon: 'warning',
                title: 'Campos incompletos',
                text: 'Por favor completa el título, la fecha y la hora del evento.',
                confirmButtonColor: '#3085d6'
            });
            return;
        }

        const fecha_hora_evento = new Date(`${fecha}T${hora}:00`);
        const formData = new FormData();
        formData.append('nombre', nombre);
        formData.append('descripcion', descripcion);
        formData.append('fecha_hora_evento', fecha_hora_evento.toISOString());
        if (file) formData.append('file', file);
        if (eventoInicial && !file && !previewUrl) {
            formData.append('url_imagen_evento', '');
        }

        onSubmit(formData);
        resetFormulario()
        
    };

    if (!visible) return null;

    return (
        <div className="evtForm-overlay">
            <div className="evtForm-modal">
                <button 
                    className="evtForm-closeBtn"
                    onClick={() => {
                        resetFormulario();
                        onClose();
                    }}
                    title="Cerrar"
                >
                    <FiX size={24} />
                </button>

                <div className="evtForm-container">
                    <div className="evtForm-left">
                        <div className="evtForm-sectionHeader">
                            <h3>Selecciona la Fecha</h3>
                        </div>
                        <CalendarioReserva
                            onSelectFecha={(f) => setFecha(f)}
                            espacioId={0}
                        />
                    </div>

                    <div className="evtForm-right">
                        <div className="evtForm-header">
                            <h2>{eventoInicial ? 'Editar Evento' : 'Crear Nuevo Evento'}</h2>
                            <p className="evtForm-subtitle">Completa los datos del evento</p>
                        </div>

                        <div className="evtForm-group">
                            <label htmlFor="nombre">
                                <FiType size={18} />
                                Título del Evento
                            </label>
                            <input
                                id="nombre"
                                type="text"
                                placeholder="Ej: Torneo de Fútbol"
                                value={nombre}
                                onChange={(e) => setNombre(e.target.value)}
                            />
                        </div>

                        <div className="evtForm-group">
                            <label htmlFor="descripcion">
                                <FiFileText size={18} />
                                Descripción
                            </label>
                            <textarea
                                id="descripcion"
                                className="evtForm-textarea"
                                placeholder="Describe los detalles del evento..."
                                value={descripcion}
                                onChange={(e) => setDescripcion(e.target.value)}
                            />
                        </div>

                        <div className="evtForm-group">
                            <label htmlFor="hora">
                                <FiClock size={18} />
                                Hora del Evento
                            </label>
                            <input
                                id="hora"
                                type="time"
                                value={hora}
                                onChange={(e) => setHora(e.target.value)}
                            />
                        </div>

                        <div className="evtForm-group">
                            <label htmlFor="imagen">
                                <FiImage size={18} />
                                Imagen del Evento
                            </label>
                            <div
                                ref={dropRef}
                                className="evtForm-dropArea"
                                onClick={() => document.getElementById('fileInput').click()}
                                onDrop={handleDrop}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                            >
                                {previewUrl ? (
                                    <div className="evtForm-previewContainer">
                                        <img src={previewUrl} alt="Preview" className="evtForm-previewImage" />
                                        <button
                                            type="button"
                                            className="evtForm-removeImageBtn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setFile(null);
                                                setPreviewUrl('');
                                            }}
                                        >
                                            <FiX size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="evtForm-placeholderContent">
                                        <FiImage size={32} className="evtForm-placeholderIcon" />
                                        <p className="evtForm-previewPlaceholder">Arrastra una imagen aquí</p>
                                        <span className="evtForm-fileTypes">PNG, JPG, SVG o WEBP (Máx. 2MB)</span>
                                    </div>
                                )}

                                <input
                                    id="fileInput"
                                    type="file"
                                    accept="image/*"
                                    hidden
                                    onChange={(e) => handleFile(e.target.files[0])}
                                />
                            </div>
                        </div>

                        <div className="evtForm-buttons">
                            <button 
                                className="evtForm-btnSave"
                                onClick={() => handleSubmit()}
                            >
                                {eventoInicial ? 'Guardar Cambios' : 'Crear Evento'}
                            </button>
                            <button 
                                className="evtForm-btnCancel" 
                                onClick={() => {
                                    resetFormulario();
                                    onClose();
                                }}
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
