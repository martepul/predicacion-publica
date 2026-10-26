(function () {
    // --- CLAVES DE LOCALSTORAGE ---
    const KEYS = {
        PARTICIPANTES: 'participantes_v1',
        LUGARES: 'lugares_v1',
        GRUPOS: 'grupos_v1',
        MANUALES: 'manuales_v9',
        CONFIG_DIAS: 'config_dias_v3',
        LIMITE_HORARIOS_DIA: 'limite_horarios_dia_v1',
        CONFIG_FECHAS: 'config_fechas_v1',
        DISPONIBILIDAD_LUGARES: 'disponibilidad_lugares_v1',
        PARTICIPANTES_POR_LUGAR: 'participantes_por_lugar_v1',
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
        limiteHorariosDia: 2,
        configFechas: {},
        disponibilidadLugares: {},
        participantesPorLugar: {},
        detailSelectedParticipant: '',
        detailSelectedLugar: '',
        detailActiveSection: 'participants',
        uiState: {}
    };

    // --- REFERENCIAS EXACTAS AL index.html ---
    const els = {
        fInicio: document.getElementById('fechaInicio'),
        fFinal: document.getElementById('fechaFinal'),
        cantidadFechas: document.getElementById('cantidadFechas'),
        tablaBody: document.getElementById('cuerpoTabla'),
        btnExportPDF: document.getElementById('btnExportPDF'),
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
        btnExportSave: document.getElementById('btnExportSave'),
        btnImportSave: document.getElementById('btnImportSave'),
        fileSave: document.getElementById('fileSave'),
        btnGenerateProgram: document.getElementById('btnGenerateProgram'),
        btnBloquearTodo: document.getElementById('btnBloquearTodo'),
        btnAsignarParticipantes: document.getElementById('btnAsignarParticipantes'),
        btnLimpiarAsignaciones: document.getElementById('btnLimpiarAsignaciones'),
        toggleSidebar: document.getElementById('toggleSidebar'),
        layout: document.querySelector('.main-layout'),
        detailsSidebar: document.getElementById('detailsSidebar'),
        detailsParticipantsTab: document.getElementById('detailsParticipantsTab'),
        detailsPlacesTab: document.getElementById('detailsPlacesTab'),
        detailsParticipantsPane: document.getElementById('detailsParticipantsPane'),
        detailsPlacesPane: document.getElementById('detailsPlacesPane'),
        detailsParticipants: document.getElementById('detailsParticipants'),
        detailsParticipantInfo: document.getElementById('detailsParticipantInfo'),
        detailsPlaces: document.getElementById('detailsPlaces'),
        detailsPlaceInfo: document.getElementById('detailsPlaceInfo'),
        horariosGlobalesContainer: document.getElementById('horariosGlobalesContainer')
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
        localStorage.setItem(KEYS.LIMITE_HORARIOS_DIA, String(state.limiteHorariosDia));
        localStorage.setItem(KEYS.CONFIG_FECHAS, JSON.stringify(state.configFechas));
        localStorage.setItem(KEYS.DISPONIBILIDAD_LUGARES, JSON.stringify(state.disponibilidadLugares));
        localStorage.setItem(KEYS.PARTICIPANTES_POR_LUGAR, JSON.stringify(state.participantesPorLugar));
    }

    // --- CARGAR DE STORAGE ---
    function loadFromStorage() {
        try {
            const rawPart = JSON.parse(localStorage.getItem(KEYS.PARTICIPANTES)) || [];
            state.participantes = rawPart.map(p => {
                if (!p) return null;
                if (typeof p === 'string') {
                    return {
                        name: p,
                        disponibilidad: createDefaultDisp(),
                        cartas: false,
                        horariosDisponibles: null,
                        preferenciasLugares: [],
                        preferenciasCompaneros: [],
                        conyuge: '',
                        maxSalidasMes: null
                    };
                }
                return {
                    name: p.name || '',
                    disponibilidad: sanitizeDisponibilidad(p.disponibilidad),
                    cartas: !!p.cartas,
                    horariosDisponibles: p.horariosDisponibles && typeof p.horariosDisponibles === 'object'
                        ? Object.fromEntries(Object.entries(p.horariosDisponibles).map(([day, hours]) => [
                            day,
                            Array.isArray(hours) ? hours.filter(hour => typeof hour === 'string') : []
                        ]))
                        : null,
                    preferenciasLugares: Array.isArray(p.preferenciasLugares) ? p.preferenciasLugares : [],
                    preferenciasCompaneros: Array.isArray(p.preferenciasCompaneros) ? p.preferenciasCompaneros : [],
                    conyuge: typeof p.conyuge === 'string' ? p.conyuge : '',
                    maxSalidasMes: Number.isSafeInteger(p.maxSalidasMes) && p.maxSalidasMes > 0
                        ? p.maxSalidasMes
                        : null
                };
            }).filter(p => p && p.name);

            state.lugares = JSON.parse(localStorage.getItem(KEYS.LUGARES)) || [];
            state.grupos = JSON.parse(localStorage.getItem(KEYS.GRUPOS)) || [];
            state.manuales = JSON.parse(localStorage.getItem(KEYS.MANUALES)) || {};

            const savedDias = JSON.parse(localStorage.getItem(KEYS.CONFIG_DIAS));
            if (savedDias) state.configDias = savedDias;

            const savedLimit = parseInt(localStorage.getItem(KEYS.LIMITE_HORARIOS_DIA), 10);
            state.limiteHorariosDia = Number.isInteger(savedLimit) && savedLimit > 0 ? savedLimit : 2;

            const savedFechas = JSON.parse(localStorage.getItem(KEYS.CONFIG_FECHAS));
            if (savedFechas && typeof savedFechas === 'object') state.configFechas = savedFechas;

            const savedDisponibilidadLugares = JSON.parse(localStorage.getItem(KEYS.DISPONIBILIDAD_LUGARES));
            if (savedDisponibilidadLugares && typeof savedDisponibilidadLugares === 'object') {
                state.disponibilidadLugares = Object.fromEntries(
                    Object.entries(savedDisponibilidadLugares).map(([place, availability]) => [
                        place,
                        availability && typeof availability === 'object'
                            ? Object.fromEntries(Object.entries(availability).map(([day, hours]) => [
                                day,
                                Array.isArray(hours) ? hours.filter(hour => typeof hour === 'string') : []
                            ]))
                            : {}
                    ])
                );
            }

            const savedParticipantesPorLugar = JSON.parse(localStorage.getItem(KEYS.PARTICIPANTES_POR_LUGAR));
            if (savedParticipantesPorLugar && typeof savedParticipantesPorLugar === 'object') {
                state.participantesPorLugar = Object.fromEntries(
                    Object.entries(savedParticipantesPorLugar).map(([place, participants]) => [
                        place,
                        Array.isArray(participants) ? participants.filter(name => typeof name === 'string') : []
                    ])
                );
            }

        } catch (e) {
            console.error("Error al cargar localStorage:", e);
        }
    }

    function createSaveFile() {
        saveToStorage();
        const save = {
            app: 'predicacion-publica',
            version: 1,
            exportedAt: new Date().toISOString(),
            data: {
                participantes: state.participantes,
                lugares: state.lugares,
                grupos: state.grupos,
                manuales: state.manuales,
                configDias: state.configDias,
                limiteHorariosDia: state.limiteHorariosDia,
                configFechas: state.configFechas,
                disponibilidadLugares: state.disponibilidadLugares,
                participantesPorLugar: state.participantesPorLugar,
                fechaInicio: els.fInicio.value,
                cantidadFechas: els.cantidadFechas.value,
                fechaFinal: els.fFinal.value
            }
        };
        const blob = new Blob([JSON.stringify(save, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `predicacion-publica-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    }

    function isObject(value) {
        return value !== null && typeof value === 'object' && !Array.isArray(value);
    }

    function isStringArray(value) {
        return Array.isArray(value) && value.every(item => typeof item === 'string');
    }

    function isStringArrayMap(value) {
        return isObject(value) && Object.values(value).every(isStringArray);
    }

    function isNestedStringArrayMap(value) {
        return isObject(value) && Object.values(value).every(isStringArrayMap);
    }

    function validateSaveFile(save) {
        if (!isObject(save) || save.app !== 'predicacion-publica' || save.version !== 1 || !isObject(save.data)) {
            return false;
        }

        const data = save.data;
        const participantsAreValid = Array.isArray(data.participantes) && data.participantes.every(participant =>
            typeof participant === 'string' || (isObject(participant) && typeof participant.name === 'string')
        );
        const manualAssignmentsAreValid = isObject(data.manuales) &&
            Object.values(data.manuales).every(value => typeof value === 'string');

        return participantsAreValid &&
            isStringArray(data.lugares) &&
            isStringArray(data.grupos) &&
            manualAssignmentsAreValid &&
            isStringArrayMap(data.configDias) &&
            Number.isSafeInteger(data.limiteHorariosDia) && data.limiteHorariosDia > 0 &&
            isStringArrayMap(data.configFechas) &&
            isNestedStringArrayMap(data.disponibilidadLugares) &&
            isObject(data.participantesPorLugar) &&
            Object.values(data.participantesPorLugar).every(isStringArray) &&
            typeof data.fechaInicio === 'string' &&
            ['custom', '7', '15', '30'].includes(data.cantidadFechas) &&
            typeof data.fechaFinal === 'string';
    }

    async function loadSaveFile(file) {
        let save;
        try {
            save = JSON.parse(await file.text());
        } catch (error) {
            console.error('No se pudo leer el archivo de guardado:', error);
            alert('No se pudo leer el archivo. Comprueba que sea un archivo JSON válido.');
            return;
        }

        if (!validateSaveFile(save)) {
            alert('El archivo no es un guardado válido de Predicación Pública o no es compatible.');
            return;
        }

        if (!confirm('Cargar este guardado reemplazará los datos de esta computadora. ¿Deseas continuar?')) {
            return;
        }

        const data = save.data;
        const storageValues = {
            [KEYS.PARTICIPANTES]: JSON.stringify(data.participantes),
            [KEYS.LUGARES]: JSON.stringify(data.lugares),
            [KEYS.GRUPOS]: JSON.stringify(data.grupos),
            [KEYS.MANUALES]: JSON.stringify(data.manuales),
            [KEYS.CONFIG_DIAS]: JSON.stringify(data.configDias),
            [KEYS.LIMITE_HORARIOS_DIA]: String(data.limiteHorariosDia),
            [KEYS.CONFIG_FECHAS]: JSON.stringify(data.configFechas),
            [KEYS.DISPONIBILIDAD_LUGARES]: JSON.stringify(data.disponibilidadLugares),
            [KEYS.PARTICIPANTES_POR_LUGAR]: JSON.stringify(data.participantesPorLugar),
            [KEYS.FECHA_INICIO]: data.fechaInicio,
            [KEYS.CANTIDAD_FECHAS]: data.cantidadFechas,
            [KEYS.FECHA_FINAL]: data.fechaFinal
        };
        const previousValues = Object.keys(storageValues).map(key => [key, localStorage.getItem(key)]);

        try {
            Object.entries(storageValues).forEach(([key, value]) => localStorage.setItem(key, value));
        } catch (error) {
            console.error('No se pudo guardar la sesión importada:', error);
            try {
                previousValues.forEach(([key, value]) => {
                    if (value === null) localStorage.removeItem(key);
                    else localStorage.setItem(key, value);
                });
                alert('No se pudo cargar el guardado. Comprueba el espacio disponible en el navegador e inténtalo de nuevo.');
            } catch (rollbackError) {
                console.error('No se pudo restaurar el estado anterior:', rollbackError);
                alert('Ocurrió un error al cargar el guardado y el estado anterior no pudo restaurarse completamente.');
            }
            return;
        }

        window.location.reload();
    }

    // --- QUITAR ELEMENTOS DE LISTA ---
    function removeListItem(type, index) {
        if (type === 'lugares' && state.lugares[index] !== undefined) {
            const removedPlace = state.lugares[index];
            delete state.disponibilidadLugares[removedPlace];
            delete state.participantesPorLugar[removedPlace];
            state.lugares.splice(index, 1);
            state.participantes.forEach(participant => {
                participant.preferenciasLugares = participant.preferenciasLugares.filter(place => place !== removedPlace);
            });
        }
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
            nameSpan.textContent = item.conyuge ? `💍 ${item.name}` : item.name;
            nameSpan.title = item.conyuge ? `Matrimonio con ${item.conyuge}` : '';
            nameSpan.style.flex = '1';
            nameSpan.style.fontWeight = '500';

            const configBtn = document.createElement('button');
            configBtn.textContent = '⚙️';
            configBtn.title = 'Editar disponibilidad y preferencias en la barra lateral';
            configBtn.setAttribute('aria-label', configBtn.title);
            configBtn.onclick = () => {
                state.detailSelectedParticipant = item.name;
                setDetailsSection('participants');
                renderDetailsSidebar();
                els.detailsSidebar.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
                    state.participantes.forEach(participant => {
                        participant.preferenciasCompaneros = participant.preferenciasCompaneros.filter(name => name !== item.name);
                        if (participant.conyuge === item.name) participant.conyuge = '';
                    });
                    Object.keys(state.participantesPorLugar).forEach(place => {
                        state.participantesPorLugar[place] = state.participantesPorLugar[place]
                            .filter(name => name !== item.name);
                    });
                    saveToStorage();
                    renderListas();
                };
            };

            const rightGroup = document.createElement('div');
            rightGroup.style.display = 'flex';
            rightGroup.style.alignItems = 'center';
            rightGroup.append(configBtn, delBtn);
            topRow.append(nameSpan, rightGroup);
            li.appendChild(topRow);
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
        renderDetailsSidebar();
    }

    function renderDetailsSelect(select, items, selectedValue, onChange, placeholder) {
        select.replaceChildren();
        const placeholderOption = document.createElement('option');
        placeholderOption.value = '';
        placeholderOption.textContent = placeholder;
        select.appendChild(placeholderOption);

        items.forEach(item => {
            const option = document.createElement('option');
            option.value = item;
            option.textContent = item;
            select.appendChild(option);
        });
        select.value = selectedValue;
        select.onchange = onChange;
        select.onchange = onChange;
    }

    function createDetailsSection(title) {
        const section = document.createElement('section');
        section.className = 'details-section';
        const heading = document.createElement('h4');
        heading.textContent = title;
        section.appendChild(heading);
        return section;
    }

    function setDetailsSection(section) {
        state.detailActiveSection = section === 'places' ? 'places' : 'participants';
        const showParticipants = state.detailActiveSection === 'participants';
        els.detailsParticipantsPane.hidden = !showParticipants;
        els.detailsPlacesPane.hidden = showParticipants;
        els.detailsParticipantsTab.classList.toggle('active', showParticipants);
        els.detailsPlacesTab.classList.toggle('active', !showParticipants);
        els.detailsParticipantsTab.setAttribute('aria-selected', String(showParticipants));
        els.detailsPlacesTab.setAttribute('aria-selected', String(!showParticipants));
    }

    function createDetailsCheckbox(labelText, checked, onChange) {
        const label = document.createElement('label');
        label.className = 'details-checkbox';
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = checked;
        checkbox.onchange = onChange;
        const text = document.createElement('span');
        text.textContent = labelText;
        label.append(checkbox, text);
        return label;
    }

    function getParticipantAvailableForHour(participant, day, hour) {
        if (participant.horariosDisponibles && Object.prototype.hasOwnProperty.call(participant.horariosDisponibles, day)) {
            return participant.horariosDisponibles[day].includes(hour);
        }
        const availability = participant.disponibilidad && participant.disponibilidad[day];
        if (!availability) return false;
        return getTurnoPorHora(hour) === 'm' ? availability.m : availability.t;
    }

    function isLugarAvailable(lugar, day, hour) {
        const availability = state.disponibilidadLugares[lugar];
        return !!availability &&
            Object.prototype.hasOwnProperty.call(availability, day) &&
            availability[day].includes(hour);
    }

    function isParticipantAllowedAtLocation(participantName, location) {
        const authorizedParticipants = state.participantesPorLugar[location];
        return !location ||
            !Array.isArray(authorizedParticipants) ||
            authorizedParticipants.length === 0 ||
            authorizedParticipants.includes(participantName);
    }

    function arePreferredCompanions(firstName, secondName) {
        const first = state.participantes.find(participant => participant.name === firstName);
        const second = state.participantes.find(participant => participant.name === secondName);
        return !!first && !!second && (
            first.preferenciasCompaneros.includes(secondName) ||
            second.preferenciasCompaneros.includes(firstName)
        );
    }

    function areMarried(firstName, secondName) {
        const first = state.participantes.find(participant => participant.name === firstName);
        return !!first && first.conyuge === secondName;
    }

    function setSpouse(participant, spouseName) {
        if (participant.conyuge) {
            const formerSpouse = state.participantes.find(item => item.name === participant.conyuge);
            if (formerSpouse?.conyuge === participant.name) formerSpouse.conyuge = '';
        }

        participant.conyuge = '';
        if (spouseName) {
            const spouse = state.participantes.find(item => item.name === spouseName);
            if (!spouse || spouse === participant) return;
            if (spouse.conyuge) {
                const formerSpouse = state.participantes.find(item => item.name === spouse.conyuge);
                if (formerSpouse?.conyuge === spouse.name) formerSpouse.conyuge = '';
            }
            participant.conyuge = spouse.name;
            spouse.conyuge = participant.name;
        }
    }

    function isParticipantAllowedWithCompanions(participantName, location, assignedNames) {
        return isParticipantAllowedAtLocation(participantName, location) ||
            assignedNames.some(name => name !== participantName && (
                arePreferredCompanions(participantName, name) || areMarried(participantName, name)
            ));
    }

    function renderDetailsSidebar() {
        if (!els.detailsSidebar) return;

        const participants = state.participantes.filter(participant => participant && participant.name)
            .sort((a, b) => a.name.localeCompare(b.name));
        const places = (state.lugares || []).filter(Boolean).slice().sort((a, b) => a.localeCompare(b));

        if (!participants.some(participant => participant.name === state.detailSelectedParticipant)) {
            state.detailSelectedParticipant = participants[0]?.name || '';
        }
        if (!places.includes(state.detailSelectedLugar)) {
            state.detailSelectedLugar = places[0] || '';
        }
        renderDetailsSelect(
            els.detailsParticipants,
            participants.map(participant => participant.name),
            state.detailSelectedParticipant,
            event => {
                state.detailSelectedParticipant = event.target.value;
                renderDetailsSidebar();
            },
            'Seleccionar participante'
        );

        els.detailsParticipantInfo.replaceChildren();
        const participant = participants.find(item => item.name === state.detailSelectedParticipant);
        if (participant) {
            const marriageSection = createDetailsSection('Matrimonio');
            const spouseSelect = document.createElement('select');
            spouseSelect.setAttribute('aria-label', 'Cónyuge');
            const noSpouseOption = document.createElement('option');
            noSpouseOption.value = '';
            noSpouseOption.textContent = 'Sin cónyuge';
            spouseSelect.appendChild(noSpouseOption);
            participants.filter(item => item.name !== participant.name).forEach(item => {
                const option = document.createElement('option');
                option.value = item.name;
                option.textContent = item.name;
                spouseSelect.appendChild(option);
            });
            spouseSelect.value = participant.conyuge;
            spouseSelect.onchange = event => {
                setSpouse(participant, event.target.value);
                saveToStorage();
                renderListas();
            };
            marriageSection.appendChild(spouseSelect);
            if (participant.conyuge) {
                const marriageLabel = document.createElement('small');
                marriageLabel.textContent = `💍 Matrimonio con ${participant.conyuge}`;
                marriageSection.appendChild(marriageLabel);
            }
            els.detailsParticipantInfo.appendChild(marriageSection);

            const monthlyLimitSection = createDetailsSection('Frecuencia mensual');
            const monthlyLimitLabel = document.createElement('label');
            monthlyLimitLabel.textContent = 'Máximo de salidas al mes';
            monthlyLimitLabel.htmlFor = 'participantMonthlyLimit';
            const monthlyLimitInput = document.createElement('input');
            monthlyLimitInput.id = 'participantMonthlyLimit';
            monthlyLimitInput.type = 'number';
            monthlyLimitInput.min = '1';
            monthlyLimitInput.step = '1';
            monthlyLimitInput.placeholder = 'Sin límite';
            monthlyLimitInput.value = participant.maxSalidasMes ?? '';
            monthlyLimitInput.setAttribute('aria-label', 'Máximo de salidas al mes');
            monthlyLimitInput.onchange = () => {
                const value = monthlyLimitInput.value.trim();
                const limit = value === '' ? null : Number(value);
                if (limit !== null && (!Number.isSafeInteger(limit) || limit < 1)) {
                    monthlyLimitInput.setCustomValidity('Indica un número entero mayor que cero.');
                    monthlyLimitInput.reportValidity();
                    monthlyLimitInput.setCustomValidity('');
                    monthlyLimitInput.value = participant.maxSalidasMes ?? '';
                    return;
                }
                participant.maxSalidasMes = limit;
                saveToStorage();
                renderTabla();
            };
            const monthlyLimitHint = document.createElement('small');
            monthlyLimitHint.textContent = 'Déjalo vacío si no tiene límite.';
            monthlyLimitSection.append(monthlyLimitLabel, monthlyLimitInput, monthlyLimitHint);
            els.detailsParticipantInfo.appendChild(monthlyLimitSection);

            const scheduleSection = createDetailsSection('Horarios disponibles');
            DIAS_SEMANA.forEach((dayName, day) => {
                const daySection = document.createElement('div');
                daySection.className = 'details-day';
                const dayHeading = document.createElement('strong');
                dayHeading.textContent = dayName;
                daySection.appendChild(dayHeading);

                const hours = state.configDias[day] || [];
                if (!hours.length) {
                    const empty = document.createElement('small');
                    empty.textContent = 'Sin horarios configurados';
                    daySection.appendChild(empty);
                }

                hours.forEach(hour => {
                    daySection.appendChild(createDetailsCheckbox(hour, getParticipantAvailableForHour(participant, day, hour), event => {
                        if (!participant.horariosDisponibles) {
                            participant.horariosDisponibles = {};
                            for (let idx = 0; idx < 7; idx++) {
                                participant.horariosDisponibles[idx] = (state.configDias[idx] || []).filter(configuredHour => {
                                    const availability = participant.disponibilidad[idx];
                                    if (!availability) return false;
                                    return getTurnoPorHora(configuredHour) === 'm' ? availability.m : availability.t;
                                });
                            }
                        }

                        const selectedHours = new Set(participant.horariosDisponibles[day] || []);
                        if (event.target.checked) selectedHours.add(hour);
                        else selectedHours.delete(hour);
                        participant.horariosDisponibles[day] = [...selectedHours];

                        const availability = participant.disponibilidad[day];
                        const morningHours = (state.configDias[day] || []).filter(configuredHour => getTurnoPorHora(configuredHour) === 'm');
                        const afternoonHours = (state.configDias[day] || []).filter(configuredHour => getTurnoPorHora(configuredHour) === 't');
                        availability.m = morningHours.some(configuredHour => selectedHours.has(configuredHour));
                        availability.t = afternoonHours.some(configuredHour => selectedHours.has(configuredHour));
                        if (!availability.m) availability.pM = false;
                        if (!availability.t) availability.pT = false;

                        saveToStorage();
                        renderTabla();
                    }));
                });
                scheduleSection.appendChild(daySection);
            });
            els.detailsParticipantInfo.appendChild(scheduleSection);

            const specialAvailabilitySection = createDetailsSection('Disponibilidad especial');
            specialAvailabilitySection.appendChild(createDetailsCheckbox(
                'Disponible siempre (Cartas / Especial)',
                participant.cartas,
                event => {
                    participant.cartas = event.target.checked;
                    saveToStorage();
                    renderTabla();
                }
            ));
            els.detailsParticipantInfo.appendChild(specialAvailabilitySection);

            const preferredPlacesSection = createDetailsSection('Lugares preferidos');
            if (places.length) {
                places.forEach(place => {
                    preferredPlacesSection.appendChild(createDetailsCheckbox(
                        place,
                        participant.preferenciasLugares.includes(place),
                        event => {
                            const preferences = new Set(participant.preferenciasLugares);
                            if (event.target.checked) preferences.add(place);
                            else preferences.delete(place);
                            participant.preferenciasLugares = [...preferences];
                            saveToStorage();
                        }
                    ));
                });
            } else {
                const empty = document.createElement('small');
                empty.textContent = 'Añade lugares para elegir preferencias.';
                preferredPlacesSection.appendChild(empty);
            }
            els.detailsParticipantInfo.appendChild(preferredPlacesSection);

            const preferredCompanionsSection = createDetailsSection('Compañeros preferidos');
            const companions = participants.filter(item => item.name !== participant.name);
            if (companions.length) {
                companions.forEach(companion => {
                    preferredCompanionsSection.appendChild(createDetailsCheckbox(
                        companion.name,
                        participant.preferenciasCompaneros.includes(companion.name),
                        event => {
                            const preferences = new Set(participant.preferenciasCompaneros);
                            if (event.target.checked) preferences.add(companion.name);
                            else preferences.delete(companion.name);
                            participant.preferenciasCompaneros = [...preferences];
                            saveToStorage();
                        }
                    ));
                });
            } else {
                const empty = document.createElement('small');
                empty.textContent = 'Añade más participantes para elegir compañeros.';
                preferredCompanionsSection.appendChild(empty);
            }
            els.detailsParticipantInfo.appendChild(preferredCompanionsSection);
        } else {
            const empty = document.createElement('small');
            empty.textContent = 'Añade participantes para editar sus preferencias.';
            els.detailsParticipantInfo.appendChild(empty);
        }

        renderDetailsSelect(
            els.detailsPlaces,
            places,
            state.detailSelectedLugar,
            event => {
                state.detailSelectedLugar = event.target.value;
                renderDetailsSidebar();
            },
            'Seleccionar lugar'
        );

        els.detailsPlaceInfo.replaceChildren();
        const selectedPlace = state.detailSelectedLugar;
        if (!selectedPlace) {
            const empty = document.createElement('small');
            empty.textContent = 'Añade lugares para configurar su disponibilidad.';
            els.detailsPlaceInfo.appendChild(empty);
            return;
        }

        const locationHoursSection = createDetailsSection('Días y horarios disponibles');
        DIAS_SEMANA.forEach((dayName, day) => {
            const daySection = document.createElement('div');
            daySection.className = 'details-day';
            const dayHeading = document.createElement('strong');
            dayHeading.textContent = dayName;
            daySection.appendChild(dayHeading);

            const hours = state.configDias[day] || [];
            if (!hours.length) {
                const empty = document.createElement('small');
                empty.textContent = 'Sin horarios configurados';
                daySection.appendChild(empty);
            }

            hours.forEach(hour => {
                daySection.appendChild(createDetailsCheckbox(
                    hour,
                    isLugarAvailable(selectedPlace, day, hour),
                    event => {
                        if (!state.disponibilidadLugares[selectedPlace]) {
                            state.disponibilidadLugares[selectedPlace] = {};
                        }

                        const selectedHours = new Set(state.disponibilidadLugares[selectedPlace][day] || []);
                        if (event.target.checked) selectedHours.add(hour);
                        else selectedHours.delete(hour);
                        state.disponibilidadLugares[selectedPlace][day] = [...selectedHours];
                        saveToStorage();
                        renderTabla();
                    }
                ));
            });
            locationHoursSection.appendChild(daySection);
        });
        els.detailsPlaceInfo.appendChild(locationHoursSection);

        const allowedParticipantsSection = createDetailsSection('Participantes autorizados');
        const authorizedNames = Array.isArray(state.participantesPorLugar[selectedPlace])
            ? state.participantesPorLugar[selectedPlace]
            : [];
        const hasParticipantRestriction = authorizedNames.length > 0;
        const restrictionHelp = document.createElement('small');
        restrictionHelp.textContent = hasParticipantRestriction
            ? 'Solo los participantes marcados podrán asignarse a este lugar.'
            : 'Si no marcas a nadie, el lugar queda disponible para todos los participantes.';
        allowedParticipantsSection.appendChild(restrictionHelp);

        if (participants.length) {
            participants.forEach(person => {
                allowedParticipantsSection.appendChild(createDetailsCheckbox(
                    person.name,
                    authorizedNames.includes(person.name),
                    event => {
                        const isAssignedToPlace = Object.entries(state.manuales).some(([key, name]) => {
                            const match = key.match(/^(.*)_p\d+$/);
                            return name === person.name &&
                                match &&
                                state.manuales[`${match[1]}_lugar`] === selectedPlace;
                        });
                        if (!event.target.checked && isAssignedToPlace) {
                            event.target.checked = true;
                            alert(`Primero quita a ${person.name} de las salidas asignadas a ${selectedPlace}.`);
                            return;
                        }

                        const allowedNames = new Set(
                            Array.isArray(state.participantesPorLugar[selectedPlace])
                                ? state.participantesPorLugar[selectedPlace]
                                : []
                        );
                        if (event.target.checked) allowedNames.add(person.name);
                        else allowedNames.delete(person.name);
                        state.participantesPorLugar[selectedPlace] = [...allowedNames];
                        saveToStorage();
                        renderTabla();
                        renderDetailsSidebar();
                    }
                ));
            });
        } else {
            const empty = document.createElement('small');
            empty.textContent = 'Añade participantes para configurar quiénes pueden salir a este lugar.';
            allowedParticipantsSection.appendChild(empty);
        }
        els.detailsPlaceInfo.appendChild(allowedParticipantsSection);
    }

    function renderHorariosGlobales() {
        const container = els.horariosGlobalesContainer;
        if (!container) return;
        container.innerHTML = '';

        const limitControl = document.createElement('div');
        limitControl.className = 'daily-hours-limit';
        const limitLabel = document.createElement('label');
        limitLabel.textContent = 'Máximo de horarios visibles por día:';
        limitLabel.htmlFor = 'maxHorariosDia';
        const limitInput = document.createElement('input');
        limitInput.id = 'maxHorariosDia';
        limitInput.type = 'number';
        limitInput.min = '1';
        limitInput.step = '1';
        limitInput.value = String(state.limiteHorariosDia);
        limitInput.onchange = () => {
            const limit = parseInt(limitInput.value, 10);
            if (!Number.isInteger(limit) || limit < 1) {
                limitInput.value = String(state.limiteHorariosDia);
                return;
            }
            state.limiteHorariosDia = limit;
            saveToStorage();
            renderTabla();
        };
        limitControl.append(limitLabel, limitInput);
        container.appendChild(limitControl);

        DIAS_SEMANA.forEach((day, dayIndex) => {
            const daySection = document.createElement('section');
            daySection.className = 'global-hours-day';

            const heading = document.createElement('h4');
            heading.textContent = day;
            daySection.appendChild(heading);

            (state.configDias[dayIndex] || []).forEach((hour, hourIndex) => {
                const row = document.createElement('div');
                row.className = 'global-hour-row';

                const input = document.createElement('input');
                input.type = 'text';
                input.value = hour;
                input.setAttribute('aria-label', `Horario ${hourIndex + 1} de ${day}`);
                input.placeholder = 'Ej: 7:00-9:00 am';
                input.onchange = () => {
                    const updatedHour = input.value.trim();
                    const hours = [...(state.configDias[dayIndex] || [])];
                    if (updatedHour) {
                        hours[hourIndex] = updatedHour;
                    } else {
                        hours.splice(hourIndex, 1);
                    }
                    state.configDias[dayIndex] = hours;
                    saveToStorage();
                    renderHorariosGlobales();
                    renderTabla();
                    renderDetailsSidebar();
                };

                const removeButton = document.createElement('button');
                removeButton.type = 'button';
                removeButton.textContent = '×';
                removeButton.title = `Eliminar horario de ${day}`;
                removeButton.setAttribute('aria-label', `Eliminar horario de ${day}`);
                removeButton.onclick = () => {
                    state.configDias[dayIndex].splice(hourIndex, 1);
                    saveToStorage();
                    renderHorariosGlobales();
                    renderTabla();
                    renderDetailsSidebar();
                };

                row.append(input, removeButton);
                daySection.appendChild(row);
            });

            const addRow = document.createElement('div');
            addRow.className = 'global-hour-row global-hour-add';
            const newHourInput = document.createElement('input');
            newHourInput.type = 'text';
            newHourInput.placeholder = 'Nuevo horario (ej: 4:00-6:00 pm)';
            newHourInput.setAttribute('aria-label', `Nuevo horario para ${day}`);

            const addButton = document.createElement('button');
            addButton.type = 'button';
            addButton.textContent = '+';
            addButton.title = `Añadir horario a ${day}`;
            addButton.setAttribute('aria-label', `Añadir horario a ${day}`);
            addButton.onclick = () => {
                const newHour = newHourInput.value.trim();
                if (!newHour) {
                    newHourInput.focus();
                    return;
                }
                if (!state.configDias[dayIndex].includes(newHour)) {
                    state.configDias[dayIndex].push(newHour);
                    saveToStorage();
                    renderHorariosGlobales();
                    renderTabla();
                    renderDetailsSidebar();
                }
            };

            addRow.append(newHourInput, addButton);
            daySection.appendChild(addRow);
            container.appendChild(daySection);
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

    function getDateKey(date) {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }

    function getParticipantMonthlyAssignmentCount(participantName, date, excludedKey = '') {
        const monthPrefix = getDateKey(date).slice(0, 7);
        const outingKeys = new Set();
        Object.entries(state.manuales).forEach(([key, name]) => {
            if (name !== participantName || key === excludedKey || !key.startsWith(monthPrefix) || !/_p\d+$/.test(key)) {
                return;
            }
            outingKeys.add(key.replace(/_p\d+$/, ''));
        });
        return outingKeys.size;
    }

    function isWithinMonthlyLimit(participant, date, excludedKey = '') {
        return participant.maxSalidasMes === null ||
            getParticipantMonthlyAssignmentCount(participant.name, date, excludedKey) < participant.maxSalidasMes;
    }

    function getPreferredPairAssignmentCount(participantName, assignedNames, dayOfWeek, hour, location) {
        const pairAssignments = new Set();
        Object.entries(state.manuales).forEach(([key, name]) => {
            if (name !== participantName || !/_p\d+$/.test(key)) return;

            const outingKey = key.replace(/_p\d+$/, '');
            const hourEnd = outingKey.lastIndexOf('_');
            if (hour && outingKey.slice(11, hourEnd) !== hour) return;
            const [year, month, day] = outingKey.slice(0, 10).split('-').map(Number);
            if (!year || new Date(year, month - 1, day).getDay() !== dayOfWeek) return;
            if (location && state.manuales[`${outingKey}_lugar`] !== location) return;

            assignedNames.forEach(assignedName => {
                if (arePreferredCompanions(participantName, assignedName)) {
                    pairAssignments.add(`${outingKey}|${assignedName}`);
                }
            });
        });
        return pairAssignments.size;
    }

    function getRotationTieRank(participantName, date, hour) {
        const value = `${getDateKey(date)}|${hour}|${participantName}`;
        return Array.from(value).reduce((hash, character) =>
            (hash * 31 + character.charCodeAt(0)) >>> 0, 0);
    }

    function isAssignedToAnotherOutingOnDate(participantName, date, currentOutingKey) {
        const datePrefix = `${getDateKey(date)}_`;
        return Object.entries(state.manuales).some(([key, name]) => {
            if (name !== participantName || !key.startsWith(datePrefix) || !/_p\d+$/.test(key)) return false;
            return key.replace(/_p\d+$/, '') !== currentOutingKey;
        });
    }

    function getHorasConfiguradas(date) {
        const dateKey = getDateKey(date);
        const hours = Object.prototype.hasOwnProperty.call(state.configFechas, dateKey)
            ? state.configFechas[dateKey]
            : (state.configDias && state.configDias[date.getDay()]) ? state.configDias[date.getDay()] : [];
        return hours.filter(hour =>
            state.participantes.some(participant =>
                participant.cartas || getParticipantAvailableForHour(participant, date.getDay(), hour)
            )
        ).slice(0, state.limiteHorariosDia);
    }

    function getKeyBase(date, hora, index) {
        return `${getDateKey(date)}_${hora}_${index}`;
    }

    function updateFechaHorario(date, horarios, oldKeyBase = null, newKeyBase = null) {
        const keysToMove = oldKeyBase && newKeyBase
            ? Object.keys(state.manuales).filter(key =>
                key === `${oldKeyBase}_lugar` || key.startsWith(`${oldKeyBase}_p`)
            )
            : [];
        const movedEntries = keysToMove.map(key => [
            `${newKeyBase}${key.slice(oldKeyBase.length)}`,
            state.manuales[key]
        ]);

        if (movedEntries.some(([key]) => Object.prototype.hasOwnProperty.call(state.manuales, key) && !keysToMove.includes(key))) {
            alert('Ya existe una salida con asignaciones en ese horario. Elige otra hora.');
            return false;
        }

        state.configFechas[getDateKey(date)] = horarios;
        keysToMove.forEach(key => delete state.manuales[key]);
        movedEntries.forEach(([key, value]) => {
            state.manuales[key] = value;
        });
        saveToStorage();
        renderTabla();
        return true;
    }

    function removeFechaHorario(date, horarioIndex) {
        const dateKey = getDateKey(date);
        const horariosActuales = getHorasConfiguradas(date);
        const removedHour = horariosActuales[horarioIndex];
        if (!removedHour) return;

        const assignmentsByIndex = horariosActuales.map((hour, index) => {
            const keyBase = getKeyBase(date, hour, index);
            return Object.fromEntries(
                Object.entries(state.manuales).filter(([key]) =>
                    key === `${keyBase}_lugar` || key.startsWith(`${keyBase}_p`)
                ).map(([key, value]) => [key.slice(keyBase.length), value])
            );
        });
        horariosActuales.forEach((hour, index) => {
            const keyBase = getKeyBase(date, hour, index);
            Object.keys(state.manuales).forEach(key => {
                if (key === `${keyBase}_lugar` || key.startsWith(`${keyBase}_p`)) {
                    delete state.manuales[key];
                }
            });
        });

        horariosActuales.splice(horarioIndex, 1);
        state.configFechas[dateKey] = horariosActuales;
        horariosActuales.forEach((hour, index) => {
            const keyBase = getKeyBase(date, hour, index);
            Object.entries(assignmentsByIndex[index < horarioIndex ? index : index + 1] || {}).forEach(([suffix, value]) => {
                state.manuales[`${keyBase}${suffix}`] = value;
            });
        });

        saveToStorage();
        renderTabla();
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
            const horasConfiguradas = getHorasConfiguradas(date);

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
                const keyBase = getKeyBase(date, hora, idx);
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
                const assignedNames = Object.keys(state.manuales)
                    .filter(key => key.startsWith(`${keyBase}_p`))
                    .map(key => state.manuales[key]);
                (state.lugares || []).forEach(l => {
                    if (!l) return;
                    const isAvailable = isLugarAvailable(l, dayOfWeek, hora);
                    const isCompatible = assignedNames.every(name =>
                        isParticipantAllowedWithCompanions(name, l, assignedNames)
                    );
                    const isCurrentLocation = state.manuales[keyLugar] === l;
                    const option = document.createElement('option');
                    option.value = l;
                    option.textContent = !isAvailable
                        ? `${l} (no disponible en este horario)`
                        : !isCompatible
                            ? `${l} (participantes no autorizados)`
                            : l;
                    option.disabled = (!isAvailable || !isCompatible) && !isCurrentLocation;
                    option.selected = isCurrentLocation;
                    selLugar.appendChild(option);
                });
                selLugar.onchange = (e) => {
                    state.manuales[keyLugar] = e.target.value;
                    saveToStorage();
                    renderTabla();
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

                const currentSlotCount = 3;

                const createSelect = (slotIndex) => {
                    const keyPart = `${keyBase}_p${slotIndex}`;
                    const selPart = document.createElement('select');
                    selPart.className = 'select-participante-row';
                    selPart.style.width = '100%';
                    selPart.title = '⭐ indica un compañero preferido de otro participante asignado a esta salida';
                    selPart.innerHTML = '<option value="">-- Seleccionar --</option>';

                    const assignedName = state.manuales[keyPart];
                    const namesAssignedToOtherSlots = new Set(Object.keys(state.manuales)
                        .filter(key => key.startsWith(`${keyBase}_p`) && key !== keyPart)
                        .map(key => state.manuales[key]));
                    const otherAssignedNames = Object.keys(state.manuales)
                        .filter(key => key.startsWith(`${keyBase}_p`) && key !== keyPart)
                        .map(key => state.manuales[key]);
                    const preferredCompanions = new Set(
                        (state.participantes || [])
                            .filter(participant => otherAssignedNames.some(name =>
                                arePreferredCompanions(participant.name, name)
                            ))
                            .map(participant => participant.name)
                    );

                    (state.participantes || []).forEach(p => {
                        if (!p || !p.name) return;

                        const isAvailable = p.cartas || getParticipantAvailableForHour(p, dayOfWeek, hora);
                        const isWithinLimit = isWithinMonthlyLimit(p, date, keyPart);
                        const isAllowedAtLocation = isParticipantAllowedWithCompanions(
                            p.name,
                            state.manuales[keyLugar],
                            otherAssignedNames
                        );
                        const isPreferredCompanion = preferredCompanions.has(p.name);
                        const alreadyAssigned = namesAssignedToOtherSlots.has(p.name);
                        const option = document.createElement('option');
                        option.value = p.name;
                        let status = '';
                        if (alreadyAssigned) status = ' (ya asignado)';
                        else if (!isAvailable) status = ' (no disponible)';
                        else if (!isWithinLimit) status = ' (límite mensual alcanzado)';
                        else if (!isAllowedAtLocation) status = ' (no autorizado para este lugar)';
                        option.textContent = `${isPreferredCompanion ? '⭐ ' : ''}${p.conyuge ? '💍 ' : ''}${p.name}${status}`;
                        if (isPreferredCompanion) option.title = 'Compañero preferido';
                        option.disabled = (alreadyAssigned || !isAvailable || !isWithinLimit || !isAllowedAtLocation) &&
                            p.name !== assignedName;
                        option.selected = assignedName === p.name;
                        selPart.appendChild(option);
                    });

                    selPart.onchange = (e) => {
                        if (e.target.value) {
                            state.manuales[keyPart] = e.target.value;
                        } else {
                            delete state.manuales[keyPart];
                        }
                        saveToStorage();
                        renderTabla();
                    };
                    return selPart;
                };

                for (let slot = 1; slot <= currentSlotCount; slot++) {
                    selectContainer.appendChild(createSelect(slot));
                }

                divPart.appendChild(selectContainer);
                tdPart.appendChild(divPart);

                // Columna Acciones
                const divAcc = document.createElement('div');
                divAcc.style.cssText = blockStyle;
                const btnAddSalida = document.createElement('button');
                btnAddSalida.textContent = '➕';
                btnAddSalida.title = 'Añadir otra salida este día';
                btnAddSalida.setAttribute('aria-label', 'Añadir otra salida este día');
                btnAddSalida.onclick = () => {
                    const nuevaHora = prompt(`Horario para otra salida el ${formatFechaCompleta(date)}:`);
                    if (nuevaHora === null || !nuevaHora.trim()) return;
                    const horariosActuales = getHorasConfiguradas(date);
                    updateFechaHorario(date, [...horariosActuales, nuevaHora.trim()]);
                };

                const btnEditarHorario = document.createElement('button');
                btnEditarHorario.textContent = '✏️';
                btnEditarHorario.title = 'Editar horario de esta salida';
                btnEditarHorario.setAttribute('aria-label', 'Editar horario de esta salida');
                btnEditarHorario.onclick = () => {
                    const nuevaHora = prompt(`Editar horario para ${state.manuales[keyBase + '_lugar'] || 'este lugar'} el ${formatFechaCompleta(date)}:`, hora);
                    if (nuevaHora === null || !nuevaHora.trim() || nuevaHora.trim() === hora) return;

                    const horariosActuales = getHorasConfiguradas(date);
                    const horariosActualizados = [...horariosActuales];
                    horariosActualizados[idx] = nuevaHora.trim();
                    updateFechaHorario(date, horariosActualizados, keyBase, getKeyBase(date, nuevaHora.trim(), idx));
                };

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
                if (Object.prototype.hasOwnProperty.call(state.configFechas, getDateKey(date)) &&
                    idx > 0) {
                    const btnRemoveHorario = document.createElement('button');
                    btnRemoveHorario.type = 'button';
                    btnRemoveHorario.textContent = '−';
                    btnRemoveHorario.title = 'Eliminar este horario de este día';
                    btnRemoveHorario.setAttribute('aria-label', 'Eliminar este horario de este día');
                    btnRemoveHorario.onclick = () => removeFechaHorario(date, idx);
                    divAcc.appendChild(btnRemoveHorario);
                }
                divAcc.append(btnAddSalida, btnEditarHorario);
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
                            state.participantes.push({
                                name: line,
                                disponibilidad: createDefaultDisp(),
                                cartas: false,
                                horariosDisponibles: null,
                                preferenciasLugares: [],
                                preferenciasCompaneros: [],
                                conyuge: '',
                                maxSalidasMes: null
                            });
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
    function autoAsignarParticipantes({ notify = true } = {}) {
        if (!els.fInicio) return false;
        let start = parseFecha(els.fInicio.value);
        if (!start) {
            if (notify) alert('Selecciona una fecha de inicio primero.');
            return false;
        }

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
            if (/_p\d+$/.test(k)) {
                const name = state.manuales[k];
                if (name && conteoAsignaciones[name] !== undefined) {
                    conteoAsignaciones[name]++;
                }
            }
        });

        autoAsignarLugares(start, totalDias);

        for (let i = 0; i < totalDias; i++) {
            let date = new Date(start);
            date.setDate(start.getDate() + i);
            const dayOfWeek = date.getDay();
            const horasConfiguradas = getHorasConfiguradas(date);

            horasConfiguradas.forEach((hora, idx) => {
                const keyBase = getKeyBase(date, hora, idx);
                const turno = getTurnoPorHora(hora);
                for (let slot = 1; slot <= 3; slot++) {
                    const keyPart = `${keyBase}_p${slot}`;
                    if (state.manuales[keyPart]) continue;
                    const selectedLocation = state.manuales[`${keyBase}_lugar`];
                    const assignedNames = Object.keys(state.manuales)
                        .filter(key => key.startsWith(`${keyBase}_p`) && key !== keyPart)
                        .map(key => state.manuales[key]);

                    let candidatos = state.participantes.filter(p => {
                        if (!p) return false;
                        if (isAssignedToAnotherOutingOnDate(p.name, date, keyBase)) return false;
                        if (!isWithinMonthlyLimit(p, date)) return false;
                        if (!isParticipantAllowedWithCompanions(p.name, selectedLocation, assignedNames)) return false;
                        if (p.cartas) return true;
                        return getParticipantAvailableForHour(p, dayOfWeek, hora);
                    });

                    if (candidatos.length === 0) continue;

                    const emptySlots = [1, 2, 3].filter(slot =>
                        !state.manuales[`${keyBase}_p${slot}`]
                    );
                    const availableSpouses = candidatos.filter(candidate => {
                        if (!candidate.conyuge || assignedNames.includes(candidate.conyuge) || emptySlots.length < 2) return false;
                        const spouse = state.participantes.find(participant => participant.name === candidate.conyuge);
                        return spouse &&
                            !assignedNames.includes(spouse.name) &&
                            !isAssignedToAnotherOutingOnDate(spouse.name, date, keyBase) &&
                            isWithinMonthlyLimit(spouse, date) &&
                            (spouse.cartas || getParticipantAvailableForHour(spouse, dayOfWeek, hora)) &&
                            isParticipantAllowedWithCompanions(
                                spouse.name,
                                selectedLocation,
                                [...assignedNames, candidate.name]
                            );
                    });
                    availableSpouses.sort((a, b) =>
                        getPreferredPairAssignmentCount(a.name, assignedNames, dayOfWeek, null, selectedLocation) -
                        getPreferredPairAssignmentCount(b.name, assignedNames, dayOfWeek, null, selectedLocation) ||
                        getPreferredPairAssignmentCount(a.name, assignedNames, dayOfWeek, hora, selectedLocation) -
                        getPreferredPairAssignmentCount(b.name, assignedNames, dayOfWeek, hora, selectedLocation) ||
                        getRotationTieRank(a.name, date, hora) - getRotationTieRank(b.name, date, hora) ||
                        (conteoAsignaciones[a.name] || 0) - (conteoAsignaciones[b.name] || 0)
                    );
                    const availableMarriagePairs = new Set(
                        availableSpouses.map(candidate => [candidate.name, candidate.conyuge].sort().join('|'))
                    );
                    const prioritizeSingle = assignedNames.length === 0 &&
                        emptySlots.length === 3 &&
                        availableMarriagePairs.size >= 2;

                    let conPrioridad = candidatos.filter(p => {
                        if (p.cartas) return true;
                        const dConfig = p.disponibilidad[dayOfWeek];
                        return (turno === 'm' ? dConfig.pM : dConfig.pT);
                    });

                    let pool = conPrioridad.length > 0 ? conPrioridad : candidatos;
                    pool = pool.filter(p => !assignedNames.includes(p.name));
                    const preferredPool = pool.filter(candidate => assignedNames.some(assignedName => {
                        return arePreferredCompanions(candidate.name, assignedName);
                    }));
                    if (preferredPool.length) pool = preferredPool;

                    pool.sort((a, b) =>
                        getPreferredPairAssignmentCount(a.name, assignedNames, dayOfWeek, null, selectedLocation) -
                        getPreferredPairAssignmentCount(b.name, assignedNames, dayOfWeek, null, selectedLocation) ||
                        getPreferredPairAssignmentCount(a.name, assignedNames, dayOfWeek, hora, selectedLocation) -
                        getPreferredPairAssignmentCount(b.name, assignedNames, dayOfWeek, hora, selectedLocation) ||
                        getRotationTieRank(a.name, date, hora) - getRotationTieRank(b.name, date, hora) ||
                        (conteoAsignaciones[a.name] || 0) - (conteoAsignaciones[b.name] || 0)
                    );
                    const singleCandidates = pool.filter(candidate => !candidate.conyuge);
                    const elegido = prioritizeSingle && singleCandidates.length
                        ? singleCandidates[0]
                        : availableSpouses[0] ||
                        pool.find(candidate => !candidate.conyuge ||
                            assignedNames.includes(candidate.conyuge)) ||
                        (emptySlots.length === 1 ? preferredPool[0] : null) ||
                        pool.find(candidate => candidate.conyuge);
                    if (elegido) {
                        state.manuales[keyPart] = elegido.name;
                        conteoAsignaciones[elegido.name] = (conteoAsignaciones[elegido.name] || 0) + 1;

                        if (availableSpouses.includes(elegido)) {
                            const spouseSlot = emptySlots.find(emptySlot => emptySlot !== slot);
                            if (spouseSlot) {
                                state.manuales[`${keyBase}_p${spouseSlot}`] = elegido.conyuge;
                                conteoAsignaciones[elegido.conyuge] = (conteoAsignaciones[elegido.conyuge] || 0) + 1;
                            }
                        }
                    }
                }
            });
        }

        saveToStorage();
        renderTabla();
        if (notify) alert('Asignación automatizada completada con éxito.');
        return true;
    }

    function autoAsignarLugares(start, totalDias) {
        const generatedDates = new Set(
            Array.from({ length: totalDias }, (_, index) => {
                const date = new Date(start);
                date.setDate(start.getDate() + index);
                return getDateKey(date);
            })
        );
        const locationUsage = new Map();
        Object.entries(state.manuales).forEach(([key, location]) => {
            const dateKey = key.slice(0, 10);
            if (key.endsWith('_lugar') && generatedDates.has(dateKey) && location) {
                locationUsage.set(location, (locationUsage.get(location) || 0) + 1);
            }
        });

        for (let i = 0; i < totalDias; i++) {
            const date = new Date(start);
            date.setDate(start.getDate() + i);
            const dayOfWeek = date.getDay();

            getHorasConfiguradas(date).forEach((hour, index) => {
                const keyBase = getKeyBase(date, hour, index);
                const locationKey = `${keyBase}_lugar`;
                if (state.manuales[locationKey]) return;

                const assignedNames = Object.keys(state.manuales)
                    .filter(key => key.startsWith(`${keyBase}_p`))
                    .map(key => state.manuales[key]);
                const assignedNameSet = new Set(assignedNames);
                const availableLocations = state.lugares.filter(location =>
                    location &&
                    isLugarAvailable(location, dayOfWeek, hour) &&
                    assignedNames.every(name =>
                        isParticipantAllowedWithCompanions(name, location, assignedNames)
                    )
                ).map(location => {
                    const availableParticipants = state.participantes.filter(participant =>
                        participant &&
                        !assignedNameSet.has(participant.name) &&
                        isWithinMonthlyLimit(participant, date) &&
                        isParticipantAllowedWithCompanions(participant.name, location, assignedNames) &&
                        (participant.cartas || getParticipantAvailableForHour(participant, dayOfWeek, hour))
                    );
                    return {
                        location,
                        availableCount: assignedNames.length + availableParticipants.length,
                        availableParticipants
                    };
                }).filter(option => option.availableCount > 0);
                if (!availableLocations.length) return;

                const preferredLocations = new Set(assignedNames.flatMap(name => {
                    const participant = state.participantes.find(item => item.name === name);
                    return participant ? participant.preferenciasLugares : [];
                }).concat(availableLocations.flatMap(option =>
                    option.availableParticipants.flatMap(participant => participant.preferenciasLugares)
                )));
                availableLocations.sort((a, b) =>
                    (locationUsage.get(a.location) || 0) - (locationUsage.get(b.location) || 0) ||
                    Number(preferredLocations.has(b.location)) - Number(preferredLocations.has(a.location)) ||
                    b.availableCount - a.availableCount
                );
                const selectedLocation = availableLocations[0].location;
                state.manuales[locationKey] = selectedLocation;
                locationUsage.set(selectedLocation, (locationUsage.get(selectedLocation) || 0) + 1);
            });
        }
    }

    // --- CONFIGURACIÓN INICIAL ---
    function init() {
        loadFromStorage();
        els.detailsParticipantsTab.addEventListener('click', () => setDetailsSection('participants'));
        els.detailsPlacesTab.addEventListener('click', () => setDetailsSection('places'));
        setDetailsSection(state.detailActiveSection);

        const colorScheme = window.matchMedia('(prefers-color-scheme: dark)');
        const applySystemTheme = event => {
            document.body.dataset.theme = event.matches ? 'dark' : 'light';
        };
        applySystemTheme(colorScheme);
        colorScheme.addEventListener('change', applySystemTheme);
        localStorage.removeItem(KEYS.THEME);

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
                    state.participantes.push({
                        name: n,
                        disponibilidad: createDefaultDisp(),
                        cartas: false,
                        horariosDisponibles: null,
                        preferenciasLugares: [],
                        preferenciasCompaneros: [],
                        conyuge: '',
                        maxSalidasMes: null
                    });
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
                document.body.dataset.theme = isDark ? 'light' : 'dark';
            };
        }

        if (els.btnExportSave) {
            els.btnExportSave.onclick = () => {
                try {
                    createSaveFile();
                } catch (error) {
                    console.error('No se pudo crear el archivo de guardado:', error);
                    alert('No se pudo crear el archivo de guardado.');
                }
            };
        }

        if (els.btnImportSave && els.fileSave) {
            els.btnImportSave.onclick = () => els.fileSave.click();
            els.fileSave.onchange = async () => {
                const [file] = els.fileSave.files || [];
                if (file) await loadSaveFile(file);
                els.fileSave.value = '';
            };
        }

        if (els.btnBloquearTodo) {
            els.btnBloquearTodo.onclick = () => { alert('Cronograma asegurado correctamente.'); };
        }

        if (els.btnAsignarParticipantes) {
            els.btnAsignarParticipantes.onclick = autoAsignarParticipantes;
        }

        if (els.btnGenerateProgram) {
            els.btnGenerateProgram.onclick = () => autoAsignarParticipantes();
        }

        if (els.btnLimpiarAsignaciones) {
            els.btnLimpiarAsignaciones.onclick = () => {
                if (confirm('¿Deseas quitar todos los lugares y participantes asignados en la tabla? Se conservarán las fechas y horarios configurados.')) {
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
        document.querySelectorAll('#btnExportPDF, .btn-export:not(#btnGenerateProgram)').forEach(btn => {
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
        renderHorariosGlobales();
    }

    init();
})();
