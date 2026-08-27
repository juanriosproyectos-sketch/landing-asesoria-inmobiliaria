// Año dinámico en el footer
document.getElementById('year').textContent = new Date().getFullYear();

// Reveal on scroll
const revealEls = document.querySelectorAll('.reveal');

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  revealEls.forEach((el) => observer.observe(el));
} else {
  // Fallback: mostrar todo directamente
  revealEls.forEach((el) => el.classList.add('is-visible'));
}

/* ---------------------------------------------------------
   ENLACE DEL BOTÓN "AGENDAR AHORA"
   Reemplaza el href de abajo por tu enlace real de agenda:
   - WhatsApp:  https://wa.me/52XXXXXXXXXX
   - Calendly:  https://calendly.com/tu-usuario/asesoria
--------------------------------------------------------- */
document.querySelectorAll('a[href="#"]').forEach((btn) => {
  btn.addEventListener('click', (e) => {
    // Si aún no has configurado el enlace real, evita el "#" vacío
    if (btn.getAttribute('href') === '#') {
      e.preventDefault();
      console.warn('⚠️ Configura el enlace de agenda en index.html / script.js');
    }
  });
});
