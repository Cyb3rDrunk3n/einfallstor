// Anmelden und Konto erstellen

import { $, api, setMe, store, toast } from '../lib.js';

function showError(root, message) {
  const box = $('#form-error', root);
  box.textContent = message;
  box.classList.add('show');
}

/** Verdrahtet ein Formular: prüfen, abschicken, bei Erfolg zum Kurs wechseln. */
function wire(root, endpoint, check, welcome) {
  const form = $('#auth-form', root);
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const fields = new FormData(form);
    const body = { username: String(fields.get('username')).trim(), password: String(fields.get('password')) };
    if (endpoint === '/register') body.accept = fields.get('accept') === 'on';
    const problem = check(body);
    if (problem) {
      showError(root, problem);
      return;
    }
    const button = $('button[type="submit"]', form);
    button.disabled = true;
    try {
      const data = await api(endpoint, body);
      setMe(data.user);
      toast(welcome(data.user), 'ok');
      location.hash = '#/kurs';
    } catch (error) {
      showError(root, error.message);
    } finally {
      button.disabled = false;
    }
  });
  $('input[name="username"]', form).focus();
}

export const login = {
  mount(root) {
    if (store.me) {
      location.hash = '#/profil';
      return;
    }
    root.innerHTML = `
      <section class="wrap auth">
        <form class="auth-card card" id="auth-form" novalidate>
          <h1>Anmelden</h1>
          <p>Mit deinem Konto bleiben Punkte und Fortschritt erhalten.</p>
          <div class="form-error" id="form-error" role="alert"></div>
          <label class="field"><span>Benutzername</span>
            <input class="input" name="username" autocomplete="username" maxlength="20" autocapitalize="none" spellcheck="false" required>
          </label>
          <label class="field"><span>Passwort</span>
            <input class="input" type="password" name="password" autocomplete="current-password" maxlength="128" required>
          </label>
          <button class="btn btn-primary btn-lg" type="submit">Anmelden</button>
          <p class="auth-alt">Noch kein Konto? <a href="#/registrieren">Konto erstellen</a></p>
        </form>
      </section>`;
    wire(
      root,
      '/login',
      (body) => (!body.username || !body.password ? 'Bitte gib Benutzername und Passwort ein.' : null),
      (user) => `Angemeldet als ${user.name}`,
    );
  },
};

export const register = {
  mount(root) {
    if (store.me) {
      location.hash = '#/profil';
      return;
    }
    root.innerHTML = `
      <section class="wrap auth">
        <form class="auth-card card" id="auth-form" novalidate>
          <h1>Konto erstellen</h1>
          <p>Ein Name und ein Passwort genügen. Eine E-Mail-Adresse wird nicht gebraucht.</p>
          <div class="form-error" id="form-error" role="alert"></div>
          <label class="field"><span>Benutzername</span>
            <input class="input" name="username" autocomplete="username" maxlength="20" autocapitalize="none" spellcheck="false" required>
            <small>3 bis 20 Zeichen: Buchstaben, Ziffern, Bindestrich, Unterstrich. Er erscheint in der Rangliste.</small>
          </label>
          <label class="field"><span>Passwort</span>
            <input class="input" type="password" name="password" autocomplete="new-password" maxlength="128" required>
            <small>Mindestens 10 Zeichen. Am besten erzeugt es dein Passwortmanager.</small>
          </label>
          <label class="check">
            <input type="checkbox" name="accept">
            <span>Ich nutze das Gelernte nur an eigenen Systemen oder mit schriftlicher Erlaubnis und halte mich an den <a href="#/kodex">Kodex</a>.</span>
          </label>
          <button class="btn btn-primary btn-lg" type="submit">Konto erstellen</button>
          <p class="auth-alt">Schon dabei? <a href="#/anmelden">Anmelden</a></p>
          <p class="auth-alt hint">Ohne E-Mail-Adresse gibt es kein „Passwort vergessen“. Bewahre das Passwort gut auf.</p>
        </form>
      </section>`;
    wire(
      root,
      '/register',
      (body) => {
        if (!/^[A-Za-z0-9_-]{3,20}$/.test(body.username)) return 'Der Benutzername braucht 3 bis 20 Zeichen: Buchstaben, Ziffern, Bindestrich oder Unterstrich.';
        if (body.password.length < 10) return 'Das Passwort braucht mindestens 10 Zeichen.';
        if (!body.accept) return 'Bitte bestätige den Kodex.';
        return null;
      },
      (user) => `Willkommen, ${user.name}`,
    );
  },
};
