document.addEventListener('DOMContentLoaded', () => {
    
    // --- Control de la Intro (Modificado exactamente a 5000ms / 5 Segundos) ---
    const introScreen = document.getElementById('intro-screen');
    setTimeout(() => {
        introScreen.classList.add('fade-out');
    }, 5000);

    // DOM Controles Deslizantes Divididos
    const selectDia = document.getElementById('select-dia');
    const rangeIngresoHora = document.getElementById('range-ingreso-hora');
    const rangeIngresoMin = document.getElementById('range-ingreso-min');
    const rangeSalidaHora = document.getElementById('range-salida-hora');
    const rangeSalidaMin = document.getElementById('range-salida-min');
    
    const inputAlmuerzo = document.getElementById('input-almuerzo');
    const detallesDia = document.getElementById('detalles-dia');

    // DOM Elementos de Respuesta
    const valIngreso = document.getElementById('val-ingreso');
    const valSalida = document.getElementById('val-salida');
    const valAlmuerzo = document.getElementById('val-almuerzo');

    const resTrabajado = document.getElementById('res-trabajado');
    const resExtra = document.getElementById('res-extra');
    const progressFill = document.getElementById('progress-fill');
    const cardExtra = document.getElementById('card-extra');
    const notePreviewArea = document.getElementById('note-preview-area');
    const resNota = document.getElementById('res-nota');
    const btnDownloadTicket = document.getElementById('btn-download-ticket');

    // Inicializar persistencia de datos previos
    cargarPersistencia();
    
    // Asignación de Listeners Reactivos
    selectDia.addEventListener('change', calcularTodo);
    rangeIngresoHora.addEventListener('input', calcularTodo);
    rangeIngresoMin.addEventListener('input', calcularTodo);
    rangeSalidaHora.addEventListener('input', calcularTodo);
    rangeSalidaMin.addEventListener('input', calcularTodo);
    detallesDia.addEventListener('input', calcularTodo);

    // Controles Stepper (Almuerzo)
    document.getElementById('btn-lunch-minus').addEventListener('click', () => {
        let val = Math.max(0, parseInt(inputAlmuerzo.value) - 15);
        inputAlmuerzo.value = val;
        calcularTodo();
    });

    document.getElementById('btn-lunch-plus').addEventListener('click', () => {
        let val = Math.min(240, parseInt(inputAlmuerzo.value) + 15);
        inputAlmuerzo.value = val;
        calcularTodo();
    });

    // Evento de exportación de imagen
    btnDownloadTicket.addEventListener('click', exportarComprobanteImagen);

    // --- Lógica de Procesamiento Central ---
    function calcularTodo() {
        const minIngreso = (parseInt(rangeIngresoHora.value) * 60) + parseInt(rangeIngresoMin.value);
        const minSalida = (parseInt(rangeSalidaHora.value) * 60) + parseInt(rangeSalidaMin.value);
        const minAlmuerzo = parseInt(inputAlmuerzo.value);

        // 1. Mostrar etiquetas visuales formateadas
        valIngreso.textContent = formatMinutesTo12H(minIngreso);
        valSalida.textContent = formatMinutesTo12H(minSalida);
        valAlmuerzo.textContent = minAlmuerzo >= 60 
            ? `${(minAlmuerzo/60).toFixed(1).replace('.0', '')} hrs` 
            : `${minAlmuerzo} min`;

        // 2. Operación de tiempo efectivo neto
        let tiempoEfectivo = (minSalida - minIngreso) - minAlmuerzo;
        if (tiempoEfectivo < 0) tiempoEfectivo = 0;

        const JORNADA_BASE = 8 * 60; 
        let horasExtra = 0;

        if (tiempoEfectivo > JORNADA_BASE) {
            horasExtra = tiempoEfectivo - JORNADA_BASE;
        }

        // 3. Renderizado de métricas en UI
        resTrabajado.textContent = formatMinToOutput(tiempoEfectivo);
        resExtra.textContent = formatMinToOutput(horasExtra);

        if (horasExtra > 0) {
            cardExtra.classList.add('active');
        } else {
            cardExtra.classList.remove('active');
        }

        // Modificación dinámica de barra de progreso
        const porcentajeProgreso = Math.min(100, (tiempoEfectivo / JORNADA_BASE) * 100);
        progressFill.style.width = `${porcentajeProgreso}%`;
        progressFill.style.backgroundColor = tiempoEfectivo > JORNADA_BASE ? '#10b981' : '#3b82f6';

        // Gestión de cuadro de previsualización de notas
        if (detallesDia.value.trim() !== '') {
            resNota.textContent = detallesDia.value;
            notePreviewArea.classList.remove('hidden');
        } else {
            notePreviewArea.classList.add('hidden');
        }

        // 4. Sincronizar estado en LocalStorage
        localStorage.setItem('devtime_state', JSON.stringify({
            dia: selectDia.value,
            ingresoHora: rangeIngresoHora.value,
            ingresoMin: rangeIngresoMin.value,
            salidaHora: rangeSalidaHora.value,
            salidaMin: rangeSalidaMin.value,
            almuerzo: minAlmuerzo,
            nota: detallesDia.value
        }));
    }

    // Convertidor: Minutos directos -> Formato Reloj 12h (AM/PM)
    function formatMinutesTo12H(totalMinutes) {
        let hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        const ampm = hours >= 12 ? 'PM' : 'AM';
        
        if (hours > 12) hours -= 12;
        if (hours === 0) hours = 12;

        const strHours = String(hours).padStart(2, '0');
        const strMinutes = String(minutes).padStart(2, '0');

        return `${strHours}:${strMinutes} ${ampm}`;
    }

    // Convertidor: Minutos directos -> Texto legible ("7h 45m")
    function formatMinToOutput(totalMinutes) {
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return `${hours}h ${minutes}m`;
    }

    // --- Motor Gráfico del Comprobante (Canvas HTML5) ---
    function exportarComprobanteImagen() {
        const canvas = document.createElement('canvas');
        canvas.width = 480;
        canvas.height = 540;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#1a1c2a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#3b82f6';
        ctx.fillRect(0, 0, canvas.width, 8);

        ctx.fillStyle = '#f0f2f5';
        ctx.font = 'bold 20px system-ui, sans-serif';
        ctx.fillText('⚡ COMPROBANTE DE JORNADA', 35, 50);

        ctx.fillStyle = '#8a90a6';
        ctx.font = '14px system-ui, sans-serif';
        ctx.fillText(`Marleny`, 35, 85);
        ctx.fillText(`Día Registrado: ${selectDia.value}`, 35, 108);

        ctx.strokeStyle = '#2a2d42';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(35, 135); ctx.lineTo(445, 135); ctx.stroke();

        ctx.fillStyle = '#f0f2f5';
        ctx.font = 'bold 15px system-ui, sans-serif';
        ctx.fillText('Horarios Registrados', 35, 165);

        ctx.font = '14px system-ui, sans-serif';
        ctx.fillStyle = '#8a90a6';
        ctx.fillText('Entrada :', 35, 200);
        ctx.fillStyle = '#f0f2f5';
        ctx.fillText(valIngreso.textContent, 170, 200);

        ctx.fillStyle = '#8a90a6';
        ctx.fillText('Salida :', 35, 230);
        ctx.fillStyle = '#f0f2f5';
        ctx.fillText(valSalida.textContent, 170, 230);

        ctx.fillStyle = '#8a90a6';
        ctx.fillText('Almuerzo:', 35, 260);
        ctx.fillStyle = '#f0f2f5';
        ctx.fillText(valAlmuerzo.textContent, 170, 260);

        ctx.beginPath(); ctx.moveTo(35, 290); ctx.lineTo(445, 290); ctx.stroke();

        ctx.fillStyle = '#f0f2f5';
        ctx.font = 'bold 15px system-ui, sans-serif';
        ctx.fillText('Total de Horas', 35, 320);

        ctx.font = '14px system-ui, sans-serif';
        ctx.fillStyle = '#8a90a6';
        ctx.fillText('Horas de Trabajo:', 35, 355);
        ctx.fillStyle = '#3b82f6';
        ctx.font = 'bold 15px system-ui, sans-serif';
        ctx.fillText(resTrabajado.textContent, 210, 355);

        ctx.font = '14px system-ui, sans-serif';
        ctx.fillStyle = '#8a90a6';
        ctx.fillText('Horas Extras:', 35, 385);
        
        const tieneExtra = parseInt(resExtra.textContent) > 0;
        ctx.fillStyle = tieneExtra ? '#10b981' : '#f0f2f5';
        ctx.font = 'bold 15px system-ui, sans-serif';
        ctx.fillText(resExtra.textContent, 210, 385);

        ctx.strokeStyle = '#2a2d42';
        ctx.beginPath(); ctx.moveTo(35, 415); ctx.lineTo(445, 415); ctx.stroke();

        ctx.fillStyle = '#f0f2f5';
        ctx.font = 'bold 13px system-ui, sans-serif';
        ctx.fillText('Notas adicionales:', 35, 445);

        ctx.font = 'italic 13px system-ui, sans-serif';
        ctx.fillStyle = '#8a90a6';
        const txtNota = detallesDia.value.trim() !== '' ? detallesDia.value : 'Sin observaciones anotadas hoy.';
        
        let lineaActual = '';
        let coordY = 470;
        const palabras = txtNota.split(' ');
        
        for (let i = 0; i < palabras.length; i++) {
            let lineaTentativa = lineaActual + palabras[i] + ' ';
            if (ctx.measureText(lineaTentativa).width > 400 && i > 0) {
                ctx.fillText(lineaActual, 35, coordY);
                lineaActual = palabras[i] + ' ';
                coordY += 18;
            } else {
                lineaActual = lineaTentativa;
            }
        }
        ctx.fillText(lineaActual, 35, coordY);

        const disparadorDescarga = document.createElement('a');
        disparadorDescarga.download = `Comprobante_Jornada_${selectDia.value}.png`;
        disparadorDescarga.href = canvas.toDataURL('image/png');
        disparadorDescarga.click();
    }

    // Recuperar estados anteriores guardados localmente
    function cargarPersistencia() {
        const estadoGuardado = localStorage.getItem('devtime_state');
        if (estadoGuardado) {
            const data = JSON.parse(estadoGuardado);
            if (data.dia) selectDia.value = data.dia;
            rangeIngresoHora.value = data.ingresoHora || 8;
            rangeIngresoMin.value = data.ingresoMin || 0;
            rangeSalidaHora.value = data.salidaHora || 17;
            rangeSalidaMin.value = data.salidaMin || 0;
            inputAlmuerzo.value = data.almuerzo || 60;
            detallesDia.value = data.nota || '';
        }
        calcularTodo();
    }
});