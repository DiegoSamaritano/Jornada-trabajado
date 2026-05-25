document.addEventListener('DOMContentLoaded', () => {
    
    // --- Control de la Intro (Duración exacta: 5 segundos) ---
    const introScreen = document.getElementById('intro-screen');
    if (introScreen) {
        setTimeout(() => {
            introScreen.classList.add('fade-out');
        }, 5000);
    }

    // DOM Controles de entrada
    const selectDia = document.getElementById('select-dia');
    const rangeIngresoHora = document.getElementById('range-ingreso-hora');
    const rangeIngresoMin = document.getElementById('range-ingreso-min');
    const rangeSalidaHora = document.getElementById('range-salida-hora');
    const rangeSalidaMin = document.getElementById('range-salida-min');
    const inputAlmuerzo = document.getElementById('input-almuerzo');
    const detallesDia = document.getElementById('detalles-dia');

    // DOM Elementos de respuesta en pantalla
    const valIngreso = document.getElementById('val-ingreso');
    const valSalida = document.getElementById('val-salida');
    const valAlmuerzo = document.getElementById('val-almuerzo');
    const resTrabajado = document.getElementById('res-trabajado');
    const resExtra = document.getElementById('res-extra');
    const progressFill = document.getElementById('progress-fill');
    const cardExtra = document.getElementById('card-extra');
    const btnDownloadTicket = document.getElementById('btn-download-ticket');

    cargarPersistencia();
    
    // Asignación de Listeners para actualización inmediata
    if (selectDia) selectDia.addEventListener('change', calcularTodo);
    if (rangeIngresoHora) rangeIngresoHora.addEventListener('input', calcularTodo);
    if (rangeIngresoMin) rangeIngresoMin.addEventListener('input', calcularTodo);
    if (rangeSalidaHora) rangeSalidaHora.addEventListener('input', calcularTodo);
    if (rangeSalidaMin) rangeSalidaMin.addEventListener('input', calcularTodo);
    if (detallesDia) detallesDia.addEventListener('input', calcularTodo);

    // Controles de Almuerzo
    const btnMinus = document.getElementById('btn-lunch-minus');
    const btnPlus = document.getElementById('btn-lunch-plus');

    if (btnMinus && inputAlmuerzo) {
        btnMinus.addEventListener('click', () => {
            let val = Math.max(0, parseInt(inputAlmuerzo.value) - 15);
            inputAlmuerzo.value = val;
            calcularTodo();
        });
    }

    if (btnPlus && inputAlmuerzo) {
        btnPlus.addEventListener('click', () => {
            let val = Math.min(240, parseInt(inputAlmuerzo.value) + 15);
            inputAlmuerzo.value = val;
            calcularTodo();
        });
    }

    if (btnDownloadTicket) {
        btnDownloadTicket.addEventListener('click', exportarComprobanteImagen);
    }

    // --- Lógica de cálculo ---
    function calcularTodo() {
        if (!rangeIngresoHora || !rangeIngresoMin || !rangeSalidaHora || !rangeSalidaMin || !inputAlmuerzo) return;

        const minIngreso = (parseInt(rangeIngresoHora.value) * 60) + parseInt(rangeIngresoMin.value);
        const minSalida = (parseInt(rangeSalidaHora.value) * 60) + parseInt(rangeSalidaMin.value);
        const minAlmuerzo = parseInt(inputAlmuerzo.value);

        if (valIngreso) valIngreso.textContent = formatMinutesTo12H(minIngreso);
        if (valSalida) valSalida.textContent = formatMinutesTo12H(minSalida);
        if (valAlmuerzo) {
            valAlmuerzo.textContent = minAlmuerzo >= 60 
                ? `${(minAlmuerzo/60).toFixed(1).replace('.0', '')} hrs` 
                : `${minAlmuerzo} min`;
        }

        let tiempoEfectivo = (minSalida - minIngreso) - minAlmuerzo;
        if (tiempoEfectivo < 0) tiempoEfectivo = 0;

        const JORNADA_BASE = 8 * 60; 
        let horasExtra = 0;

        if (tiempoEfectivo > JORNADA_BASE) {
            horasExtra = tiempoEfectivo - JORNADA_BASE;
        }

        if (resTrabajado) resTrabajado.textContent = formatMinToOutput(tiempoEfectivo);
        if (resExtra) resExtra.textContent = formatMinToOutput(horasExtra);

        if (cardExtra) {
            if (horasExtra > 0) {
                cardExtra.classList.add('active');
            } else {
                cardExtra.classList.remove('active');
            }
        }

        if (progressFill) {
            const porcentajeProgreso = Math.min(100, (tiempoEfectivo / JORNADA_BASE) * 100);
            progressFill.style.width = `${porcentajeProgreso}%`;
            progressFill.style.backgroundColor = tiempoEfectivo > JORNADA_BASE ? '#10b981' : '#3b82f6';
        }

        localStorage.setItem('devtime_state', JSON.stringify({
            dia: selectDia ? selectDia.value : 'Lunes',
            ingresoHora: rangeIngresoHora.value,
            ingresoMin: rangeIngresoMin.value,
            salidaHora: rangeSalidaHora.value,
            salidaMin: rangeSalidaMin.value,
            almuerzo: minAlmuerzo,
            nota: detallesDia ? detallesDia.value : ''
        }));
    }

    function formatMinutesTo12H(totalMinutes) {
        let hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        const ampm = hours >= 12 ? 'PM' : 'AM';
        
        if (hours > 12) hours -= 12;
        if (hours === 0) hours = 12;

        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${ampm}`;
    }

    function formatMinToOutput(totalMinutes) {
        return `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`;
    }

    // --- Generador de Ticket en Imagen ---
    function exportarComprobanteImagen() {
        const canvas = document.createElement('canvas');
        canvas.width = 500;
        canvas.height = 560;
        const ctx = canvas.getContext('2d');
        const diaActual = selectDia ? selectDia.value : 'Lunes';

        ctx.fillStyle = '#1a1c2a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#3b82f6';
        ctx.fillRect(0, 0, canvas.width, 10);

        ctx.fillStyle = '#f0f2f5';
        ctx.font = 'bold 22px sans-serif';
        ctx.fillText('⚡ COMPROBANTE DE JORNADA', 35, 55);

        ctx.fillStyle = '#8a90a6';
        ctx.font = '15px sans-serif';
        ctx.fillText(`Colaboradora: Marleny`, 35, 95);
        ctx.fillText(`Día Registrado: ${diaActual}`, 35, 120);

        ctx.strokeStyle = '#2a2d42';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(35, 145); ctx.lineTo(465, 145); ctx.stroke();

        ctx.fillStyle = '#f0f2f5';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText('Horarios Registrados', 35, 180);

        ctx.font = '15px sans-serif';
        ctx.fillStyle = '#8a90a6';
        ctx.fillText('Entrada (AM):', 35, 215);
        ctx.fillStyle = '#f0f2f5';
        ctx.fillText(valIngreso ? valIngreso.textContent : '--', 190, 215);

        ctx.fillStyle = '#8a90a6';
        ctx.fillText('Salida (PM):', 35, 245);
        ctx.fillStyle = '#f0f2f5';
        ctx.fillText(valSalida ? valSalida.textContent : '--', 190, 245);

        ctx.fillStyle = '#8a90a6';
        ctx.fillText('Almuerzo:', 35, 275);
        ctx.fillStyle = '#f0f2f5';
        ctx.fillText(valAlmuerzo ? valAlmuerzo.textContent : '--', 190, 275);

        ctx.beginPath(); ctx.moveTo(35, 305); ctx.lineTo(465, 305); ctx.stroke();

        ctx.fillStyle = '#f0f2f5';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText('Cómputo de Horas', 35, 340);

        ctx.font = '15px sans-serif';
        ctx.fillStyle = '#8a90a6';
        ctx.fillText('Tiempo Neto Realizado:', 35, 375);
        ctx.fillStyle = '#3b82f6';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText(resTrabajado ? resTrabajado.textContent : '--', 220, 375);

        ctx.font = '15px sans-serif';
        ctx.fillStyle = '#8a90a6';
        ctx.fillText('Horas Extras:', 35, 405);
        
        const txtExtra = resExtra ? resExtra.textContent : '0h 0m';
        const tieneExtra = parseInt(txtExtra) > 0;
        ctx.fillStyle = tieneExtra ? '#10b981' : '#f0f2f5';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText(txtExtra, 220, 405);

        ctx.strokeStyle = '#2a2d42';
        ctx.beginPath(); ctx.moveTo(35, 435); ctx.lineTo(465, 435); ctx.stroke(); // Corregido el bug del stroke

        ctx.fillStyle = '#f0f2f5';
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText('Notas adicionales:', 35, 465);

        ctx.font = 'italic 14px sans-serif';
        ctx.fillStyle = '#8a90a6';
        const txtNota = (detallesDia && detallesDia.value.trim() !== '') ? detallesDia.value : 'Sin observaciones anotadas hoy.';
        
        let lineaActual = '';
        let coordY = 490;
        const palabras = txtNota.split(' ');
        
        for (let i = 0; i < palabras.length; i++) {
            let lineaTentativa = lineaActual + palabras[i] + ' ';
            if (ctx.measureText(lineaTentativa).width > 410 && i > 0) {
                ctx.fillText(lineaActual, 35, coordY);
                lineaActual = palabras[i] + ' ';
                coordY += 20;
            } else {
                lineaActual = lineaTentativa;
            }
        }
        ctx.fillText(lineaActual, 35, coordY);

        const disparadorDescarga = document.createElement('a');
        disparadorDescarga.download = `Comprobante_Jornada_${diaActual}.png`;
        disparadorDescarga.href = canvas.toDataURL('image/png');
        disparadorDescarga.click();
    }

    function cargarPersistencia() {
        const estadoGuardado = localStorage.getItem('devtime_state');
        if (estadoGuardado) {
            const data = JSON.parse(estadoGuardado);
            if (data.dia && selectDia) selectDia.value = data.dia;
            if (rangeIngresoHora) rangeIngresoHora.value = data.ingresoHora || 8;
            if (rangeIngresoMin) rangeIngresoMin.value = data.ingresoMin || 0;
            if (rangeSalidaHora) rangeSalidaHora.value = data.salidaHora || 17;
            if (rangeSalidaMin) rangeSalidaMin.value = data.salidaMin || 0;
            if (inputAlmuerzo) inputAlmuerzo.value = data.almuerzo || 60;
            if (detallesDia) detallesDia.value = data.nota || '';
        }
        calcularTodo();
    }
});
