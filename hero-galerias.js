document.addEventListener("DOMContentLoaded", () => {
    const galeriasHero = document.querySelectorAll(".hero-galeria");

    galeriasHero.forEach((galeria) => {
        const img1 = galeria.querySelector(".img1");
        const img2 = galeria.querySelector(".img2");
        const tarjeta = galeria.closest(".hero-card");

        const lista = (galeria.dataset.imagenes || "")
            .split(",")
            .map(r => r.trim())
            .filter(Boolean);

        if (!img1 || !img2 || lista.length < 2) return;

        let indice = 0;
        let usandoImg1 = true;
        let intervalo = null;

        img1.src = lista[0];

        function cambiarImagen() {
            indice = (indice + 1) % lista.length;
            const siguiente = lista[indice];

            if (usandoImg1) {
                img2.src = siguiente;
                img2.classList.add("activa");
                img1.classList.remove("activa");
            } else {
                img1.src = siguiente;
                img1.classList.add("activa");
                img2.classList.remove("activa");
            }

            usandoImg1 = !usandoImg1;
        }

        function iniciarAutoplay() {
            if (intervalo) return;

            intervalo = setInterval(cambiarImagen, 3200);
        }

        function detenerAutoplay() {
            clearInterval(intervalo);
            intervalo = null;
        }

        iniciarAutoplay();

        tarjeta.addEventListener("mouseenter", detenerAutoplay);
        tarjeta.addEventListener("mouseleave", iniciarAutoplay);
    });
});