/**
 * Helpers for turning reflected C++ type expressions into short catalog labels:
 * `std::complex<float64>` becomes `c<f64>`, `uint8` becomes `ui8`. Names without
 * a known abbreviation are kept verbatim (minus their namespaces) so domain
 * types stay readable, e.g. `gr::DataSet<float32>` becomes `DataSet<f32>`.
 */

const TYPE_ABBREVIATIONS: Record<string, string> = {
  float: 'f32',
  float32: 'f32',
  double: 'f64',
  float64: 'f64',
  int8: 'i8',
  int16: 'i16',
  int32: 'i32',
  int64: 'i64',
  uint8: 'ui8',
  uint16: 'ui16',
  uint32: 'ui32',
  uint64: 'ui64',
  char: 'i8',
  signedchar: 'i8',
  unsignedchar: 'ui8',
  short: 'i16',
  unsignedshort: 'ui16',
  int: 'i32',
  unsigned: 'ui32',
  unsignedint: 'ui32',
  long: 'i64',
  longlong: 'i64',
  unsignedlong: 'ui64',
  unsignedlonglong: 'ui64',
  size_t: 'usz',
  complex: 'c',
  pmtcomplex: 'c',
  complex64: 'c<f32>',
  complex128: 'c<f64>',
  string: 'str',
  string_view: 'str',
  vector: 'vec',
  nanoseconds: 'ns',
  microseconds: 'us',
  milliseconds: 'ms',
  seconds: 's',
  minutes: 'min',
  hours: 'h',
};

export function splitTopLevelTemplateArgs(templateArgs: string): string[] {
  const args: string[] = [];
  let depth = 0;
  let start = 0;

  for (let index = 0; index < templateArgs.length; index += 1) {
    const char = templateArgs[index];
    if (char === '<') {
      depth += 1;
      continue;
    }
    if (char === '>') {
      depth = Math.max(0, depth - 1);
      continue;
    }
    if (char === ',' && depth === 0) {
      args.push(templateArgs.slice(start, index).trim());
      start = index + 1;
    }
  }

  const tail = templateArgs.slice(start).trim();
  if (tail) {
    args.push(tail);
  }

  return args.filter((arg) => arg.length > 0);
}

export function stripScopedTypeNames(typeExpr: string): string {
  return typeExpr.replace(/\b[A-Za-z_]\w*(?:::[A-Za-z_]\w*)+\b/g, (match) => {
    const segments = match.split('::');
    return segments[segments.length - 1] ?? match;
  });
}

function unqualify(name: string): string {
  const segments = name.split('::');
  return segments[segments.length - 1]?.trim() ?? name;
}

export function abbreviateTypeName(name: string): string {
  const unqualified = unqualify(name);
  const key = unqualified.toLowerCase().replace(/\s+/g, '');
  const direct = TYPE_ABBREVIATIONS[key];
  if (direct) {
    return direct;
  }

  // `uint8_t` and friends abbreviate like their unsuffixed spelling, while
  // unrelated `*_t` names such as `size_t` keep their own entry above.
  if (key.endsWith('_t')) {
    const stripped = TYPE_ABBREVIATIONS[key.slice(0, -2)];
    if (stripped) {
      return stripped;
    }
  }

  return unqualified;
}

export function abbreviateTypeExpr(typeExpr: string): string {
  const trimmed = typeExpr.trim();
  if (!trimmed) {
    return '';
  }

  const lt = trimmed.indexOf('<');
  if (lt < 0 || !trimmed.endsWith('>')) {
    return abbreviateTypeName(trimmed);
  }

  const head = abbreviateTypeName(trimmed.slice(0, lt));
  const args = splitTopLevelTemplateArgs(trimmed.slice(lt + 1, -1)).map(abbreviateTypeExpr);
  return args.length > 0 ? `${head}<${args.join(', ')}>` : head;
}
