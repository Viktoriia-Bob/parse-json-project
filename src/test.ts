let at; // The index of the current character
let ch; // The current character
let text;

const escapee = {
  '"': '"',
  '\\': '\\',
  '/': '/',
  b: '\b',
  f: '\f',
  n: '\n',
  r: '\r',
  t: '\t',
};
const typesMap = {
  STRING: 'string',
  FLOAT: 'float',
  INT: 'int',
  BOOLEAN: 'boolean',
  NULL: 'null',
  MESSAGE: 'message',
};
const labelsMap = {
  REPEATED: 'REPEATED',
  OPTIONAL: 'OPTIONAL',
};

const error = function (m) {
  throw {
    name: 'SyntaxError',
    message: m,
    at: at,
    text: text,
  };
};

const next = function (c) {
  if (c && c !== ch) {
    error("Expected '" + c + "' instead of '" + ch + "'");
  }
  ch = text.charAt(at);
  at += 1;
  return ch;
};

const number = function () {
  let value;
  let string = '';

  if (ch === '-') {
    string = '-';
    next('-');
  }
  while (ch >= '0' && ch <= '9') {
    string += ch;
    // @ts-ignore
    next();
  }
  if (ch === '.') {
    string += '.';
    // @ts-ignore
    while (next() && ch >= '0' && ch <= '9') {
      string += ch;
    }
  }
  if (ch === 'e' || ch === 'E') {
    string += ch;
    // @ts-ignore
    next();
    if (ch === '-' || ch === '+') {
      string += ch;
      // @ts-ignore
      next();
    }
    while (ch >= '0' && ch <= '9') {
      string += ch;
      // @ts-ignore
      next();
    }
  }
  // eslint-disable-next-line prefer-const
  value = string;
  if (!isFinite(+value)) {
    error('Bad number');
  } else {
    return {
      type: `${value}`.indexOf('.') > 0 ? typesMap.FLOAT : typesMap.INT,
      value: `${value}`,
      label: labelsMap.OPTIONAL,
    };
  }
};

const string = function () {
  let hex;
  let i;
  let value = '';
  let uffff;

  if (ch === '"') {
    // @ts-ignore
    while (next()) {
      if (ch === '"') {
        // @ts-ignore
        next();
        return {
          type: typesMap.STRING,
          label: labelsMap.OPTIONAL,
          value,
        };
      }
      if (ch === '\\') {
        // @ts-ignore
        next();
        if (ch === 'u') {
          uffff = 0;
          for (i = 0; i < 4; i += 1) {
            // @ts-ignore
            hex = parseInt(next(), 16);
            if (!isFinite(hex)) {
              break;
            }
            uffff = uffff * 16 + hex;
          }
          value += String.fromCharCode(uffff);
        } else if (typeof escapee[ch] === 'string') {
          value += escapee[ch];
        } else {
          break;
        }
      } else {
        value += ch;
      }
    }
  }
  error('Bad string');
};

const keyString = function () {
  let hex;
  let i;
  let value = '';
  let uffff;

  if (ch === '"') {
    // @ts-ignore
    while (next()) {
      if (ch === '"') {
        // @ts-ignore
        next();
        return value;
      }
      if (ch === '\\') {
        // @ts-ignore
        next();
        if (ch === 'u') {
          uffff = 0;
          for (i = 0; i < 4; i += 1) {
            // @ts-ignore
            hex = parseInt(next(), 16);
            if (!isFinite(hex)) {
              break;
            }
            uffff = uffff * 16 + hex;
          }
          value += String.fromCharCode(uffff);
        } else if (typeof escapee[ch] === 'string') {
          value += escapee[ch];
        } else {
          break;
        }
      } else {
        value += ch;
      }
    }
  }
  error('Bad string');
};

const white = function () {
  while (ch && ch <= ' ') {
    // @ts-ignore
    next();
  }
};

const word = function () {
  switch (ch) {
    case 't':
      next('t');
      next('r');
      next('u');
      next('e');
      return {
        type: typesMap.BOOLEAN,
        label: labelsMap.OPTIONAL,
        value: true,
      };
    case 'f':
      next('f');
      next('a');
      next('l');
      next('s');
      next('e');
      return {
        type: typesMap.BOOLEAN,
        label: labelsMap.OPTIONAL,
        value: false,
      };
    case 'n':
      next('n');
      next('u');
      next('l');
      next('l');
      return {
        type: typesMap.NULL,
        label: labelsMap.OPTIONAL,
        value: null,
      };
  }
  error("Unexpected '" + ch + "'");
};

// eslint-disable-next-line prefer-const
let value;

const array = function () {
  const arr = [];
  if (ch === '[') {
    next('[');
    white();
    if (ch === ']') {
      next(']');
      return {
        type: null,
        label: labelsMap.REPEATED,
        value: arr,
      };
    }
    while (ch) {
      arr.push(value());
      white();
      if (ch === ']') {
        next(']');
        return {
          type: arr[0].type,
          label: labelsMap.REPEATED,
          value: arr,
        };
      }
      next(',');
      white();
    }
  }
  error('Bad array');
};

const object = function () {
  let key;
  const obj = [];

  if (ch === '{') {
    next('{');
    white();
    if (ch === '}') {
      next('}');
      return {
        type: typesMap.MESSAGE,
        label: labelsMap.OPTIONAL,
        value: obj,
      };
    }
    while (ch) {
      key = keyString();
      white();
      next(':');
      obj.push({ name: key, ...value() });
      white();
      if (ch === '}') {
        next('}');
        return {
          type: typesMap.MESSAGE,
          label: labelsMap.OPTIONAL,
          value: obj,
        };
      }
      next(',');
      white();
    }
  }
  error('Bad object');
};

value = function () {
  white();
  switch (ch) {
    case '{':
      return object();
    case '[':
      return array();
    case '"':
      return string();
    case '-':
      return number();
    default:
      return ch >= '0' && ch <= '9' ? number() : word();
  }
};

export function parse(source, reviver) {
  let result;

  text = source;
  at = 0;
  ch = ' ';
  // eslint-disable-next-line prefer-const
  result = value();
  white();
  if (ch) {
    error('Syntax error');
  }

  const res =
    typeof reviver === 'function'
      ? (function walk(holder, key) {
          let k;
          let v;
          const val = holder[key];
          if (val && typeof val === 'object') {
            for (k in val) {
              if (Object.prototype.hasOwnProperty.call(val, k)) {
                v = walk(val, k);
                if (v !== undefined) {
                  val[k] = v;
                } else {
                  delete val[k];
                }
              }
            }
          }
          return reviver.call(holder, key, val);
        })({ '': result }, '')
      : result;
  return res.value || res;
}
