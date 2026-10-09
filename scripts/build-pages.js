// Build one coherent browser module graph per Git revision, without changing site/.
import {cp, readFile, readdir, rm, stat, writeFile} from 'node:fs/promises';
import {resolve, relative, sep, extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildCalendarFeeds} from './build-calendar-feed.js';

const SOURCE = fileURLToPath(new URL('../site/', import.meta.url));
const OUTPUT = fileURLToPath(new URL('../.pages/', import.meta.url));

export function validateRevision(revision){
  if (typeof revision !== 'string' || !/^[a-f0-9]{7,40}$/i.test(revision)){
    throw new Error('Provide a Git revision of 7–40 hexadecimal characters (argument or GITHUB_SHA).');
  }
  return revision.toLowerCase();
}

export function stampRelativeUrl(value, revision, moduleSpecifier = false){
  const version = validateRevision(revision);
  if (typeof value !== 'string' || !value || value.startsWith('//') || /^[a-z][a-z\d+.-]*:/i.test(value) || /^[?#]/.test(value)) return value;
  if (moduleSpecifier && !/^(?:\.{1,2}\/|\/)/.test(value)) return value;
  const [withoutHash, ...hash] = value.split('#');
  const queryAt = withoutHash.indexOf('?');
  const path = queryAt < 0 ? withoutHash : withoutHash.slice(0, queryAt);
  const params = new URLSearchParams(queryAt < 0 ? '' : withoutHash.slice(queryAt + 1));
  params.set('v', version);
  return path + '?' + params.toString() + (hash.length ? '#' + hash.join('#') : '');
}

function stringValue(raw){
  return raw.slice(1, -1).replace(/\\(?:u\{([a-f\d]+)\}|u([a-f\d]{4})|x([a-f\d]{2})|([^]))/gi,
    (_, codePoint, unicode, hex, escaped) => codePoint || unicode || hex
      ? String.fromCodePoint(parseInt(codePoint || unicode || hex, 16))
      : ({n:'\n', r:'\r', t:'\t', b:'\b', f:'\f', v:'\v', '0':'\0', '\n':''}[escaped] ?? escaped));
}

// Only static import/re-export strings are candidates. Comments, ordinary strings,
// templates and regular expressions are skipped, so their contents stay literal.
function tokens(source){
  const output = []; let i = 0;
  while (i < source.length){
    const ch = source[i];
    if (/\s/.test(ch)){ i++; continue; }
    if (source.startsWith('//', i)){ i = source.indexOf('\n', i + 2); if (i < 0) break; continue; }
    if (source.startsWith('/*', i)){ const end = source.indexOf('*/', i + 2); i = end < 0 ? source.length : end + 2; continue; }
    if (ch === '"' || ch === "'" || ch === '`'){
      const start = i++;
      while (i < source.length){ if (source[i] === '\\'){ i += 2; continue; } if (source[i++] === ch) break; }
      output.push({kind:ch === '`' ? 'literal' : 'string', value:ch === '`' ? '' : stringValue(source.slice(start, i)), start, end:i}); continue;
    }
    const prior = output.at(-1)?.value;
    if (ch === '/' && (prior === undefined || /^[=([{,:;!?&|+*%-]$/.test(prior) || ['return', 'throw', 'case'].includes(prior))){
      i++; let inClass = false;
      while (i < source.length){
        if (source[i] === '\\'){ i += 2; continue; }
        if (source[i] === '[') inClass = true;
        else if (source[i] === ']') inClass = false;
        else if (source[i] === '/' && !inClass){ i++; break; }
        i++;
      }
      while (/[a-z]/i.test(source[i] || '') && i < source.length) i++;
      output.push({kind:'literal', value:'regex'}); continue;
    }
    const word = /^[a-z_$][\w$]*/i.exec(source.slice(i));
    if (word){ output.push({kind:'word', value:word[0]}); i += word[0].length; }
    else { output.push({kind:'punctuation', value:ch}); i++; }
  }
  return output;
}

export function stampJavaScript(source, revision){
  validateRevision(revision);
  const list = tokens(source), replacements = [];
  for (let i = 0; i < list.length; i++){
    const token = list[i], next = list[i + 1];
    if (token.kind !== 'word' || !['import', 'export'].includes(token.value) || list[i - 1]?.value === '.') continue;
    let specifier;
    if (token.value === 'import' && next?.kind === 'string') specifier = next;
    else {
      if (!next || (token.value === 'export' && !['{', '*'].includes(next.value)) || (token.value === 'import' && ['(', '.'].includes(next.value))) continue;
      for (let j = i + 1; j < list.length && list[j].value !== ';'; j++){
        if (j > i + 1 && ['import', 'export'].includes(list[j].value)) break;
        if (list[j].value === 'from' && list[j + 1]?.kind === 'string'){ specifier = list[j + 1]; break; }
      }
    }
    if (!specifier) continue;
    const stamped = stampRelativeUrl(specifier.value, revision, true);
    if (stamped === specifier.value) continue;
    const quote = source[specifier.start];
    const escaped = stamped.replace(/\\/g, '\\\\').replaceAll(quote, '\\' + quote);
    replacements.push({start:specifier.start, end:specifier.end, value:quote + escaped + quote});
  }
  for (const replacement of replacements.sort((a, b) => b.start - a.start)){
    source = source.slice(0, replacement.start) + replacement.value + source.slice(replacement.end);
  }
  return source;
}

function attribute(tag, name){
  return new RegExp('\\s' + name + '\\s*=\\s*(?:"([^"]*)"|\'([^\']*)\'|([^\\s>]+))', 'i').exec(tag);
}
function attributeValue(tag, name){ const match = attribute(tag, name); return match ? match[1] ?? match[2] ?? match[3] : ''; }
function stampAttribute(tag, name, revision){
  const match = attribute(tag, name); if (!match) return tag;
  const value = match[1] ?? match[2] ?? match[3];
  const stamped = stampRelativeUrl(value.replace(/&amp;/g, '&'), revision);
  if (stamped === value) return tag;
  const escaped = stamped.replace(/&/g, '&amp;');
  const replacement = match[0].replace(value, escaped);
  return tag.slice(0, match.index) + replacement + tag.slice(match.index + match[0].length);
}

export function stampHtml(source, revision){
  validateRevision(revision);
  return source.split(/(<!--[\s\S]*?-->)/).map(part => {
    if (part.startsWith('<!--')) return part;
    return part.replace(/(<script\b[^>]*>)([\s\S]*?)(<\/script\s*>)|<link\b[^>]*>/gi, (whole, tag, body, close) => {
      if (tag) return stampAttribute(tag, 'src', revision) + (attributeValue(tag, 'type').toLowerCase() === 'module' ? stampJavaScript(body, revision) : body) + close;
      return attributeValue(whole, 'rel').toLowerCase().split(/\s+/).includes('stylesheet') ? stampAttribute(whole, 'href', revision) : whole;
    });
  }).join('');
}

export async function buildPages({revision = process.env.GITHUB_SHA, source = SOURCE, destination = OUTPUT} = {}){
  const version = validateRevision(revision), input = resolve(source), output = resolve(destination);
  const apart = relative(input, output), inverse = relative(output, input);
  if (!apart || !inverse || !apart.startsWith('..' + sep) || !inverse.startsWith('..' + sep)){
    throw new Error('Pages output must be separate from the source directory.');
  }
  if (!(await stat(input)).isDirectory()) throw new Error('Pages source must be a directory.');
  await rm(output, {recursive:true, force:true});
  await cp(input, output, {recursive:true});
  async function visit(directory){
    for (const entry of await readdir(directory, {withFileTypes:true})){
      const path = resolve(directory, entry.name);
      if (entry.isDirectory()) await visit(path);
      else if (entry.isFile() && ['.js', '.mjs', '.html'].includes(extname(path))){
        const original = await readFile(path, 'utf8');
        const stamped = extname(path) === '.html' ? stampHtml(original, version) : stampJavaScript(original, version);
        await writeFile(path, stamped);
      }
    }
  }
  await visit(output);
  if (input === resolve(SOURCE)) await buildCalendarFeeds(output);
  return {revision:version, destination:output};
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)){
  const args = process.argv.slice(2);
  const operation = args.length > 1 ? Promise.reject(new Error('Usage: npm run build -- [Git revision]')) : buildPages({revision:args[0] || process.env.GITHUB_SHA});
  operation.then(result => console.log('Built .pages for ' + result.revision + '.'))
    .catch(error => { console.error(error.message); process.exitCode = 1; });
}
