// Werkzeugkasten. Alles rechnet im Browser, keine Eingabe geht an den Server.

import { $, $$, esc, formatNumber, icon } from '../lib.js';

const TABS = [
  ['kodierer', 'code', 'Kodierer'],
  ['hash', 'hash', 'Hash-Rechner'],
  ['subnetz', 'netz', 'Subnetzrechner'],
  ['passwort', 'key', 'Passwort-Check'],
  ['ports', 'liste', 'Port-Lexikon'],
  ['status', 'globe', 'HTTP-Statuscodes'],
];

const PORTS = [
  [20, 'TCP', 'FTP (Daten)', 'Dateiübertragung, unverschlüsselt'],
  [21, 'TCP', 'FTP (Steuerung)', 'Dateiübertragung, unverschlüsselt'],
  [22, 'TCP', 'SSH', 'Verschlüsselter Fernzugang und Dateitransfer'],
  [23, 'TCP', 'Telnet', 'Fernzugang im Klartext, veraltet'],
  [25, 'TCP', 'SMTP', 'Mailversand zwischen Servern'],
  [53, 'UDP/TCP', 'DNS', 'Namensauflösung'],
  [67, 'UDP', 'DHCP (Server)', 'Automatische Vergabe von IP-Adressen'],
  [68, 'UDP', 'DHCP (Client)', 'Automatische Vergabe von IP-Adressen'],
  [80, 'TCP', 'HTTP', 'Web, unverschlüsselt'],
  [88, 'TCP/UDP', 'Kerberos', 'Anmeldung in Windows-Domänen'],
  [110, 'TCP', 'POP3', 'Mailabruf, unverschlüsselt'],
  [123, 'UDP', 'NTP', 'Zeitsynchronisation'],
  [135, 'TCP', 'MS-RPC', 'Windows-Dienste'],
  [139, 'TCP', 'NetBIOS', 'Ältere Windows-Dateifreigaben'],
  [143, 'TCP', 'IMAP', 'Mailabruf, unverschlüsselt'],
  [161, 'UDP', 'SNMP', 'Überwachung von Netzwerkgeräten'],
  [389, 'TCP', 'LDAP', 'Verzeichnisdienst'],
  [443, 'TCP', 'HTTPS', 'Web, verschlüsselt mit TLS'],
  [445, 'TCP', 'SMB', 'Windows-Dateifreigaben'],
  [465, 'TCP', 'SMTPS', 'Mailversand mit TLS'],
  [587, 'TCP', 'SMTP Submission', 'Mailversand vom Mailprogramm'],
  [636, 'TCP', 'LDAPS', 'Verzeichnisdienst mit TLS'],
  [993, 'TCP', 'IMAPS', 'Mailabruf mit TLS'],
  [995, 'TCP', 'POP3S', 'Mailabruf mit TLS'],
  [1433, 'TCP', 'MS SQL Server', 'Datenbank'],
  [1521, 'TCP', 'Oracle', 'Datenbank'],
  [3306, 'TCP', 'MySQL / MariaDB', 'Datenbank'],
  [3389, 'TCP', 'RDP', 'Windows-Fernzugriff'],
  [5432, 'TCP', 'PostgreSQL', 'Datenbank'],
  [5900, 'TCP', 'VNC', 'Fernsteuerung des Bildschirms'],
  [6379, 'TCP', 'Redis', 'Datenspeicher im Arbeitsspeicher'],
  [8080, 'TCP', 'HTTP (alternativ)', 'Web, oft Proxys und Testserver'],
  [8443, 'TCP', 'HTTPS (alternativ)', 'Web, oft Verwaltungsoberflächen'],
  [27017, 'TCP', 'MongoDB', 'Datenbank'],
];

const STATUS = [
  [200, 'OK', 'Die Anfrage war erfolgreich.'],
  [201, 'Created', 'Etwas wurde angelegt, zum Beispiel ein Konto.'],
  [204, 'No Content', 'Erfolg, aber die Antwort hat keinen Inhalt.'],
  [301, 'Moved Permanently', 'Dauerhafte Umleitung auf eine andere Adresse.'],
  [302, 'Found', 'Vorübergehende Umleitung.'],
  [304, 'Not Modified', 'Der Inhalt ist unverändert, der Browser nimmt seine gespeicherte Kopie.'],
  [400, 'Bad Request', 'Die Anfrage ist fehlerhaft aufgebaut.'],
  [401, 'Unauthorized', 'Anmeldung nötig oder fehlgeschlagen.'],
  [403, 'Forbidden', 'Der Zugriff ist verboten, auch mit Anmeldung.'],
  [404, 'Not Found', 'Unter dieser Adresse gibt es nichts.'],
  [405, 'Method Not Allowed', 'Die Methode passt nicht zur Adresse, etwa POST statt GET.'],
  [409, 'Conflict', 'Die Anfrage kollidiert mit dem Bestand, etwa bei einem vergebenen Benutzernamen.'],
  [413, 'Content Too Large', 'Die Anfrage ist zu groß.'],
  [415, 'Unsupported Media Type', 'Das Format der Anfrage wird nicht angenommen.'],
  [429, 'Too Many Requests', 'Zu viele Anfragen in kurzer Zeit.'],
  [500, 'Internal Server Error', 'Auf dem Server ist ein Fehler aufgetreten.'],
  [502, 'Bad Gateway', 'Ein vorgeschalteter Server hat eine ungültige Antwort erhalten.'],
  [503, 'Service Unavailable', 'Der Dienst ist gerade nicht verfügbar.'],
];

const COMMON_WORDS = ['passwort', 'password', '123456', 'qwertz', 'qwerty', 'hallo', 'abc123', 'schatz', 'iloveyou', 'admin', 'letmein', 'welcome', 'willkommen', 'sommer', 'winter', 'fussball', 'dragon', 'monkey', '111111', '000000', 'geheim', 'test', 'ichliebedich'];
const SEQUENCES = ['0123456789', 'abcdefghijklmnopqrstuvwxyz', 'qwertzuiop', 'asdfghjkl', 'yxcvbnm', 'qwertyuiop'];

// --- Kodierer --------------------------------------------------------------------

const toBytes = (text) => new TextEncoder().encode(text);
const fromBytes = (bytes) => new TextDecoder('utf-8', { fatal: true }).decode(bytes);

const CODECS = {
  b64e: (text) => {
    let binary = '';
    for (const byte of toBytes(text)) binary += String.fromCharCode(byte);
    return btoa(binary);
  },
  b64d: (text) => fromBytes(Uint8Array.from(atob(text.replace(/\s+/g, '')), (char) => char.charCodeAt(0))),
  urle: (text) => encodeURIComponent(text),
  urld: (text) => decodeURIComponent(text),
  hexe: (text) => Array.from(toBytes(text), (byte) => byte.toString(16).padStart(2, '0')).join(''),
  hexd: (text) => {
    const clean = text.replace(/\s+/g, '');
    if (clean.length % 2 || /[^0-9a-f]/i.test(clean)) throw new Error('kein Hex');
    return fromBytes(Uint8Array.from(clean.match(/../g) || [], (pair) => parseInt(pair, 16)));
  },
  bin: (text) => Array.from(toBytes(text), (byte) => byte.toString(2).padStart(8, '0')).join(' '),
};

// --- Subnetzrechner ----------------------------------------------------------------

const dotted = (value) => [24, 16, 8, 0].map((shift) => Math.floor(value / 2 ** shift) % 256).join('.');

function addressKind(octets) {
  const [a, b, c] = octets;
  if (a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168)) return 'privat';
  if (a === 127) return 'Loopback (eigener Rechner)';
  if (a === 169 && b === 254) return 'Link-Local';
  if (a === 100 && b >= 64 && b <= 127) return 'geteilter Adressraum der Anbieter';
  if ((a === 192 && b === 0 && c === 2) || (a === 198 && b === 51 && c === 100) || (a === 203 && b === 0 && c === 113)) return 'für Beispiele reserviert';
  if (a === 0 || a >= 240) return 'reserviert';
  if (a >= 224) return 'Multicast';
  return 'öffentlich';
}

/** Rechnet mit normalen Zahlen statt Bit-Operatoren, weil die in JavaScript bei 32 Bit ins Negative kippen. */
function subnet(input) {
  const match = /^\s*(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})\s*\/\s*(\d{1,2})\s*$/.exec(input);
  if (!match) return null;
  const octets = match.slice(1, 5).map(Number);
  const prefix = Number(match[5]);
  if (octets.some((octet) => octet > 255) || prefix > 32) return null;
  const address = octets.reduce((sum, octet) => sum * 256 + octet, 0);
  const size = 2 ** (32 - prefix);
  const network = Math.floor(address / size) * size;
  const broadcast = network + size - 1;
  const pointToPoint = prefix >= 31;
  return {
    prefix,
    bits: octets.map((octet) => octet.toString(2).padStart(8, '0')),
    network: dotted(network),
    mask: dotted(2 ** 32 - size),
    broadcast: pointToPoint ? 'entfällt' : dotted(broadcast),
    first: dotted(pointToPoint ? network : network + 1),
    last: dotted(pointToPoint ? broadcast : broadcast - 1),
    hosts: pointToPoint ? size : size - 2,
    kind: addressKind(octets),
  };
}

function subnetHtml(result) {
  if (!result) return '<p class="err">Erwartet wird eine Angabe wie 192.168.56.10/24.</p>';
  let position = 0;
  const bits = result.bits.map((octet) => `
    <span class="bits-octet">${[...octet].map((bit) => `<span class="bit ${position++ < result.prefix ? 'net' : ''}">${bit}</span>`).join('')}</span>`).join('');
  const rows = [
    ['Netzadresse', `${result.network}/${result.prefix}`],
    ['Subnetzmaske', result.mask],
    ['Broadcast', result.broadcast],
    ['Erster Host', result.first],
    ['Letzter Host', result.last],
    ['Nutzbare Hosts', formatNumber(result.hosts)],
    ['Art der Adresse', result.kind],
  ];
  return `
    <div class="kv">${rows.map(([label, value]) => `<div><span>${label}</span><b>${esc(value)}</b></div>`).join('')}</div>
    <div class="bits" aria-label="Die Adresse in Binärschreibweise">${bits}</div>
    <div class="legend"><span><i class="net"></i>Netzanteil (${result.prefix} Bit)</span><span><i></i>Hostanteil (${32 - result.prefix} Bit)</span></div>`;
}

// --- Passwort-Check ----------------------------------------------------------------

function assess(password) {
  if (!password) return { bits: 0, level: 1, label: 'noch nichts eingegeben', pool: 0, warnings: [] };
  let pool = 0;
  if (/[a-zäöüß]/.test(password)) pool += 26;
  if (/[A-ZÄÖÜ]/.test(password)) pool += 26;
  if (/\d/.test(password)) pool += 10;
  if (/[^A-Za-z0-9äöüßÄÖÜ]/.test(password)) pool += 33;
  let bits = password.length * Math.log2(pool);
  const lower = password.toLowerCase();
  const warnings = [];

  if (COMMON_WORDS.some((word) => lower.includes(word))) {
    warnings.push('Enthält ein sehr häufiges Passwort oder Wort.');
    bits *= 0.4;
  }
  if (/^[A-Za-zäöüßÄÖÜ]+\d{1,4}[^A-Za-z0-9]*$/.test(password)) {
    warnings.push('Folgt dem Muster Wort, Zahl, Sonderzeichen. Solche Muster kommen beim Raten früh an die Reihe.');
    bits *= 0.55;
  }
  if (/(19|20)\d\d/.test(password)) {
    warnings.push('Enthält eine Jahreszahl.');
    bits -= 8;
  }
  if (/(.)\1\1/.test(password)) {
    warnings.push('Enthält dasselbe Zeichen dreimal hintereinander.');
    bits *= 0.8;
  }
  const hasRun = SEQUENCES.some((sequence) => {
    for (let i = 0; i + 4 <= sequence.length; i++) if (lower.includes(sequence.slice(i, i + 4))) return true;
    return false;
  });
  if (hasRun) {
    warnings.push('Enthält eine Zeichenfolge wie 1234 oder qwer.');
    bits *= 0.75;
  }
  if (password.length < 10) warnings.push('Kürzer als 10 Zeichen.');

  bits = Math.max(0, Math.round(bits));
  const level = bits < 35 ? 1 : bits < 55 ? 2 : bits < 75 ? 3 : 4;
  return { bits, level, label: ['', 'schwach', 'mäßig', 'ordentlich', 'stark'][level], pool, warnings };
}

// --- Tabellen ----------------------------------------------------------------------

function tableRows(rows) {
  if (!rows.length) return '<tr><td colspan="4">Kein Eintrag passt zu dieser Suche.</td></tr>';
  return rows.map((row) => `<tr>${row.map((cell, index) => `<td>${index === 0 ? `<b>${cell}</b>` : esc(cell)}</td>`).join('')}</tr>`).join('');
}

function wireFilter(root, inputId, bodyId, rows) {
  $(inputId, root).addEventListener('input', (event) => {
    const query = event.target.value.trim().toLowerCase();
    $(bodyId, root).innerHTML = tableRows(rows.filter((row) => row.join(' ').toLowerCase().includes(query)));
  });
}

// --- Seite -------------------------------------------------------------------------

export function mount(root) {
  root.innerHTML = `
    <section class="wrap page-head">
      <span class="kicker">Werkzeuge</span>
      <h1>Kleine Helfer zum Ausprobieren</h1>
      <p class="lead">Rechnen, umwandeln, nachschlagen. Alle Werkzeuge arbeiten in deinem Browser, keine Eingabe wird an den Server geschickt.</p>
    </section>

    <section class="wrap">
      <div class="tabs" role="tablist" aria-label="Werkzeuge">
        ${TABS.map(([id, symbol, label], index) => `
          <button class="tab" type="button" role="tab" id="tab-${id}" data-tab="${id}" aria-controls="panel-${id}" aria-selected="${index === 0}">${icon(symbol)} ${label}</button>`).join('')}
      </div>

      <div class="tool-panel card" role="tabpanel" id="panel-kodierer" aria-labelledby="tab-kodierer">
        <h2>Kodierer</h2>
        <p>Kodierungen stellen Daten nur anders dar. Sie lassen sich ohne Schlüssel umkehren und schützen nichts.</p>
        <div class="tool-row">
          <label class="field"><span>Verfahren</span>
            <select class="input" id="enc-mode">
              <option value="b64e">Text zu Base64</option>
              <option value="b64d">Base64 zu Text</option>
              <option value="urle">Text zu URL-Kodierung</option>
              <option value="urld">URL-Kodierung zu Text</option>
              <option value="hexe">Text zu Hex</option>
              <option value="hexd">Hex zu Text</option>
              <option value="bin">Text zu Binär</option>
            </select>
          </label>
        </div>
        <div class="tool-grid">
          <label class="field"><span>Eingabe</span><textarea class="input" id="enc-in" spellcheck="false">Hallo</textarea></label>
          <label class="field"><span>Ergebnis</span><textarea class="input" id="enc-out" readonly></textarea></label>
        </div>
      </div>

      <div class="tool-panel card" role="tabpanel" id="panel-hash" aria-labelledby="tab-hash" hidden>
        <h2>Hash-Rechner</h2>
        <p>Eine Hashfunktion berechnet aus beliebigem Text einen Wert fester Länge. Ändere einen einzigen Buchstaben und vergleiche das Ergebnis.</p>
        <label class="field"><span>Text</span><input class="input input-mono" id="hash-in" value="Hallo" spellcheck="false" autocomplete="off"></label>
        <div class="field"><span>SHA-256 (64 Hex-Zeichen)</span><div class="tool-out" id="hash-256"></div></div>
        <div class="field"><span>SHA-512 (128 Hex-Zeichen)</span><div class="tool-out" id="hash-512"></div></div>
        <div class="field"><span>SHA-1 (40 Hex-Zeichen, gilt als gebrochen)</span><div class="tool-out" id="hash-1"></div></div>
      </div>

      <div class="tool-panel card" role="tabpanel" id="panel-subnetz" aria-labelledby="tab-subnetz" hidden>
        <h2>Subnetzrechner</h2>
        <p>Gib eine IPv4-Adresse mit Präfixlänge ein. Der Rechner zeigt das zugehörige Netz und welche Bits zum Netzanteil gehören.</p>
        <label class="field"><span>Adresse in CIDR-Schreibweise</span><input class="input input-mono" id="net-in" value="192.168.56.10/24" spellcheck="false" autocomplete="off"></label>
        <div id="net-out"></div>
      </div>

      <div class="tool-panel card" role="tabpanel" id="panel-passwort" aria-labelledby="tab-passwort" hidden>
        <h2>Passwort-Check</h2>
        <p>Schätzt, wie groß der Suchraum einer Eingabe ist. Gerechnet wird nur in deinem Browser, nichts wird gesendet oder gespeichert. Tippe trotzdem kein echtes Passwort ein, das ist eine gute Gewohnheit.</p>
        <div class="pw-wrap">
          <input class="input input-mono" id="pw-in" type="password" autocomplete="off" spellcheck="false" placeholder="Probiere etwas aus" aria-label="Testeingabe">
          <button class="btn btn-ghost" id="pw-toggle" type="button">Anzeigen</button>
        </div>
        <div class="meter" id="pw-meter" data-level="1"><i></i></div>
        <div class="kv">
          <div><span>Einschätzung</span><b id="pw-label"></b></div>
          <div><span>Länge</span><b id="pw-length"></b></div>
          <div><span>Zeichenvorrat</span><b id="pw-pool"></b></div>
          <div><span>Geschätzte Entropie</span><b id="pw-bits"></b></div>
        </div>
        <ul class="warn-list" id="pw-warn"></ul>
        <p class="hint">Die Schätzung nimmt zufällig gewählte Zeichen an und zieht für erkannte Muster etwas ab. Echte Wörter und persönliche Angaben sind schwächer, als die Zahl vermuten lässt.</p>
      </div>

      <div class="tool-panel card" role="tabpanel" id="panel-ports" aria-labelledby="tab-ports" hidden>
        <h2>Port-Lexikon</h2>
        <p>Die Standardports verbreiteter Dienste. Ein Dienst kann auch auf einem anderen Port laufen, der Standard ist nur eine Vereinbarung.</p>
        <label class="search">${icon('search')}<input class="input" id="port-search" type="search" placeholder="Port oder Dienst suchen" aria-label="Port-Lexikon durchsuchen" autocomplete="off"></label>
        <div class="table-wrap"><table>
          <thead><tr><th>Port</th><th>Protokoll</th><th>Dienst</th><th>Zweck</th></tr></thead>
          <tbody id="port-body">${tableRows(PORTS)}</tbody>
        </table></div>
      </div>

      <div class="tool-panel card" role="tabpanel" id="panel-status" aria-labelledby="tab-status" hidden>
        <h2>HTTP-Statuscodes</h2>
        <p>Die erste Ziffer nennt die Klasse: 2 Erfolg, 3 Umleitung, 4 Fehler beim Client, 5 Fehler beim Server. Viele dieser Codes verwendet diese Plattform selbst. Drücke F12, öffne den Reiter Netzwerk und beobachte sie.</p>
        <label class="search">${icon('search')}<input class="input" id="status-search" type="search" placeholder="Code oder Bedeutung suchen" aria-label="Statuscodes durchsuchen" autocomplete="off"></label>
        <div class="table-wrap"><table>
          <thead><tr><th>Code</th><th>Name</th><th>Bedeutung</th></tr></thead>
          <tbody id="status-body">${tableRows(STATUS)}</tbody>
        </table></div>
      </div>
    </section>`;

  // Reiter
  $('.tabs', root).addEventListener('click', (event) => {
    const tab = event.target.closest('.tab');
    if (!tab) return;
    for (const other of $$('.tab', root)) other.setAttribute('aria-selected', String(other === tab));
    for (const panel of $$('.tool-panel', root)) panel.hidden = panel.id !== `panel-${tab.dataset.tab}`;
  });

  // Kodierer
  const encode = () => {
    try {
      $('#enc-out', root).value = CODECS[$('#enc-mode', root).value]($('#enc-in', root).value);
    } catch {
      $('#enc-out', root).value = 'Diese Eingabe lässt sich mit dem gewählten Verfahren nicht umwandeln.';
    }
  };
  $('#enc-mode', root).addEventListener('change', encode);
  $('#enc-in', root).addEventListener('input', encode);
  encode();

  // Hash-Rechner
  let hashRun = 0;
  const hash = async () => {
    const targets = [['SHA-256', '#hash-256'], ['SHA-512', '#hash-512'], ['SHA-1', '#hash-1']];
    if (!window.crypto?.subtle) {
      for (const [, id] of targets) $(id, root).textContent = 'Der Hash-Rechner braucht localhost oder HTTPS.';
      return;
    }
    const run = ++hashRun;
    const bytes = toBytes($('#hash-in', root).value);
    for (const [algorithm, id] of targets) {
      const digest = await crypto.subtle.digest(algorithm, bytes);
      if (run !== hashRun) return; // inzwischen wurde weitergetippt
      $(id, root).textContent = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
    }
  };
  $('#hash-in', root).addEventListener('input', hash);
  hash();

  // Subnetzrechner
  const calculate = () => {
    $('#net-out', root).innerHTML = subnetHtml(subnet($('#net-in', root).value));
  };
  $('#net-in', root).addEventListener('input', calculate);
  calculate();

  // Passwort-Check
  const check = () => {
    const value = $('#pw-in', root).value;
    const result = assess(value);
    const meter = $('#pw-meter', root);
    meter.dataset.level = result.level;
    meter.style.setProperty('--p', Math.min(100, (result.bits / 90) * 100));
    $('#pw-label', root).textContent = result.label;
    $('#pw-length', root).textContent = `${value.length} Zeichen`;
    $('#pw-pool', root).textContent = result.pool ? `${result.pool} mögliche Zeichen` : '–';
    $('#pw-bits', root).textContent = value ? `etwa ${result.bits} Bit` : '–';
    $('#pw-warn', root).replaceChildren(...result.warnings.map((text) => {
      const item = document.createElement('li');
      item.textContent = text;
      return item;
    }));
  };
  $('#pw-in', root).addEventListener('input', check);
  $('#pw-toggle', root).addEventListener('click', (event) => {
    const field = $('#pw-in', root);
    const reveal = field.type === 'password';
    field.type = reveal ? 'text' : 'password';
    event.target.textContent = reveal ? 'Verbergen' : 'Anzeigen';
  });
  check();

  // Tabellen
  wireFilter(root, '#port-search', '#port-body', PORTS);
  wireFilter(root, '#status-search', '#status-body', STATUS);
}
