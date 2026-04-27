document.addEventListener("DOMContentLoaded", () => {
    const botonMusica = document.getElementById("toggle-musica");
    const audioGeneral = new Audio("audio/general.mp3");

    const zonas = {
        inicio: {
            contenedor: document.querySelector("#inicio"),
            audio: audioGeneral
        },
        marruecos: {
            contenedor: document.querySelector(".bloque-marruecos"),
            audio: new Audio("audio/marruecos.mp3")
        },
        mexico: {
            contenedor: document.querySelector(".bloque-mexico"),
            audio: new Audio("audio/mexico.mp3")
        },
        canarias: {
            contenedor: document.querySelector(".bloque-canarias"),
            audio: new Audio("audio/canarias.mp3")
        },
        historias: {
            contenedor: document.querySelector("#historias"),
            audio: audioGeneral
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

    function fadeInMovil(audio) {
        audio.volume = 0.05;

        audio.play().catch(() => {
            console.log("El navegador bloqueó el audio hasta interacción.");
        });

        const intervalo = setInterval(() => {
            if (audio.volume < VOLUMEN_MAX) {
                audio.volume = Math.min(audio.volume + 0.02, VOLUMEN_MAX);
            } else {
                clearInterval(intervalo);
            }
        }, 40);

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

    function reproducirZona(claveNueva) {
        if (!musicaActiva) return;
        if (!zonas[claveNueva]) return;
        if (claveActual === claveNueva) return;
        if (cambioEnCurso && !esMovil()) return;

        const nuevoAudio = zonas[claveNueva].audio;

        limpiarIntervalos();

        if (esMovil()) {
            audiosUnicos.forEach((audio) => {
                if (audio !== nuevoAudio) {
                    audio.pause();
                    audio.volume = 0;
                }
            });

            fadeInMovil(nuevoAudio);

            claveActual = claveNueva;
            cambioEnCurso = false;
            return;
        }

        cambioEnCurso = true;

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

        const puntoPagina = window.scrollY + window.innerHeight * 0.35;
        let zonaActual = "inicio";

        for (const [clave, zona] of Object.entries(zonas)) {
            if (!zona.contenedor) continue;

            const inicioZona = zona.contenedor.offsetTop;

            if (puntoPagina >= inicioZona - 80) {
                zonaActual = clave;
            }
        }

        return zonaActual;
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
        }, esMovil() ? 80 : 0);
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