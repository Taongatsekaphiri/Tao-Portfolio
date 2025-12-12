document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('contactForm');
  const formMessage = document.getElementById('formMessage');

  if (!form) return;

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    fetch('/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
      .then(res => res.json())
      .then(result => {
        if (result.status === 'success') {
          form.reset();
          if (formMessage) {
            formMessage.textContent = 'Message sent successfully!';
            formMessage.style.display = 'flex';
            setTimeout(() => {
              formMessage.style.display = 'none';
            }, 3000);
          }
        } else {
          if (formMessage) {
            formMessage.textContent = result.details || 'Error sending message.';
            formMessage.style.display = 'flex';
            setTimeout(() => {
              formMessage.style.display = 'none';
            }, 3000);
          }
        }
      })
      .catch(() => {
        if (formMessage) {
          formMessage.textContent = 'Network error.';
          formMessage.style.display = 'flex';
          setTimeout(() => {
            formMessage.style.display = 'none';
          }, 3000);
        }
      });
  });
});
