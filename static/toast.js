window.Toast = {
  _container: null,

  _init() {
    if (this._container) return;
    this._container = document.createElement('div');
    this._container.id = 'toast-container';
    document.body.appendChild(this._container);
  },

  show(message, type = 'success', duration = 3800) {
    this._init();
    const icons = {
      success: 'fa-check-circle',
      error:   'fa-exclamation-circle',
      warning: 'fa-exclamation-triangle',
      info:    'fa-info-circle'
    };
    const el = document.createElement('div');
    el.className = `toast-item toast-${type}`;
    el.innerHTML = `
      <i class="fas ${icons[type] || icons.info} toast-icon"></i>
      <span class="toast-msg">${message}</span>
      <button class="toast-close" aria-label="Close">&times;</button>
    `;
    this._container.appendChild(el);
    requestAnimationFrame(() => el.classList.add('toast-visible'));

    const dismiss = () => {
      el.classList.remove('toast-visible');
      el.classList.add('toast-hiding');
      setTimeout(() => el.remove(), 320);
    };

    el.querySelector('.toast-close').addEventListener('click', dismiss);
    setTimeout(dismiss, duration);
  },

  success(msg, duration) { this.show(msg, 'success', duration); },
  error(msg, duration)   { this.show(msg, 'error',   duration); },
  warning(msg, duration) { this.show(msg, 'warning',  duration); },
  info(msg, duration)    { this.show(msg, 'info',     duration); }
};
