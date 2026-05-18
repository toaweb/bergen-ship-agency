// Navbar scroll effect
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 20);
});

// Mobile nav toggle (with aria-expanded sync for screen readers)
const navToggle = document.getElementById('navToggle');
const navMenu = document.getElementById('navMenu');
navToggle?.addEventListener('click', () => {
  const open = navMenu.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
});

// Mobile dropdown toggle
document.querySelectorAll('.has-dropdown > a').forEach(link => {
  link.addEventListener('click', (e) => {
    if (window.innerWidth <= 768) {
      e.preventDefault();
      link.parentElement.classList.toggle('open');
    }
  });
});

// Contact form: progressive enhancement — submit via fetch, show inline status.
// User-facing strings come from data-* attributes set by Hugo's i18n function.
const contactForm = document.getElementById('contact-form');
if (contactForm) {
  const status = document.getElementById('form-status');
  const submitBtn = contactForm.querySelector('button[type="submit"]');
  const originalBtnText = submitBtn.textContent;
  const msgs = {
    success: contactForm.dataset.msgSuccess,
    error: contactForm.dataset.msgError,
    network: contactForm.dataset.msgNetwork,
    sending: contactForm.dataset.btnSending,
  };

  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    status.textContent = '';
    status.className = 'form-status';
    submitBtn.disabled = true;
    submitBtn.textContent = msgs.sending;

    try {
      const res = await fetch(contactForm.action, {
        method: 'POST',
        body: new FormData(contactForm),
        headers: { 'Accept': 'application/json' },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        status.textContent = msgs.success;
        status.className = 'form-status form-status-success';
        contactForm.reset();
      } else {
        status.textContent = data.error || msgs.error;
        status.className = 'form-status form-status-error';
      }
    } catch {
      status.textContent = msgs.network;
      status.className = 'form-status form-status-error';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalBtnText;
    }
  });
}
