// Simulierte Linux-Shell für das Übungsterminal.
//
// Reine Logik ohne DOM: ein Dateisystem im Arbeitsspeicher, Befehle, Pipes und
// Vervollständigung. Es gibt kein echtes System dahinter und kein Netzwerk,
// nichts davon verlässt den Browser.

const DATE = 'Nov  3 09:12';
const encoder = new TextEncoder();

const MISSING = 'Datei oder Verzeichnis nicht gefunden';
const DENIED = 'Keine Berechtigung';

const NO_NETWORK = new Set(['ssh', 'scp', 'curl', 'wget', 'nc', 'telnet', 'ftp', 'dig', 'nslookup', 'whois', 'traceroute', 'nmap']);
const NO_EDITOR = new Set(['nano', 'vi', 'vim', 'emacs', 'less', 'more']);

const ok = (out = []) => ({ out });
const fail = (...err) => ({ out: [], err });
const byName = (a, b) => a.name.localeCompare(b.name);

// --- Dateisystem -----------------------------------------------------------------

function makeDir(name, mode, owner) {
  return { type: 'dir', name, mode, owner, children: new Map() };
}

/** Baut aus der flachen Liste des Servers einen Verzeichnisbaum. */
function buildTree(data) {
  const home = `/home/${data.user}`;
  const ownerOf = (path) => (path === home || path.startsWith(`${home}/`) ? data.user : 'root');
  const root = makeDir('', 'rwxr-xr-x', 'root');

  function ensureDir(path) {
    let node = root;
    let current = '';
    for (const segment of path.split('/').filter(Boolean)) {
      current += `/${segment}`;
      if (!node.children.has(segment)) {
        const meta = data.dirs?.[current] || {};
        node.children.set(segment, makeDir(segment, meta.mode || 'rwxr-xr-x', meta.owner || ownerOf(current)));
      }
      node = node.children.get(segment);
    }
    return node;
  }

  Object.keys(data.dirs || {}).forEach(ensureDir);
  for (const [path, meta] of Object.entries(data.files)) {
    const cut = path.lastIndexOf('/');
    const name = path.slice(cut + 1);
    ensureDir(path.slice(0, cut)).children.set(name, {
      type: 'file',
      name,
      mode: meta.mode || 'rw-r--r--',
      owner: meta.owner || ownerOf(path),
      lines: [...meta.lines],
    });
  }
  return root;
}

const sizeOf = (node) => (node.type === 'dir' ? 4096 : encoder.encode(node.lines.join('\n')).length + 1);

// --- Eingabe zerlegen --------------------------------------------------------------

/** Zerlegt eine Zeile in Pipe-Abschnitte aus Wörtern. Anführungszeichen halten Wörter zusammen. */
function tokenize(line) {
  const segments = [[]];
  let text = '';
  let quote = null;
  let started = false;
  let quoted = false;
  const push = () => {
    if (started) segments[segments.length - 1].push({ text, quoted });
    text = '';
    started = false;
    quoted = false;
  };
  for (const char of line) {
    if (quote) {
      if (char === quote) quote = null;
      else text += char;
    } else if (char === '"' || char === "'") {
      quote = char;
      started = true;
      quoted = true;
    } else if (char === ' ' || char === '\t') {
      push();
    } else if (char === '|') {
      push();
      segments.push([]);
    } else if ('<>;&'.includes(char)) {
      throw new Error('Umleitungen und Befehlsketten mit < > ; & gibt es in dieser Simulation nicht. Pipes mit | funktionieren.');
    } else {
      text += char;
      started = true;
    }
  }
  if (quote) throw new Error('Ein Anführungszeichen ist nicht geschlossen.');
  push();
  return segments;
}

function globToRegex(pattern, ignoreCase = false) {
  const source = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.');
  return new RegExp(`^${source}$`, ignoreCase ? 'i' : '');
}

/** Trennt Optionen wie -la von den übrigen Argumenten. */
function parseFlags(args, allowed) {
  const flags = new Set();
  const rest = [];
  let bad = null;
  for (const arg of args) {
    if (arg.length > 1 && arg.startsWith('-') && !/^-\d/.test(arg)) {
      for (const char of arg.slice(1)) {
        if (allowed.includes(char)) flags.add(char);
        else bad = bad || char;
      }
    } else {
      rest.push(arg);
    }
  }
  return { flags, rest, bad };
}

/** Liest -n 5, -n5 oder -5 für head und tail. */
function parseCount(args) {
  let count = 10;
  const rest = [];
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '-n') count = Number(args[++i]);
    else if (/^-n\d+$/.test(arg)) count = Number(arg.slice(2));
    else if (/^-\d+$/.test(arg)) count = Number(arg.slice(1));
    else rest.push(arg);
  }
  return { count, rest };
}

function applyMode(current, spec) {
  if (/^[0-7]{3}$/.test(spec)) {
    return [...spec]
      .map((digit) => (digit & 4 ? 'r' : '-') + (digit & 2 ? 'w' : '-') + (digit & 1 ? 'x' : '-'))
      .join('');
  }
  const match = /^([ugoa]*)([+\-=])([rwx]+)$/.exec(spec);
  if (!match) return null;
  const who = match[1] || 'a';
  const chars = [...current];
  for (const [key, offset] of [['u', 0], ['g', 3], ['o', 6]]) {
    if (!who.includes(key) && !who.includes('a')) continue;
    ['r', 'w', 'x'].forEach((right, index) => {
      const named = match[3].includes(right);
      if (match[2] === '+' && named) chars[offset + index] = right;
      if (match[2] === '-' && named) chars[offset + index] = '-';
      if (match[2] === '=') chars[offset + index] = named ? right : '-';
    });
  }
  return chars.join('');
}

// --- Handbuch ----------------------------------------------------------------------

const MAN = {
  ls: ['ls [-l] [-a] [PFAD ...]', 'Listet den Inhalt von Verzeichnissen auf.', '  -l  ausführlich: Rechte, Besitzer, Größe', '  -a  auch versteckte Einträge (Name beginnt mit einem Punkt)', 'Beispiel: ls -la /etc'],
  cd: ['cd [PFAD]', 'Wechselt das Verzeichnis. Ohne Angabe geht es ins Home-Verzeichnis.', 'Beispiele: cd projekte    cd ..    cd /var/log    cd ~'],
  pwd: ['pwd', 'Zeigt das aktuelle Verzeichnis als absoluten Pfad.'],
  cat: ['cat [-n] DATEI ...', 'Gibt den Inhalt von Dateien aus.', '  -n  Zeilen nummerieren'],
  head: ['head [-n ZAHL] [DATEI]', 'Zeigt die ersten Zeilen, ohne Angabe zehn.', 'Beispiel: head -n 3 /var/log/auth.log'],
  tail: ['tail [-n ZAHL] [DATEI]', 'Zeigt die letzten Zeilen, ohne Angabe zehn.', 'Beispiel: tail -n 1 inventar.csv'],
  grep: ['grep [-i] [-n] [-c] [-v] [-r] MUSTER [DATEI ...]', 'Gibt die Zeilen aus, die das Muster enthalten.', '  -i  Groß- und Kleinschreibung ignorieren', '  -n  Zeilennummern anzeigen', '  -c  nur die Anzahl der Treffer', '  -v  Zeilen ohne das Muster', '  -r  Verzeichnisse samt Unterverzeichnissen durchsuchen', 'Beispiel: grep -i "failed" /var/log/auth.log'],
  find: ['find [START] [-name MUSTER] [-iname MUSTER] [-type f|d]', 'Durchsucht einen Verzeichnisbaum nach Namen oder Typ.', 'Im Muster steht * für beliebig viele Zeichen. Setze das Muster in Anführungszeichen.', 'Beispiel: find /etc -name "*.conf"'],
  wc: ['wc [-l] [-w] [-c] [DATEI ...]', 'Zählt Zeilen (-l), Wörter (-w) und Bytes (-c).', 'Beispiel: grep Failed /var/log/auth.log | wc -l'],
  sort: ['sort [-r] [-n] [-u] [DATEI]', 'Sortiert Zeilen. -r absteigend, -n nach Zahlenwert, -u ohne Doppelte.'],
  uniq: ['uniq [-c] [DATEI]', 'Fasst gleiche aufeinanderfolgende Zeilen zusammen. -c zählt sie.', 'Meist nach sort verwendet: sort datei | uniq -c'],
  chmod: ['chmod RECHTE DATEI ...', 'Ändert die Rechte einer Datei, die dir gehört.', 'Als Zahl: chmod 600 notiz.txt', 'Symbolisch: chmod o-r notiz.txt nimmt allen anderen das Leserecht.'],
  echo: ['echo TEXT', 'Gibt den Text aus.'],
  man: ['man BEFEHL', 'Zeigt die Kurzanleitung zu einem Befehl.'],
};

// --- Befehle -----------------------------------------------------------------------

/** Sammelt Eingabezeilen aus Dateien oder aus der Pipe. */
function readInputs(sh, name, files, stdin) {
  const sources = [];
  const err = [];
  if (!files.length) {
    if (stdin) sources.push({ label: '', lines: stdin });
    else err.push(`${name}: Es fehlt eine Datei. Beispiel: ${name} datei.txt`);
    return { sources, err };
  }
  for (const file of files) {
    const { node, error } = sh.lookup(file);
    if (error) err.push(`${name}: ${file}: ${error}`);
    else if (node.type === 'dir') err.push(`${name}: ${file}: Ist ein Verzeichnis`);
    else if (!sh.can(node, 'r')) err.push(`${name}: ${file}: ${DENIED}`);
    else sources.push({ label: file, lines: node.lines });
  }
  return { sources, err };
}

const COMMANDS = {
  help: {
    help: 'diese Übersicht',
    run() {
      return ok([
        'Verfügbare Befehle:',
        ...Object.entries(COMMANDS).map(([name, command]) => `  ${name.padEnd(9)}${command.help}`),
        `  ${'clear'.padEnd(9)}Bildschirm leeren`,
        `  ${'reset'.padEnd(9)}Dateisystem in den Ausgangszustand versetzen`,
        '',
        'Pipes funktionieren:  grep Failed /var/log/auth.log | wc -l',
        'Tab vervollständigt, die Pfeiltasten holen frühere Befehle zurück.',
      ]);
    },
  },

  man: {
    help: 'Kurzanleitung zu einem Befehl',
    run(sh, args) {
      const name = args[0];
      if (!name) return fail('Aufruf: man BEFEHL, zum Beispiel man grep');
      if (MAN[name]) return ok(['AUFRUF', `  ${MAN[name][0]}`, '', 'BESCHREIBUNG', ...MAN[name].slice(1).map((line) => `  ${line}`)]);
      if (COMMANDS[name]) return ok([`${name}: ${COMMANDS[name].help}`]);
      return fail(`Kein Handbucheintrag für ${name}`);
    },
  },

  pwd: { help: 'aktuelles Verzeichnis anzeigen', run: (sh) => ok([sh.cwd]) },

  cd: {
    help: 'Verzeichnis wechseln',
    run(sh, args) {
      const target = args[0] ?? '~';
      const { node, abs, error } = sh.lookup(target);
      if (error) return fail(`cd: ${target}: ${error}`);
      if (node.type !== 'dir') return fail(`cd: ${target}: Ist kein Verzeichnis`);
      if (!sh.can(node, 'x')) return fail(`cd: ${target}: ${DENIED}`);
      sh.cwd = abs;
      return ok();
    },
  },

  ls: {
    help: 'Verzeichnisinhalt auflisten (-l ausführlich, -a auch Verstecktes)',
    run(sh, args, stdin, ctx) {
      const { flags, rest, bad } = parseFlags(args, 'lah1F');
      if (bad) return fail(`ls: Unbekannte Option -${bad}. Siehe man ls`);
      const targets = rest.length ? rest : ['.'];
      const out = [];
      const rich = [];
      const err = [];
      const style = (node) => (node.type === 'dir' ? 't-dir' : node.mode.includes('x') ? 't-exec' : '');
      const longRow = (node, label) => {
        const head = `${node.type === 'dir' ? 'd' : '-'}${node.mode} 1 ${node.owner.padEnd(8)} ${node.owner.padEnd(8)} ${String(sizeOf(node)).padStart(5)} ${DATE} `;
        out.push(head + label);
        rich.push([[head, ''], [label, style(node)]]);
      };
      for (const target of targets) {
        const { node, error } = sh.lookup(target);
        if (error) {
          err.push(`ls: Zugriff auf '${target}' nicht möglich: ${error}`);
          continue;
        }
        if (node.type === 'file') {
          if (flags.has('l')) longRow(node, target);
          else {
            out.push(target);
            rich.push([[target, style(node)]]);
          }
          continue;
        }
        if (!sh.can(node, 'r')) {
          err.push(`ls: Öffnen von Verzeichnis '${target}' nicht möglich: ${DENIED}`);
          continue;
        }
        if (targets.length > 1) {
          out.push(`${target}:`);
          rich.push([[`${target}:`, 't-dim']]);
        }
        const entries = [...node.children.values()].filter((child) => flags.has('a') || !child.name.startsWith('.')).sort(byName);
        if (flags.has('l')) {
          if (flags.has('a')) longRow(node, '.');
          entries.forEach((child) => longRow(child, child.name));
        } else if (entries.length) {
          out.push(...entries.map((child) => child.name));
          rich.push(entries.flatMap((child, index) => (index ? [['  ', ''], [child.name, style(child)]] : [[child.name, style(child)]])));
        }
      }
      return { out, err, rich: ctx.piped ? null : rich };
    },
  },

  cat: {
    help: 'Dateiinhalt ausgeben',
    run(sh, args, stdin) {
      const { flags, rest, bad } = parseFlags(args, 'n');
      if (bad) return fail(`cat: Unbekannte Option -${bad}`);
      const { sources, err } = readInputs(sh, 'cat', rest, stdin);
      let lines = sources.flatMap((source) => source.lines);
      if (flags.has('n')) lines = lines.map((line, index) => `${String(index + 1).padStart(6)}  ${line}`);
      return { out: lines, err };
    },
  },

  head: {
    help: 'die ersten Zeilen zeigen (-n ZAHL)',
    run(sh, args, stdin) {
      const { count, rest } = parseCount(args);
      if (!Number.isInteger(count) || count < 0) return fail('head: Ungültige Zeilenzahl');
      const { sources, err } = readInputs(sh, 'head', rest, stdin);
      return { out: sources.flatMap((source) => source.lines.slice(0, count)), err };
    },
  },

  tail: {
    help: 'die letzten Zeilen zeigen (-n ZAHL)',
    run(sh, args, stdin) {
      const { count, rest } = parseCount(args);
      if (!Number.isInteger(count) || count < 0) return fail('tail: Ungültige Zeilenzahl');
      const { sources, err } = readInputs(sh, 'tail', rest, stdin);
      return { out: sources.flatMap((source) => (count ? source.lines.slice(-count) : [])), err };
    },
  },

  grep: {
    help: 'Zeilen mit einem Muster suchen (-i -n -c -v -r)',
    run(sh, args, stdin) {
      const { flags, rest, bad } = parseFlags(args, 'incvr');
      if (bad) return fail(`grep: Unbekannte Option -${bad}. Siehe man grep`);
      if (!rest.length) return fail('Aufruf: grep [-i] [-n] [-c] [-v] [-r] MUSTER [DATEI ...]');
      const [pattern, ...targets] = rest;
      const mode = flags.has('i') ? 'i' : '';
      let regex;
      try {
        regex = new RegExp(pattern, mode);
      } catch {
        regex = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), mode);
      }
      const sources = [];
      const err = [];
      if (!targets.length) {
        if (stdin) sources.push({ label: '', lines: stdin });
        else if (flags.has('r')) targets.push('.');
        else return fail('grep: Es fehlt eine Datei. Beispiel: grep Muster datei.txt');
      }
      for (const target of targets) {
        const { node, error } = sh.lookup(target);
        if (error) err.push(`grep: ${target}: ${error}`);
        else if (node.type === 'file') {
          if (sh.can(node, 'r')) sources.push({ label: target, lines: node.lines });
          else err.push(`grep: ${target}: ${DENIED}`);
        } else if (!flags.has('r')) err.push(`grep: ${target}: Ist ein Verzeichnis`);
        else {
          sh.walk(node, target.length > 1 ? target.replace(/\/+$/, '') : target, (child, path) => {
            if (child.type !== 'file') return;
            if (sh.can(child, 'r')) sources.push({ label: path, lines: child.lines });
            else err.push(`grep: ${path}: ${DENIED}`);
          }, (path) => err.push(`grep: ${path}: ${DENIED}`));
        }
      }
      const labeled = sources.length > 1 || (flags.has('r') && targets.length > 0);
      const out = [];
      for (const { label, lines } of sources) {
        const prefix = labeled ? `${label}:` : '';
        let count = 0;
        lines.forEach((line, index) => {
          if (regex.test(line) === flags.has('v')) return;
          count++;
          if (!flags.has('c')) out.push(prefix + (flags.has('n') ? `${index + 1}:` : '') + line);
        });
        if (flags.has('c')) out.push(prefix + count);
      }
      return { out, err };
    },
  },

  find: {
    help: 'Dateien suchen (-name MUSTER, -type f|d)',
    run(sh, args) {
      const starts = [];
      let index = 0;
      while (index < args.length && !args[index].startsWith('-')) starts.push(args[index++]);
      if (!starts.length) starts.push('.');
      const tests = [];
      for (; index < args.length; index++) {
        const option = args[index];
        const value = args[++index];
        if (option === '-name' || option === '-iname') {
          if (value === undefined) return fail(`find: Nach ${option} fehlt ein Muster`);
          const regex = globToRegex(value, option === '-iname');
          tests.push((node) => regex.test(node.name));
        } else if (option === '-type') {
          if (value !== 'f' && value !== 'd') return fail('find: -type erwartet f (Datei) oder d (Verzeichnis)');
          tests.push((node) => node.type === (value === 'f' ? 'file' : 'dir'));
        } else {
          return fail(`find: Unbekannte Option ${option}. Unterstützt werden -name, -iname und -type`);
        }
      }
      const out = [];
      const err = [];
      for (const start of starts) {
        const { node, error } = sh.lookup(start);
        if (error) {
          err.push(`find: '${start}': ${error}`);
          continue;
        }
        sh.walk(node, start.length > 1 ? start.replace(/\/+$/, '') : start, (child, path) => {
          if (tests.every((test) => test(child))) out.push(path);
        }, (path) => err.push(`find: '${path}': ${DENIED}`));
      }
      return { out, err };
    },
  },

  wc: {
    help: 'Zeilen, Wörter und Bytes zählen (-l -w -c)',
    run(sh, args, stdin) {
      const { flags, rest, bad } = parseFlags(args, 'lwc');
      if (bad) return fail(`wc: Unbekannte Option -${bad}`);
      const { sources, err } = readInputs(sh, 'wc', rest, stdin);
      const all = !flags.size;
      const out = sources.map(({ label, lines }) => {
        const counts = [];
        if (all || flags.has('l')) counts.push(lines.length);
        if (all || flags.has('w')) counts.push(lines.join(' ').split(/\s+/).filter(Boolean).length);
        if (all || flags.has('c')) counts.push(encoder.encode(lines.join('\n')).length + (lines.length ? 1 : 0));
        return `${counts.join(' ')}${label ? ` ${label}` : ''}`;
      });
      return { out, err };
    },
  },

  sort: {
    help: 'Zeilen sortieren (-r -n -u)',
    run(sh, args, stdin) {
      const { flags, rest, bad } = parseFlags(args, 'rnu');
      if (bad) return fail(`sort: Unbekannte Option -${bad}`);
      const { sources, err } = readInputs(sh, 'sort', rest, stdin);
      let lines = sources.flatMap((source) => source.lines);
      lines.sort(flags.has('n') ? (a, b) => (parseFloat(a) || 0) - (parseFloat(b) || 0) : (a, b) => a.localeCompare(b));
      if (flags.has('r')) lines.reverse();
      if (flags.has('u')) lines = [...new Set(lines)];
      return { out: lines, err };
    },
  },

  uniq: {
    help: 'gleiche Nachbarzeilen zusammenfassen (-c zählt)',
    run(sh, args, stdin) {
      const { flags, rest, bad } = parseFlags(args, 'c');
      if (bad) return fail(`uniq: Unbekannte Option -${bad}`);
      const { sources, err } = readInputs(sh, 'uniq', rest, stdin);
      const groups = [];
      for (const line of sources.flatMap((source) => source.lines)) {
        const last = groups[groups.length - 1];
        if (last && last.line === line) last.count++;
        else groups.push({ line, count: 1 });
      }
      return { out: groups.map(({ line, count }) => (flags.has('c') ? `${String(count).padStart(7)} ${line}` : line)), err };
    },
  },

  echo: { help: 'Text ausgeben', run: (sh, args) => ok([args.join(' ')]) },

  chmod: {
    help: 'Rechte einer eigenen Datei ändern',
    run(sh, args) {
      if (args.length < 2) return fail('Aufruf: chmod RECHTE DATEI, zum Beispiel chmod 600 notiz.txt');
      const [spec, ...files] = args;
      const err = [];
      for (const file of files) {
        const { node, error } = sh.lookup(file);
        if (error) {
          err.push(`chmod: Zugriff auf '${file}' nicht möglich: ${error}`);
          continue;
        }
        if (node.owner !== sh.user) {
          err.push(`chmod: Beim Ändern der Rechte von '${file}': Die Operation ist nicht erlaubt`);
          continue;
        }
        const mode = applyMode(node.mode, spec);
        if (!mode) return fail(`chmod: Ungültige Rechteangabe: '${spec}'`);
        node.mode = mode;
      }
      return { out: [], err };
    },
  },

  touch: {
    help: 'leere Datei anlegen',
    run: (sh, args) => (args.length ? sh.create(args, 'file', 'touch') : fail('Aufruf: touch DATEI')),
  },

  mkdir: {
    help: 'Verzeichnis anlegen',
    run: (sh, args) => (args.length ? sh.create(args, 'dir', 'mkdir') : fail('Aufruf: mkdir VERZEICHNIS')),
  },

  rm: {
    help: 'Datei löschen',
    run(sh, args) {
      if (!args.length) return fail('Aufruf: rm DATEI');
      const err = [];
      for (const target of args.filter((arg) => !arg.startsWith('-'))) {
        const { node, abs, error } = sh.lookup(target);
        if (error) err.push(`rm: '${target}' kann nicht entfernt werden: ${error}`);
        else if (node.type === 'dir') err.push(`rm: '${target}' kann nicht entfernt werden: Ist ein Verzeichnis`);
        else {
          const parent = sh.lookup(abs.slice(0, abs.lastIndexOf('/')) || '/').node;
          if (sh.can(parent, 'w') && sh.can(parent, 'x')) parent.children.delete(node.name);
          else err.push(`rm: '${target}' kann nicht entfernt werden: ${DENIED}`);
        }
      }
      return { out: [], err };
    },
  },

  whoami: { help: 'eigenen Benutzernamen anzeigen', run: (sh) => ok([sh.user]) },
  id: { help: 'Benutzer und Gruppen anzeigen', run: (sh) => ok([`uid=1000(${sh.user}) gid=1000(${sh.user}) Gruppen=1000(${sh.user})`]) },
  hostname: { help: 'Rechnernamen anzeigen', run: (sh) => ok([sh.host]) },
  uname: {
    help: 'Systeminformationen anzeigen (-a)',
    run: (sh, args) => ok([args.includes('-a') ? `Linux ${sh.host} 6.1.0-simulation #1 SMP x86_64 GNU/Linux` : 'Linux']),
  },
  date: { help: 'Datum und Uhrzeit anzeigen', run: () => ok([new Date().toLocaleString('de-DE')]) },
  history: { help: 'bisherige Befehle auflisten', run: (sh) => ok(sh.history.map((line, index) => `${String(index + 1).padStart(4)}  ${line}`)) },

  ip: {
    help: 'Netzwerkadressen anzeigen (ip a)',
    run(sh, args) {
      if (!['a', 'addr', 'address'].includes(args[0])) return fail('Aufruf: ip a');
      return ok([
        '1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536',
        '    inet 127.0.0.1/8 scope host lo',
        '2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500',
        '    link/ether 08:00:27:4e:66:a1 brd ff:ff:ff:ff:ff:ff',
        '    inet 192.168.56.10/24 brd 192.168.56.255 scope global eth0',
      ]);
    },
  },

  ping: {
    help: 'Erreichbarkeit prüfen (nur localhost)',
    run(sh, args) {
      const target = args.find((arg) => !arg.startsWith('-'));
      if (!target) return fail('Aufruf: ping ZIEL');
      if (!['localhost', '127.0.0.1', sh.host, '192.168.56.10'].includes(target)) {
        return fail(`ping: ${target}: Die Simulation hat kein Netzwerk. Erreichbar ist nur der eigene Rechner.`);
      }
      const address = target === 'localhost' || target === '127.0.0.1' ? '127.0.0.1' : '192.168.56.10';
      return ok([
        `PING ${target} (${address}) 56(84) Bytes an Daten.`,
        ...[0.031, 0.044, 0.039].map((time, index) => `64 Bytes von ${address}: icmp_seq=${index + 1} ttl=64 Zeit=${time} ms`),
        '',
        `--- ${target} ping-Statistik ---`,
        '3 Pakete übertragen, 3 empfangen, 0% Paketverlust',
      ]);
    },
  },

  sudo: {
    help: 'Befehl als Administrator ausführen (hier gesperrt)',
    run: (sh) => fail(`${sh.user} steht nicht in der sudoers-Datei. In dieser Simulation gibt es keine Administratorrechte.`),
  },
};

function unknown(name) {
  if (NO_NETWORK.has(name)) return `${name}: In dieser Simulation nicht vorhanden. Das Übungsterminal übt Linux-Grundlagen und hat kein Netzwerk.`;
  if (NO_EDITOR.has(name)) return `${name}: Editoren und Pager gibt es hier nicht. Zum Lesen reicht cat.`;
  return `${name}: Befehl nicht gefunden. Mit help siehst du alle Befehle.`;
}

// --- Die Shell ---------------------------------------------------------------------

export class Shell {
  constructor(data) {
    this.data = data;
    this.user = data.user;
    this.host = data.host;
    this.home = `/home/${data.user}`;
    this.history = [];
    this.reset();
  }

  reset() {
    this.root = buildTree(this.data);
    this.cwd = this.home;
  }

  /** Pfad für den Prompt, das Home-Verzeichnis wird zur Tilde. */
  get promptPath() {
    if (this.cwd === this.home) return '~';
    return this.cwd.startsWith(`${this.home}/`) ? `~${this.cwd.slice(this.home.length)}` : this.cwd;
  }

  normalize(path) {
    let full = path;
    if (full === '~' || full.startsWith('~/')) full = this.home + full.slice(1);
    if (!full.startsWith('/')) full = `${this.cwd}/${full}`;
    const parts = [];
    for (const segment of full.split('/')) {
      if (!segment || segment === '.') continue;
      if (segment === '..') parts.pop();
      else parts.push(segment);
    }
    return `/${parts.join('/')}`;
  }

  /** Sucht einen Pfad. Ergebnis: { node, abs } oder { error, abs }. */
  lookup(path) {
    const abs = this.normalize(path);
    let node = this.root;
    for (const segment of abs.split('/').filter(Boolean)) {
      if (node.type !== 'dir') return { error: 'Ist kein Verzeichnis', abs };
      if (!this.can(node, 'x')) return { error: DENIED, abs };
      node = node.children.get(segment);
      if (!node) return { error: MISSING, abs };
    }
    return { node, abs };
  }

  /** Prüft ein Recht (r, w, x) für den angemeldeten Benutzer. */
  can(node, right) {
    const offset = node.owner === this.user ? 0 : 6;
    return node.mode[offset + 'rwx'.indexOf(right)] !== '-';
  }

  /** Läuft einen Teilbaum ab und ruft visit für jeden Eintrag auf. */
  walk(node, path, visit, denied) {
    visit(node, path);
    if (node.type !== 'dir') return;
    if (!this.can(node, 'r') || !this.can(node, 'x')) {
      denied(path);
      return;
    }
    for (const child of [...node.children.values()].sort(byName)) {
      this.walk(child, path === '/' ? `/${child.name}` : `${path}/${child.name}`, visit, denied);
    }
  }

  create(targets, type, command) {
    const err = [];
    for (const target of targets) {
      const found = this.lookup(target);
      if (found.node) {
        if (type === 'dir') err.push(`mkdir: '${target}' kann nicht angelegt werden: Die Datei existiert bereits`);
        continue;
      }
      const cut = found.abs.lastIndexOf('/');
      const name = found.abs.slice(cut + 1);
      const parent = this.lookup(found.abs.slice(0, cut) || '/').node;
      if (!parent || parent.type !== 'dir') err.push(`${command}: '${target}': ${MISSING}`);
      else if (!this.can(parent, 'w') || !this.can(parent, 'x')) err.push(`${command}: '${target}': ${DENIED}`);
      else if (type === 'dir') parent.children.set(name, makeDir(name, 'rwxr-xr-x', this.user));
      else parent.children.set(name, { type: 'file', name, mode: 'rw-r--r--', owner: this.user, lines: [] });
    }
    return { out: [], err };
  }

  /** Ersetzt die Tilde und löst * und ? im letzten Pfadteil auf, wie es eine echte Shell tut. */
  expand(tokens) {
    const args = [];
    for (const { text, quoted } of tokens) {
      let value = text;
      if (!quoted && (value === '~' || value.startsWith('~/'))) value = this.home + value.slice(1);
      const matches = !quoted && /[*?]/.test(value) ? this.glob(value) : [];
      if (matches.length) args.push(...matches);
      else args.push(value);
    }
    return args;
  }

  glob(pattern) {
    const cut = pattern.lastIndexOf('/');
    const dirPart = pattern.slice(0, cut + 1);
    const namePart = pattern.slice(cut + 1);
    if (/[*?]/.test(dirPart)) return [];
    const { node } = this.lookup(dirPart || '.');
    if (!node || node.type !== 'dir' || !this.can(node, 'r')) return [];
    const regex = globToRegex(namePart);
    return [...node.children.keys()]
      .filter((name) => (namePart.startsWith('.') || !name.startsWith('.')) && regex.test(name))
      .sort()
      .map((name) => dirPart + name);
  }

  /**
   * Führt eine Eingabezeile aus.
   * Ergebnis: { lines, clear }. Jede Zeile ist eine Liste aus [Text, CSS-Klasse].
   */
  run(input) {
    const line = input.trim();
    if (!line) return { lines: [] };
    this.history.push(line);
    const problem = (text) => ({ lines: [[[text, 't-err']]] });

    let segments;
    try {
      segments = tokenize(line);
    } catch (error) {
      return problem(error.message);
    }
    if (segments.some((segment) => !segment.length)) return problem('Syntaxfehler: Vor oder nach der Pipe fehlt ein Befehl.');

    const errors = [];
    let result = { out: [] };
    let stdin = null;
    for (let index = 0; index < segments.length; index++) {
      const [name, ...args] = this.expand(segments[index]);
      if (name === 'clear') return { lines: [], clear: true };
      if (name === 'reset') {
        this.reset();
        return { lines: [[['Das Dateisystem ist wieder im Ausgangszustand.', 't-info']]] };
      }
      const command = COMMANDS[name];
      if (!command) {
        errors.push(unknown(name));
        result = { out: [] };
      } else {
        result = command.run(this, args, stdin, { piped: index < segments.length - 1 });
        errors.push(...(result.err || []));
      }
      stdin = result.out;
    }

    const lines = errors.map((text) => [[text, 't-err']]);
    if (result.rich) lines.push(...result.rich);
    else lines.push(...result.out.map((text) => [[text, '']]));
    return { lines };
  }

  /**
   * Vervollständigt das letzte Wort der Zeile.
   * Ergebnis: { line, options }. options ist gefüllt, wenn es mehrere Möglichkeiten gibt.
   */
  complete(line) {
    const word = /(\S*)$/.exec(line)[1];
    const before = line.slice(0, line.length - word.length);
    let candidates;
    if (!before.trim() || /\|\s*$/.test(before)) {
      candidates = [...Object.keys(COMMANDS), 'clear', 'reset'].filter((name) => name.startsWith(word)).sort().map((name) => `${name} `);
    } else {
      const cut = word.lastIndexOf('/');
      const dirPart = word.slice(0, cut + 1);
      const prefix = word.slice(cut + 1);
      const { node } = this.lookup(dirPart || '.');
      if (!node || node.type !== 'dir' || !this.can(node, 'r')) return { line, options: [] };
      candidates = [...node.children.values()]
        .filter((child) => child.name.startsWith(prefix) && (prefix.startsWith('.') || !child.name.startsWith('.')))
        .sort(byName)
        .map((child) => dirPart + child.name + (child.type === 'dir' ? '/' : ' '));
    }
    if (!candidates.length) return { line, options: [] };
    if (candidates.length === 1) return { line: before + candidates[0], options: [] };

    let common = candidates[0];
    for (const candidate of candidates) {
      while (!candidate.startsWith(common)) common = common.slice(0, -1);
    }
    common = common.trimEnd();
    if (common.length > word.length) return { line: before + common, options: [] };
    return { line, options: candidates.map((candidate) => candidate.trimEnd().slice(word.lastIndexOf('/') + 1)) };
  }
}
