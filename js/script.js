(function () {
    // --- CLAVES DE LOCALSTORAGE ---
    const KEYS = {
        PARTICIPANTES: 'participantes_v1',
        LUGARES: 'lugares_v1',
        GRUPOS: 'grupos_v1',
        MANUALES: 'manuales_v9',
        CONFIG_DIAS: 'config_dias_v3',
        THEME: 'theme_v1',
        FECHA_INICIO: 'fecha_inicio_v1',
        CANTIDAD_FECHAS: 'cantidad_fechas_v1',
        FECHA_FINAL: 'fecha_final_v1'
    };

    const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

    // --- ESTADO GLOBAL ---
    let state = {
        participantes: [],
        lugares: [],
        grupos: [],
        manuales: {},
        configDias: {
            0: [], 1: ['7:00-9:00 am'], 2: ['7:00-9:00 am'], 3: ['7:00-9:00 am'],
            4: ['7:00-9:00 am'], 5: ['7:00-9:00 am'], 6: ['7:00-9:00 am']
        },
        uiState: {}
    };

    // --- REFERENCIAS EXACTAS AL index.html ---
    const els = {
        fInicio: document.getElementById('fechaInicio'),
        fFinal: document.getElementById('fechaFinal'),
        cantidadFechas: document.getElementById('cantidadFechas'),
        tablaBody: document.getElementById('cuerpoTabla'),
        listaParticipantes: document.getElementById('listaParticipantes'),
        listaLugares: document.getElementById('listaLugares'),
        listaGrupos: document.getElementById('listaGrupos'),
        nuevoParticipante: document.getElementById('nuevoParticipanteNombre'),
        nuevoLugarNombre: document.getElementById('nuevoLugarNombre'),
        nuevoGrupoNombre: document.getElementById('nuevoGrupoNombre'),
        btnAgregarParticipante: document.getElementById('btnAgregarParticipante'),
        btnAgregarLugar: document.getElementById('btnAgregarLugar'),
        btnAgregarGrupo: document.getElementById('btnAgregarGrupo'),
        btnLimpiarGrupos: document.getElementById('btnLimpiarGrupos'),
        fileParticipantes: document.getElementById('fileParticipantes'),
        fileLugares: document.getElementById('fileLugares'),
        fileGrupos: document.getElementById('fileGrupos'),
        btnToggleTheme: document.getElementById('btnToggleTheme'),
        btnBloquearTodo: document.getElementById('btnBloquearTodo'),
        btnAsignarParticipantes: document.getElementById('btnAsignarParticipantes'),
        btnLimpiarAsignaciones: document.getElementById('btnLimpiarAsignaciones'),
        toggleSidebar: document.getElementById('toggleSidebar'),
        layout: document.querySelector('.main-layout'),
        diasContainer: document.getElementById('selectorDiasContainer')
    };

    // --- CREACIÓN Y SANITIZACIÓN DE DISPONIBILIDAD ---
    const createDefaultDisp = () => {
        let d = {};
        for (let i = 0; i < 7; i++) {
            d[i] = { m: false, t: false, pM: false, pT: false };
        }
        return d;
    };

    function sanitizeDisponibilidad(disp) {
        const safeDisp = createDefaultDisp();
        if (disp && typeof disp === 'object') {
            for (let i = 0; i < 7; i++) {
                if (disp[i]) {
                    safeDisp[i] = {
                        m: !!disp[i].m,
                        t: !!disp[i].t,
                        pM: !!disp[i].pM,
                        pT: !!disp[i].pT
                    };
                }
            }
        }
        return safeDisp;
    }

    // --- GUARDAR EN STORAGE ---
    function saveToStorage() {
        localStorage.setItem(KEYS.PARTICIPANTES, JSON.stringify(state.participantes));
        localStorage.setItem(KEYS.LUGARES, JSON.stringify(state.lugares));
        localStorage.setItem(KEYS.GRUPOS, JSON.stringify(state.grupos));
        localStorage.setItem(KEYS.MANUALES, JSON.stringify(state.manuales));
        localStorage.setItem(KEYS.CONFIG_DIAS, JSON.stringify(state.configDias));
    }

    // --- CARGAR DE STORAGE ---
    function loadFromStorage() {
        try {
            const rawPart = JSON.parse(localStorage.getItem(KEYS.PARTICIPANTES)) || [];
            state.participantes = rawPart.map(p => {
                if (!p) return null;
                if (typeof p === 'string') return { name: p, disponibilidad: createDefaultDisp(), cartas: false };
                return {
                    name: p.name || '',
                    disponibilidad: sanitizeDisponibilidad(p.disponibilidad),
                    cartas: !!p.cartas
                };
            }).filter(p => p && p.name);

            state.lugares = JSON.parse(localStorage.getItem(KEYS.LUGARES)) || [];
            state.grupos = JSON.parse(localStorage.getItem(KEYS.GRUPOS)) || [];
            state.manuales = JSON.parse(localStorage.getItem(KEYS.MANUALES)) || {};

            const savedDias = JSON.parse(localStorage.getItem(KEYS.CONFIG_DIAS));
            if (savedDias) state.configDias = savedDias;

            if (localStorage.getItem(KEYS.THEME) === 'dark') {
                document.body.dataset.theme = 'dark';
            }
        } catch (e) {
            console.error("Error al cargar localStorage:", e);
        }
    }

    // --- QUITAR ELEMENTOS DE LISTA ---
    function removeListItem(type, index) {
        if (type === 'lugares' && state.lugares[index] !== undefined) state.lugares.splice(index, 1);
        if (type === 'grupos' && state.grupos[index] !== undefined) state.grupos.splice(index, 1);
        saveToStorage();
        renderListas();
    }
    window.removeListItem = removeListItem;

    // --- RENDERIZAR LISTAS LATERALES ---
    function renderListas() {
        if (!els.listaParticipantes) return;
        els.listaParticipantes.innerHTML = '';

        state.participantes.sort((a, b) => (a.name || '').localeCompare(b.name || '')).forEach((item, i) => {
            if (!item || !item.name) return;

            const li = document.createElement('li');
            li.style.display = 'flex';
            li.style.flexDirection = 'column';
            li.style.alignItems = 'stretch';
            li.style.borderBottom = '1px solid #ccc';
            li.style.paddingBottom = '6px';
            li.style.marginBottom = '6px';

            const topRow = document.createElement('div');
            topRow.style.display = 'flex';
            topRow.style.alignItems = 'center';
            topRow.style.justifyContent = 'space-between';

            const nameSpan = document.createElement('span');
            nameSpan.textContent = item.name;
            nameSpan.style.flex = '1';
            nameSpan.style.fontWeight = '500';

            const rightGroup = document.createElement('div');
            rightGroup.style.display = 'flex';
            rightGroup.style.alignItems = 'center';

            const tagCont = document.createElement('div');
            tagCont.style.display = 'flex';
            tagCont.style.gap = '2px';

            ['D', 'L', 'M', 'Mi', 'J', 'V', 'S'].forEach((letra, idx) => {
                const disp = item.disponibilidad[idx] || { m: false, t: false };
                const isActive = disp.m || disp.t;
                const btn = document.createElement('button');
                btn.textContent = letra;
                btn.style.padding = '2px 5px';
                btn.style.fontSize = '0.75em';
                btn.style.borderRadius = '3px';
                btn.style.border = '1px solid #ccc';
                btn.style.cursor = 'pointer';

                if (isActive) {
                    btn.style.background = '#4CAF50';
                    btn.style.color = 'white';
                } else {
                    btn.style.background = 'transparent';
                    btn.style.color = 'inherit';
                }

                btn.onclick = () => {
                    if (isActive) {
                        item.disponibilidad[idx] = { m: false, t: false, pM: false, pT: false };
                    } else {
                        item.disponibilidad[idx] = { m: true, t: true, pM: false, pT: false };
                    }
                    saveToStorage();
                    renderListas();
                };
                tagCont.appendChild(btn);
            });

            const uiKey = 'part_cfg_' + item.name;
            const configBtn = document.createElement('button');
            configBtn.innerHTML = '⚙️';
            configBtn.style.background = 'transparent';
            configBtn.style.border = 'none';
            configBtn.style.cursor = 'pointer';
            configBtn.style.marginLeft = '6px';
            configBtn.onclick = () => {
                state.uiState[uiKey] = !state.uiState[uiKey];
                renderListas();
            };

            const delBtn = document.createElement('button');
            delBtn.textContent = '×';
            delBtn.style.marginLeft = '6px';
            delBtn.style.background = 'transparent';
            delBtn.style.border = 'none';
            delBtn.style.cursor = 'pointer';
            delBtn.style.color = '#d32f2f';
            delBtn.style.fontSize = '1.2em';
            delBtn.onclick = () => {
                if (confirm(`¿Eliminar a "${item.name}"?`)) {
                    state.participantes = state.participantes.filter(p => p.name !== item.name);
                    saveToStorage();
                    renderListas();
                }
            };

            rightGroup.append(tagCont, configBtn, delBtn);
            topRow.append(nameSpan, rightGroup);
            li.appendChild(topRow);

            const detailsDiv = document.createElement('div');
            detailsDiv.style.display = state.uiState[uiKey] ? 'block' : 'none';
            detailsDiv.style.fontSize = '0.82em';
            detailsDiv.style.marginTop = '8px';
            detailsDiv.style.background = 'var(--card-accent, #f9f9f9)';
            detailsDiv.style.padding = '8px';
            detailsDiv.style.borderRadius = '4px';
            detailsDiv.style.border = '1px solid var(--border)';

            const header = document.createElement('div');
            header.style.display = 'grid';
            header.style.gridTemplateColumns = '40px 1fr 1fr 1fr 1fr';
            header.style.textAlign = 'center';
            header.style.fontWeight = 'bold';
            header.style.marginBottom = '6px';
            header.style.borderBottom = '1px solid var(--border)';
            header.style.paddingBottom = '3px';
            header.innerHTML = `<span>Día</span><span title="Mañana">☀️ M</span><span title="Tarde">🌤️ T</span><span title="Prioridad M">⭐ M</span><span title="Prioridad T">⭐ T</span>`;
            detailsDiv.appendChild(header);

            ['D', 'L', 'M', 'Mi', 'J', 'V', 'S'].forEach((letra, idx) => {
                const row = document.createElement('div');
                row.style.display = 'grid';
                row.style.gridTemplateColumns = '40px 1fr 1fr 1fr 1fr';
                row.style.textAlign = 'center';
                row.style.alignItems = 'center';
                row.style.marginBottom = '4px';

                const dSpan = document.createElement('span');
                dSpan.textContent = letra;
                dSpan.style.fontWeight = 'bold';

                const currentDisp = item.disponibilidad[idx] || { m: false, t: false, pM: false, pT: false };

                const chkM = document.createElement('input'); chkM.type = 'checkbox'; chkM.checked = !!currentDisp.m;
                const chkT = document.createElement('input'); chkT.type = 'checkbox'; chkT.checked = !!currentDisp.t;
                const chkPM = document.createElement('input'); chkPM.type = 'checkbox'; chkPM.checked = !!currentDisp.pM;
                const chkPT = document.createElement('input'); chkPT.type = 'checkbox'; chkPT.checked = !!currentDisp.pT;

                const updateDisp = (e) => {
                    if (e.target === chkPM && chkPM.checked) chkM.checked = true;
                    if (e.target === chkPT && chkPT.checked) chkT.checked = true;
                    if (e.target === chkM && !chkM.checked) chkPM.checked = false;
                    if (e.target === chkT && !chkT.checked) chkPT.checked = false;

                    item.disponibilidad[idx] = { m: chkM.checked, t: chkT.checked, pM: chkPM.checked, pT: chkPT.checked };
                    saveToStorage();
                    renderTabla();
                };

                chkM.onchange = updateDisp; chkT.onchange = updateDisp; chkPM.onchange = updateDisp; chkPT.onchange = updateDisp;
                row.append(dSpan, chkM, chkT, chkPM, chkPT);
                detailsDiv.appendChild(row);
            });

            const genOptions = document.createElement('div');
            genOptions.style.marginTop = '8px';
            genOptions.style.borderTop = '1px dashed var(--border)';
            genOptions.style.paddingTop = '8px';
            genOptions.innerHTML = `<label style="cursor:pointer; display:flex; align-items:center; gap:5px;"><input type="checkbox" ${item.cartas ? 'checked' : ''}> ✉️ Disponible siempre (Cartas / Especial)</label>`;

            const chkCartas = genOptions.querySelector('input');
            if (chkCartas) {
                chkCartas.onchange = (e) => {
                    item.cartas = e.target.checked;
                    saveToStorage();
                    renderTabla();
                };
            }
            detailsDiv.appendChild(genOptions);

            li.appendChild(detailsDiv);
            els.listaParticipantes.appendChild(li);
        });

        // --- LUGARES ---
        if (els.listaLugares) {
            els.listaLugares.innerHTML = '';
            (state.lugares || []).sort().forEach((l, i) => {
                if (l) els.listaLugares.innerHTML += `<li class="participant-item"><span>${l}</span><button onclick="window.removeListItem('lugares', ${i})">×</button></li>`;
            });
        }

        // --- GRUPOS ---
        if (els.listaGrupos) {
            els.listaGrupos.innerHTML = '';
            (state.grupos || []).sort().forEach((g, i) => {
                if (g) els.listaGrupos.innerHTML += `<li class="participant-item"><span>${g}</span><button onclick="window.removeListItem('grupos', ${i})">×</button></li>`;
            });
        }

        renderTabla();
    }

    // --- CONFIGURADOR DE HORARIOS ---
    function renderDiasSelector() {
        const container = els.diasContainer;
        if (!container) return;
        container.innerHTML = '';

        DIAS_SEMANA.forEach((dia, idx) => {
            const div = document.createElement('div');
            div.style.marginBottom = '10px';
            div.style.borderBottom = '1px solid var(--border)';
            div.style.paddingBottom = '5px';

            const label = document.createElement('strong');
            label.textContent = dia + ': ';
            div.appendChild(label);

            const input = document.createElement('input');
            input.type = 'text';
            input.placeholder = 'Ej: 7:00-9:00 am, 4:00-6:00 pm';
            input.value = (state.configDias && state.configDias[idx] ? state.configDias[idx] : []).join(', ');
            input.style.width = '65%';
            input.style.marginLeft = '10px';

            input.onchange = (e) => {
                if (!state.configDias) state.configDias = {};
                state.configDias[idx] = e.target.value.split(',').map(h => h.trim()).filter(h => h);
                saveToStorage();
                renderTabla();
            };

            div.appendChild(input);
            container.appendChild(div);
        });
    }

    // --- PARSEO SEGURO DE FECHAS ---
    function parseFecha(str) {
        if (!str) return null;
        let d;
        if (str.includes('-')) {
            const [y, m, day] = str.split('-');
            d = new Date(parseInt(y), parseInt(m) - 1, parseInt(day));
        } else {
            d = new Date(str);
        }
        return (d && !isNaN(d.getTime())) ? d : null;
    }

    function formatFechaCompleta(date) {
        if (!date) return '';
        const d = String(date.getDate()).padStart(2, '0');
        const m = String(date.getMonth() + 1).padStart(2, '0');
        return `${DIAS_SEMANA[date.getDay()]} ${d}/${m}`;
    }

    function getTurnoPorHora(horaStr) {
        if (!horaStr) return 'm';
        const lower = horaStr.toLowerCase();
        if (lower.includes('pm') || lower.includes('tarde') || lower.includes('12:') || lower.includes('13:') || lower.includes('14:') || lower.includes('15:') || lower.includes('16:') || lower.includes('17:') || lower.includes('18:') || lower.includes('19:')) {
            return 't';
        }
        return 'm';
    }

    // --- RENDERIZADO DEL CRONOGRAMA ---
    function renderTabla() {
        if (!els.tablaBody || !els.fInicio) return;
        els.tablaBody.innerHTML = '';

        let start = parseFecha(els.fInicio.value);
        if (!start) return;

        let totalDias = 30;
        if (els.cantidadFechas && els.cantidadFechas.value !== 'custom') {
            totalDias = parseInt(els.cantidadFechas.value) || 30;
        } else if (els.fFinal && els.fFinal.value) {
            let end = parseFecha(els.fFinal.value);
            if (end) {
                let diffTime = Math.abs(end - start);
                totalDias = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
            }
        }

        let dates = [];
        for (let i = 0; i < totalDias; i++) {
            let d = new Date(start);
            d.setDate(start.getDate() + i);
            dates.push(d);
        }

        dates.forEach(date => {
            const dayOfWeek = date.getDay();
            const horasConfiguradas = (state.configDias && state.configDias[dayOfWeek]) ? state.configDias[dayOfWeek] : [];

            if (horasConfiguradas.length === 0) return;

            const tr = document.createElement('tr');

            const tdDia = document.createElement('td');
            tdDia.textContent = formatFechaCompleta(date);
            tdDia.style.verticalAlign = 'middle';
            tr.appendChild(tdDia);

            const tdHora = document.createElement('td');
            const tdLugar = document.createElement('td');
            const tdPart = document.createElement('td');
            const tdAcc = document.createElement('td');

            tdHora.style.padding = '0';
            tdLugar.style.padding = '0';
            tdPart.style.padding = '0';
            tdAcc.style.padding = '0';
            tdHora.style.verticalAlign = 'top';
            tdLugar.style.verticalAlign = 'top';
            tdPart.style.verticalAlign = 'top';
            tdAcc.style.verticalAlign = 'top';

            horasConfiguradas.forEach((hora, idx) => {
                const keyBase = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}_${hora}_${idx}`;
                const turno = getTurnoPorHora(hora);

                const isLast = idx === horasConfiguradas.length - 1;
                const blockStyle = `display: flex; align-items: center; justify-content: center; min-height: 45px; padding: 5px; border-bottom: ${isLast ? 'none' : '1px solid var(--border, #ccc)'};`;

                // Columna Hora
                const divHora = document.createElement('div');
                divHora.style.cssText = blockStyle;
                divHora.textContent = hora;
                tdHora.appendChild(divHora);

                // Columna Lugar
                const divLugar = document.createElement('div');
                divLugar.style.cssText = blockStyle;
                const keyLugar = keyBase + '_lugar';
                const selLugar = document.createElement('select');
                selLugar.innerHTML = '<option value="">-- Seleccionar --</option>';
                (state.lugares || []).forEach(l => {
                    if (l) selLugar.innerHTML += `<option value="${l}" ${state.manuales[keyLugar] === l ? 'selected' : ''}>${l}</option>`;
                });
                selLugar.onchange = (e) => {
                    state.manuales[keyLugar] = e.target.value;
                    saveToStorage();
                };
                divLugar.appendChild(selLugar);
                tdLugar.appendChild(divLugar);

                // Columna Participantes
                const divPart = document.createElement('div');
                divPart.style.cssText = blockStyle + " flex-direction: column; align-items: stretch; justify-content: center; gap: 5px;";

                const selectContainer = document.createElement('div');
                selectContainer.style.display = 'flex';
                selectContainer.style.flexDirection = 'column';
                selectContainer.style.gap = '5px';

                let slotsKeys = Object.keys(state.manuales).filter(k => k.startsWith(`${keyBase}_p`));
                let maxSlot = 1;
                if (slotsKeys.length > 0) {
                    let indices = slotsKeys.map(k => parseInt(k.replace(`${keyBase}_p`, ''))).filter(n => !isNaN(n));
                    if (indices.length > 0) maxSlot = Math.max(...indices);
                }
                if (maxSlot < 1) maxSlot = 1;

                let currentSlotCount = maxSlot;

                const createSelect = (slotIndex) => {
                    const keyPart = `${keyBase}_p${slotIndex}`;
                    const selPart = document.createElement('select');
                    selPart.className = 'select-participante-row';
                    selPart.style.width = '100%';
                    selPart.innerHTML = '<option value="">-- Seleccionar --</option>';

                    const assignedName = state.manuales[keyPart];

                    (state.participantes || []).forEach(p => {
                        if (!p || !p.name) return;

                        let isAvailable = false;
                        if (p.cartas) {
                            isAvailable = true;
                        } else if (p.disponibilidad && p.disponibilidad[dayOfWeek]) {
                            isAvailable = turno === 'm' ? p.disponibilidad[dayOfWeek].m : p.disponibilidad[dayOfWeek].t;
                        }

                        if (isAvailable || p.name === assignedName) {
                            selPart.innerHTML += `<option value="${p.name}" ${assignedName === p.name ? 'selected' : ''}>${p.name}</option>`;
                        }
                    });

                    selPart.onchange = (e) => {
                        if (e.target.value) {
                            state.manuales[keyPart] = e.target.value;
                        } else {
                            delete state.manuales[keyPart];
                        }
                        saveToStorage();
                    };
                    return selPart;
                };

                for (let slot = 1; slot <= currentSlotCount; slot++) {
                    selectContainer.appendChild(createSelect(slot));
                }

                const btnAddPart = document.createElement('button');
                btnAddPart.textContent = '+ Agregar otro';
                btnAddPart.style.fontSize = '0.75em';
                btnAddPart.style.padding = '3px 6px';
                btnAddPart.style.cursor = 'pointer';
                btnAddPart.style.background = 'var(--bg-color, #e0e0e0)';
                btnAddPart.style.border = '1px dashed var(--border, #999)';
                btnAddPart.style.borderRadius = '3px';
                btnAddPart.style.color = 'inherit';
                btnAddPart.style.alignSelf = 'flex-start';

                btnAddPart.onclick = () => {
                    currentSlotCount++;
                    selectContainer.appendChild(createSelect(currentSlotCount));
                };

                divPart.appendChild(selectContainer);
                divPart.appendChild(btnAddPart);
                tdPart.appendChild(divPart);

                // Columna Acciones
                const divAcc = document.createElement('div');
                divAcc.style.cssText = blockStyle;
                const btnClearRow = document.createElement('button');
                btnClearRow.textContent = '🗑️';
                btnClearRow.style.background = 'transparent';
                btnClearRow.style.border = 'none';
                btnClearRow.style.cursor = 'pointer';
                btnClearRow.onclick = () => {
                    delete state.manuales[keyBase + '_lugar'];
                    Object.keys(state.manuales).forEach(k => {
                        if (k.startsWith(`${keyBase}_p`)) {
                            delete state.manuales[k];
                        }
                    });
                    saveToStorage();
                    renderTabla();
                };
                divAcc.appendChild(btnClearRow);
                tdAcc.appendChild(divAcc);
            });

            tr.appendChild(tdHora);
            tr.appendChild(tdLugar);
            tr.appendChild(tdPart);
            tr.appendChild(tdAcc);

            els.tablaBody.appendChild(tr);
        });
    }

    // --- IMPORTAR DESDE ARCHIVOS TXT ---
    function configurarImportacion(inputId, listName) {
        const fileInput = document.getElementById(inputId);
        if (!fileInput) return;

        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                const lines = event.target.result.split('\n').map(l => l.trim()).filter(l => l);
                let agregados = 0;

                lines.forEach(line => {
                    if (listName === 'participantes') {
                        if (!state.participantes.some(p => p.name === line)) {
                            state.participantes.push({ name: line, disponibilidad: createDefaultDisp(), cartas: false });
                            agregados++;
                        }
                    } else {
                        if (!state[listName].includes(line)) {
                            state[listName].push(line);
                            agregados++;
                        }
                    }
                });

                saveToStorage();
                renderListas();
                fileInput.value = '';
                alert(`Importación completada: Se añadieron ${agregados} elementos.`);
            };
            reader.readAsText(file);
        });
    }

    // --- ASIGNACIÓN INTELIGENTE ---
    function autoAsignarParticipantes() {
        if (!els.fInicio) return;
        let start = parseFecha(els.fInicio.value);
        if (!start) { alert('Selecciona una fecha de inicio primero.'); return; }

        let totalDias = 30;
        if (els.cantidadFechas && els.cantidadFechas.value !== 'custom') {
            totalDias = parseInt(els.cantidadFechas.value) || 30;
        } else if (els.fFinal && els.fFinal.value) {
            let end = parseFecha(els.fFinal.value);
            if (end) {
                let diffTime = Math.abs(end - start);
                totalDias = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
            }
        }

        let conteoAsignaciones = {};
        state.participantes.forEach(p => { if (p && p.name) conteoAsignaciones[p.name] = 0; });

        Object.keys(state.manuales).forEach(k => {
            if (k.includes('_p1') || k.includes('_p2')) {
                const name = state.manuales[k];
                if (name && conteoAsignaciones[name] !== undefined) {
                    conteoAsignaciones[name]++;
                }
            }
        });

        for (let i = 0; i < totalDias; i++) {
            let date = new Date(start);
            date.setDate(start.getDate() + i);
            const dayOfWeek = date.getDay();
            const horasConfiguradas = (state.configDias && state.configDias[dayOfWeek]) ? state.configDias[dayOfWeek] : [];

            horasConfiguradas.forEach((hora, idx) => {
                const keyBase = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}_${hora}_${idx}`;
                const turno = getTurnoPorHora(hora);

                for (let slot = 1; slot <= 2; slot++) {
                    const keyPart = `${keyBase}_p${slot}`;
                    if (state.manuales[keyPart]) continue;

                    let candidatos = state.participantes.filter(p => {
                        if (!p) return false;
                        if (p.cartas) return true;
                        const dConfig = p.disponibilidad ? p.disponibilidad[dayOfWeek] : null;
                        if (!dConfig) return false;
                        return (turno === 'm' ? dConfig.m : dConfig.t);
                    });

                    if (candidatos.length === 0) continue;

                    let conPrioridad = candidatos.filter(p => {
                        if (p.cartas) return true;
                        const dConfig = p.disponibilidad[dayOfWeek];
                        return (turno === 'm' ? dConfig.pM : dConfig.pT);
                    });

                    let pool = conPrioridad.length > 0 ? conPrioridad : candidatos;

                    if (slot === 2) {
                        const yaAsignadoP1 = state.manuales[`${keyBase}_p1`];
                        pool = pool.filter(p => p.name !== yaAsignadoP1);
                    }

                    pool.sort((a, b) => (conteoAsignaciones[a.name] || 0) - (conteoAsignaciones[b.name] || 0));

                    if (pool.length > 0) {
                        const elegido = pool[0];
                        state.manuales[keyPart] = elegido.name;
                        conteoAsignaciones[elegido.name] = (conteoAsignaciones[elegido.name] || 0) + 1;
                    }
                }
            });
        }

        saveToStorage();
        renderTabla();
        alert('Asignación automatizada completada con éxito.');
    }

    // --- CONFIGURACIÓN INICIAL ---
    function init() {
        loadFromStorage();

        const savedInicio = localStorage.getItem(KEYS.FECHA_INICIO);
        const savedCantidad = localStorage.getItem(KEYS.CANTIDAD_FECHAS);
        const savedFinal = localStorage.getItem(KEYS.FECHA_FINAL);

        if (savedInicio && els.fInicio) els.fInicio.value = savedInicio;
        if (savedCantidad && els.cantidadFechas) els.cantidadFechas.value = savedCantidad;
        if (savedFinal && els.fFinal) els.fFinal.value = savedFinal;

        if (els.fInicio && !els.fInicio.value) {
            let hoy = new Date();
            els.fInicio.value = hoy.toISOString().split('T')[0];
        }

        if (els.fInicio && els.cantidadFechas && els.fFinal) {
            const updateDates = () => {
                if (els.cantidadFechas.value !== 'custom') {
                    let start = parseFecha(els.fInicio.value);
                    if (start) {
                        let end = new Date(start);
                        end.setDate(start.getDate() + parseInt(els.cantidadFechas.value) - 1);
                        els.fFinal.value = end.toISOString().split('T')[0];
                    }
                }

                localStorage.setItem(KEYS.FECHA_INICIO, els.fInicio.value);
                localStorage.setItem(KEYS.CANTIDAD_FECHAS, els.cantidadFechas.value);
                localStorage.setItem(KEYS.FECHA_FINAL, els.fFinal.value);

                renderTabla();
            };

            els.fInicio.onchange = updateDates;
            els.cantidadFechas.onchange = updateDates;
            els.fFinal.onchange = () => {
                els.cantidadFechas.value = 'custom';
                localStorage.setItem(KEYS.FECHA_INICIO, els.fInicio.value);
                localStorage.setItem(KEYS.CANTIDAD_FECHAS, els.cantidadFechas.value);
                localStorage.setItem(KEYS.FECHA_FINAL, els.fFinal.value);
                renderTabla();
            };

            updateDates();
        }

        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
                btn.classList.add('active');
                document.getElementById(btn.dataset.tab + 'Pane').classList.add('active');
            });
        });

        if (els.btnAgregarParticipante) {
            els.btnAgregarParticipante.onclick = () => {
                if (!els.nuevoParticipante) return;
                const n = els.nuevoParticipante.value.trim();
                if (n && !state.participantes.some(p => p.name === n)) {
                    state.participantes.push({ name: n, disponibilidad: createDefaultDisp(), cartas: false });
                    els.nuevoParticipante.value = '';
                    saveToStorage();
                    renderListas();
                }
            };
        }

        if (els.btnAgregarLugar) {
            els.btnAgregarLugar.onclick = () => {
                if (!els.nuevoLugarNombre) return;
                const l = els.nuevoLugarNombre.value.trim();
                if (l && !state.lugares.includes(l)) {
                    state.lugares.push(l);
                    els.nuevoLugarNombre.value = '';
                    saveToStorage();
                    renderListas();
                }
            };
        }

        if (els.btnAgregarGrupo) {
            els.btnAgregarGrupo.onclick = () => {
                if (!els.nuevoGrupoNombre) return;
                const g = els.nuevoGrupoNombre.value.trim();
                if (g && !state.grupos.includes(g)) {
                    state.grupos.push(g);
                    els.nuevoGrupoNombre.value = '';
                    saveToStorage();
                    renderListas();
                }
            };
        }

        if (els.btnLimpiarGrupos) {
            els.btnLimpiarGrupos.onclick = () => {
                if (confirm('¿Borrar todos los grupos almacenados?')) {
                    state.grupos = [];
                    saveToStorage();
                    renderListas();
                }
            };
        }

        configurarImportacion('fileParticipantes', 'participantes');
        configurarImportacion('fileLugares', 'lugares');
        configurarImportacion('fileGrupos', 'grupos');

        if (els.btnToggleTheme) {
            els.btnToggleTheme.onclick = () => {
                const isDark = document.body.dataset.theme === 'dark';
                if (isDark) {
                    document.body.removeAttribute('data-theme');
                    localStorage.setItem(KEYS.THEME, 'light');
                } else {
                    document.body.dataset.theme = 'dark';
                    localStorage.setItem(KEYS.THEME, 'dark');
                }
            };
        }

        if (els.btnBloquearTodo) {
            els.btnBloquearTodo.onclick = () => { alert('Cronograma asegurado correctamente.'); };
        }

        if (els.btnAsignarParticipantes) {
            els.btnAsignarParticipantes.onclick = autoAsignarParticipantes;
        }

        if (els.btnLimpiarAsignaciones) {
            els.btnLimpiarAsignaciones.onclick = () => {
                if (confirm('¿Deseas vaciar todas las celdas del cronograma actual?')) {
                    state.manuales = {};
                    saveToStorage();
                    renderTabla();
                }
            };
        }

        if (els.toggleSidebar && els.layout) {
            els.toggleSidebar.onclick = () => {
                els.layout.classList.toggle('sidebar-hidden');
            };
        }

        // --- EXPORTACIÓN DE PDF OPTIMIZADA CON ROWSPAN POR DÍA ---
        document.querySelectorAll('#btnExportPDF, .btn-export').forEach(btn => {
            btn.addEventListener('click', () => {
                if (!window.jspdf) {
                    alert("La librería jsPDF no está cargada. Verifica tus etiquetas <script>.");
                    return;
                }

                try {
                    const { jsPDF } = window.jspdf;
                    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });

                    // Título centrado y en mayúsculas
                    doc.setFont("helvetica", "bold");
                    doc.setFontSize(14);
                    doc.setTextColor(44, 62, 80);
                    const titleText = "PROGRAMA DE PREDICACIÓN PÚBLICA";
                    const pageWidth = doc.internal.pageSize.getWidth();
                    doc.text(titleText, pageWidth / 2, 12, { align: 'center' });

                    const bodyData = [];
                    const filas = document.querySelectorAll('#cuerpoTabla tr');

                    filas.forEach(tr => {
                        const tds = tr.querySelectorAll('td');
                        if (tds.length < 4) return;

                        const dia = tds[0].textContent.trim();
                        const divHoras = tds[1].querySelectorAll(':scope > div');
                        const divLugares = tds[2].querySelectorAll(':scope > div');
                        const divParts = tds[3].querySelectorAll(':scope > div');

                        const totalTurnos = divHoras.length;
                        if (totalTurnos === 0) return;

                        // Recorremos los turnos de este día e insertamos filas separadas
                        for (let i = 0; i < totalTurnos; i++) {
                            const hora = divHoras[i].textContent.trim() || '---';

                            const selLugar = divLugares[i] ? divLugares[i].querySelector('select') : null;
                            const lugar = (selLugar && selLugar.value) ? selLugar.value : '---';

                            const selectsPart = divParts[i] ? divParts[i].querySelectorAll('select') : [];
                            const seleccionados = Array.from(selectsPart)
                                .map(s => s.value)
                                .filter(v => v !== "");

                            // Separador con guion
                            const participantes = seleccionados.length > 0 ? seleccionados.join(' - ') : '---';

                            if (i === 0) {
                                // La primera fila del día incluye la celda con rowSpan para agrupar visualmente el día
                                bodyData.push([
                                    { content: dia, rowSpan: totalTurnos, styles: { valign: 'middle', halign: 'center' } },
                                    hora,
                                    lugar,
                                    participantes
                                ]);
                            } else {
                                // Las siguientes filas del mismo día omiten la columna 'Día' para que se expanda el rowSpan
                                bodyData.push([
                                    hora,
                                    lugar,
                                    participantes
                                ]);
                            }
                        }
                    });

                    doc.autoTable({
                        head: [['Día', 'Hora', 'Lugar', 'Participantes']],
                        body: bodyData,
                        startY: 18,
                        margin: { top: 15, bottom: 10, left: 12, right: 12 },
                        theme: 'grid',
                        styles: {
                            valign: 'middle',
                            halign: 'center',
                            fontSize: 8.5,
                            cellPadding: 1.5, // Tamaño compacto
                            font: 'helvetica',
                            fontStyle: 'bold', // Todo el texto interno en Negrita
                            lineColor: [220, 224, 230],
                            lineWidth: 0.1
                        },
                        headStyles: {
                            fillColor: [52, 73, 94],
                            textColor: [255, 255, 255],
                            fontSize: 9,
                            fontStyle: 'bold',
                            halign: 'center'
                        },
                        alternateRowStyles: { fillColor: [248, 249, 250] },
                        columnStyles: {
                            0: { fontStyle: 'bold', cellWidth: 32 },
                            1: { cellWidth: 25 },
                            2: { cellWidth: 45 },
                            3: { halign: 'center' }
                        }
                    });

                    const nombreArchivo = els.fInicio && els.fInicio.value ? els.fInicio.value : 'Publica';
                    doc.save(`Programa_${nombreArchivo}.pdf`);

                } catch (error) {
                    console.error("Error detallado al generar el PDF:", error);
                    alert("Ocurrió un error al generar el PDF. Revisa la consola para más detalles.");
                }
            });
        });

        renderListas();
        renderDiasSelector();
    }

    init();
})();