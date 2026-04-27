document.addEventListener("DOMContentLoaded", () => {
    const botonMusica = document.getElementById("toggle-musica");

    const zonas = {
        inicio: {
            contenedor: document.querySelector("#inicio"),
            src: "audio/general.mp3",
            audio: new Audio("audio/general.mp3")
        },
        marruecos: {
            contenedor: document.querySelector(".bloque-marruecos"),
            src: "audio/marruecos.mp3",
            audio: new Audio("audio/marruecos.mp3")
        },
        mexico: {
            contenedor: document.querySelector(".bloque-mexico"),
            src: "audio/mexico.mp3",
            audio: new Audio("audio/mexico.mp3")
        },
        canarias: {
            contenedor: document.querySelector(".bloque-canarias"),
            src: "audio/canarias.mp3",
            audio: new Audio("audio/canarias.mp3")
        },
        historias: {
            contenedor: document.querySelector("#historias"),
            src: "audio/general.mp3",
            audio: new Audio("audio/general.mp3")
        }
    };

    const VOLUMEN_MAX = 0.15;
    const PASO_FADE = 0.01;
    const INTERVALO_FADE = 50;

    let musicaActiva = false;
    let claveActual = null;
    let cambioEnCurso = false;
    let intervalosActivos = [];
    let temporizadorScroll = null;

    const audioMovil = new Audio();
    audioMovil.loop = true;
    audioMovil.preload = "auto";
    audioMovil.volume = VOLUMEN_MAX;

    let srcMovilActual = null;
    const tiemposMovil = {};

    const audiosUnicos = [...new Set(Object.values(zonas).map(zona => zona.audio))];

    audiosUnicos.forEach((audio) => {
        audio.loop = true;
        audio.preload = "auto";
        audio.volume = 0;
    });

    function esMovil() {
        return window.innerWidth <= 900;
    }

    function limpiarIntervalos() {
        intervalosActivos.forEach((id) => clearInterval(id));
        intervalosActivos = [];
    }

    function fadeIn(audio) {
        audio.volume = 0;

        audio.play().catch(() => {
            console.log("El navegador bloqueó el audio hasta interacción.");
        });

        const intervalo = setInterval(() => {
            if (audio.volume < VOLUMEN_MAX) {
                audio.volume = Math.min(audio.volume + PASO_FADE, VOLUMEN_MAX);
            } else {
                clearInterval(intervalo);
            }
        }, INTERVALO_FADE);

        intervalosActivos.push(intervalo);
    }

    function crossFade(audioSale, audioEntra, callback) {
        if (audioSale === audioEntra) {
            if (callback) callback();
            return;
        }

        audioEntra.volume = 0;

        audioEntra.play().catch(() => {
            console.log("El navegador bloqueó el audio hasta interacción.");
        });

        const intervalo = setInterval(() => {
            if (audioSale.volume > PASO_FADE) {
                audioSale.volume = Math.max(audioSale.volume - PASO_FADE, 0);
            }

            if (audioEntra.volume < VOLUMEN_MAX) {
                audioEntra.volume = Math.min(audioEntra.volume + PASO_FADE, VOLUMEN_MAX);
            }

            const salidaTerminada = audioSale.volume <= PASO_FADE;
            const entradaTerminada = audioEntra.volume >= VOLUMEN_MAX;

            if (salidaTerminada) {
                audioSale.volume = 0;
                audioSale.pause();
            }

            if (salidaTerminada && entradaTerminada) {
                clearInterval(intervalo);
                if (callback) callback();
            }
        }, INTERVALO_FADE);

        intervalosActivos.push(intervalo);
    }

    function reproducirZonaMovil(claveNueva) {
        if (!musicaActiva) return;
        if (!zonas[claveNueva]) return;
        if (claveActual === claveNueva) return;

        const srcNuevo = zonas[claveNueva].src;

        audiosUnicos.forEach((audio) => {
            audio.pause();
            audio.volume = 0;
        });

        if (srcMovilActual) {
            tiemposMovil[srcMovilActual] = audioMovil.currentTime || 0;
        }

        if (srcMovilActual !== srcNuevo) {
            srcMovilActual = srcNuevo;
            audioMovil.src = srcNuevo;
            audioMovil.currentTime = tiemposMovil[srcNuevo] || 0;
        }

        audioMovil.volume = VOLUMEN_MAX;
        audioMovil.play().catch(() => {
            console.log("Audio móvil bloqueado hasta interacción.");
        });

        claveActual = claveNueva;
    }

    function reproducirZona(claveNueva) {
        if (!musicaActiva) return;
        if (!zonas[claveNueva]) return;

        if (esMovil()) {
            reproducirZonaMovil(claveNueva);
            return;
        }

        if (claveActual === claveNueva) return;
        if (cambioEnCurso) return;

        const nuevoAudio = zonas[claveNueva].audio;
        cambioEnCurso = true;

        limpiarIntervalos();

        audioMovil.pause();

        if (claveActual) {
            const audioActual = zonas[claveActual].audio;

            crossFade(audioActual, nuevoAudio, () => {
                claveActual = claveNueva;
                cambioEnCurso = false;
            });
        } else {
            claveActual = claveNueva;
            fadeIn(nuevoAudio);

            setTimeout(() => {
                cambioEnCurso = false;
            }, 800);
        }
    }

    function detenerTodo() {
        limpiarIntervalos();

        audiosUnicos.forEach((audio) => {
            audio.pause();
            audio.volume = 0;
        });

        audioMovil.pause();

        claveActual = null;
        cambioEnCurso = false;
    }

    function actualizarBoton() {
        if (!botonMusica) return;

        if (musicaActiva) {
            botonMusica.textContent = "Desactivar música";
            botonMusica.classList.add("activa");
        } else {
            botonMusica.textContent = "Activar música";
            botonMusica.classList.remove("activa");
        }
    }

    function obtenerZonaVisible() {
        if (!esMovil()) {
            const puntoReferencia = window.innerHeight * 0.45;

            for (const [clave, zona] of Object.entries(zonas)) {
                if (!zona.contenedor) continue;

                const rect = zona.contenedor.getBoundingClientRect();

                if (rect.top <= puntoReferencia && rect.bottom >= puntoReferencia) {
                    return clave;
                }
            }

            return null;
        }

        let zonaMasVisible = null;
        let mayorVisibilidad = 0;

        for (const [clave, zona] of Object.entries(zonas)) {
            if (!zona.contenedor) continue;

            const rect = zona.contenedor.getBoundingClientRect();

            const visibleArriba = Math.max(rect.top, 0);
            const visibleAbajo = Math.min(rect.bottom, window.innerHeight);
            const alturaVisible = Math.max(0, visibleAbajo - visibleArriba);

            if (alturaVisible > mayorVisibilidad) {
                mayorVisibilidad = alturaVisible;
                zonaMasVisible = clave;
            }
        }

        return zonaMasVisible;
    }

    function comprobarZonaActiva() {
        if (!musicaActiva) return;

        const zonaVisible = obtenerZonaVisible();

        if (zonaVisible) {
            reproducirZona(zonaVisible);
        }
    }

    function comprobarZonaActivaConPausa() {
        clearTimeout(temporizadorScroll);

        temporizadorScroll = setTimeout(() => {
            comprobarZonaActiva();
        }, esMovil() ? 100 : 0);
    }

    if (botonMusica) {
        botonMusica.addEventListener("click", () => {
            musicaActiva = !musicaActiva;
            actualizarBoton();

            if (musicaActiva) {
                comprobarZonaActiva();

                if (!claveActual) {
                    reproducirZona("inicio");
                }
            } else {
                detenerTodo();
            }
        });
    }

    window.addEventListener("scroll", comprobarZonaActivaConPausa, { passive: true });
    window.addEventListener("resize", comprobarZonaActiva);
    window.addEventListener("touchend", comprobarZonaActiva, { passive: true });

    actualizarBoton();
});