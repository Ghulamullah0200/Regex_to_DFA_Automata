class RegexSyntaxError extends Error {
  constructor(message) {
    super(message);
    this.name = 'RegexSyntaxError';
  }
}

const EPSILON = 'ε';
const CONCAT = '·';
const UNION = '|';
const STAR = '*';

function isLiteral(token) {
  return ![CONCAT, UNION, STAR, '(', ')'].includes(token);
}

function normalizeRegex(input) {
  if (!input || typeof input !== 'string') {
    throw new RegexSyntaxError('Please enter a regular expression.');
  }
  return input
    .replace(/\s+/g, '')
    .replace(/\+/g, UNION)
    .replace(/E/g, EPSILON)
    .replace(/e/g, EPSILON);
}

function tokenize(regex) {
  const tokens = [];
  for (const char of regex) {
    if (/[a-zA-Z0-9]/.test(char) || char === EPSILON || ['(', ')', UNION, STAR].includes(char)) {
      tokens.push(char);
    } else {
      throw new RegexSyntaxError(`Unsupported symbol "${char}". Use letters, digits, (), +/|, *, or ε/e.`);
    }
  }
  return tokens;
}

function validateTokens(tokens) {
  if (tokens.length === 0) throw new RegexSyntaxError('Regular expression cannot be empty.');
  let balance = 0;
  let prev = null;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    if (token === '(') {
      balance++;
      if (prev && (isLiteral(prev) || prev === ')' || prev === STAR)) {
        // Valid due to implicit concatenation.
      }
    }

    if (token === ')') {
      balance--;
      if (balance < 0) throw new RegexSyntaxError('Closing parenthesis found before opening parenthesis.');
      if (prev === '(' || prev === UNION || prev === null) {
        throw new RegexSyntaxError('Empty parentheses or invalid group detected.');
      }
    }

    if (token === UNION) {
      if (prev === null || prev === '(' || prev === UNION) {
        throw new RegexSyntaxError('Union operator must have a valid expression before it.');
      }
      const next = tokens[i + 1];
      if (!next || next === ')' || next === UNION || next === STAR) {
        throw new RegexSyntaxError('Union operator must have a valid expression after it.');
      }
    }

    if (token === STAR) {
      if (prev === null || prev === '(' || prev === UNION) {
        throw new RegexSyntaxError('Kleene star must come after a symbol or group.');
      }
    }

    prev = token;
  }

  if (balance !== 0) throw new RegexSyntaxError('Parentheses are not balanced.');
  if (prev === UNION) throw new RegexSyntaxError('Regex cannot end with a union operator.');
}

function needsConcat(left, right) {
  const leftCanEnd = isLiteral(left) || left === ')' || left === STAR;
  const rightCanStart = isLiteral(right) || right === '(';
  return leftCanEnd && rightCanStart;
}

function addConcat(tokens) {
  const output = [];
  for (let i = 0; i < tokens.length; i++) {
    const current = tokens[i];
    const next = tokens[i + 1];
    output.push(current);
    if (next && needsConcat(current, next)) output.push(CONCAT);
  }
  return output;
}

function toPostfix(tokens) {
  const precedence = { [UNION]: 1, [CONCAT]: 2, [STAR]: 3 };
  const output = [];
  const stack = [];

  for (const token of tokens) {
    if (isLiteral(token)) {
      output.push(token);
    } else if (token === '(') {
      stack.push(token);
    } else if (token === ')') {
      while (stack.length && stack[stack.length - 1] !== '(') output.push(stack.pop());
      if (!stack.length) throw new RegexSyntaxError('Parentheses are not balanced.');
      stack.pop();
    } else {
      while (
        stack.length &&
        stack[stack.length - 1] !== '(' &&
        precedence[stack[stack.length - 1]] >= precedence[token]
      ) {
        output.push(stack.pop());
      }
      stack.push(token);
    }
  }

  while (stack.length) {
    const op = stack.pop();
    if (op === '(' || op === ')') throw new RegexSyntaxError('Parentheses are not balanced.');
    output.push(op);
  }
  return output;
}

function createState(counter) {
  return `n${counter.value++}`;
}

function thompson(postfix) {
  const stack = [];
  const counter = { value: 0 };
  const transitions = [];

  for (const token of postfix) {
    if (isLiteral(token)) {
      const start = createState(counter);
      const end = createState(counter);
      transitions.push({ from: start, symbol: token, to: end });
      stack.push({ start, end });
    } else if (token === CONCAT) {
      if (stack.length < 2) throw new RegexSyntaxError('Invalid concatenation in regex.');
      const second = stack.pop();
      const first = stack.pop();
      transitions.push({ from: first.end, symbol: EPSILON, to: second.start });
      stack.push({ start: first.start, end: second.end });
    } else if (token === UNION) {
      if (stack.length < 2) throw new RegexSyntaxError('Invalid union in regex.');
      const second = stack.pop();
      const first = stack.pop();
      const start = createState(counter);
      const end = createState(counter);
      transitions.push({ from: start, symbol: EPSILON, to: first.start });
      transitions.push({ from: start, symbol: EPSILON, to: second.start });
      transitions.push({ from: first.end, symbol: EPSILON, to: end });
      transitions.push({ from: second.end, symbol: EPSILON, to: end });
      stack.push({ start, end });
    } else if (token === STAR) {
      if (stack.length < 1) throw new RegexSyntaxError('Invalid Kleene star in regex.');
      const item = stack.pop();
      const start = createState(counter);
      const end = createState(counter);
      transitions.push({ from: start, symbol: EPSILON, to: item.start });
      transitions.push({ from: start, symbol: EPSILON, to: end });
      transitions.push({ from: item.end, symbol: EPSILON, to: item.start });
      transitions.push({ from: item.end, symbol: EPSILON, to: end });
      stack.push({ start, end });
    }
  }

  if (stack.length !== 1) throw new RegexSyntaxError('Invalid regular expression.');
  const nfa = stack.pop();
  return { start: nfa.start, final: nfa.end, transitions, stateCount: counter.value };
}

function epsilonClosure(states, transitions) {
  const closure = new Set(states);
  const stack = [...states];
  while (stack.length) {
    const state = stack.pop();
    for (const t of transitions) {
      if (t.from === state && t.symbol === EPSILON && !closure.has(t.to)) {
        closure.add(t.to);
        stack.push(t.to);
      }
    }
  }
  return closure;
}

function move(states, symbol, transitions) {
  const result = new Set();
  for (const state of states) {
    for (const t of transitions) {
      if (t.from === state && t.symbol === symbol) result.add(t.to);
    }
  }
  return result;
}

function setKey(set) {
  return [...set].sort().join(',');
}

function subsetConstruction(nfa, alphabet) {
  const startSet = epsilonClosure(new Set([nfa.start]), nfa.transitions);
  const states = [];
  const stateMap = new Map();
  const queue = [];
  const transitions = [];
  let index = 0;

  function addState(set) {
    const key = setKey(set);
    if (!stateMap.has(key)) {
      const name = `q${index++}`;
      const obj = {
        name,
        nfaStates: [...set].sort(),
        isStart: states.length === 0,
        isFinal: set.has(nfa.final),
        isDead: false,
      };
      stateMap.set(key, obj);
      states.push(obj);
      queue.push(obj);
    }
    return stateMap.get(key);
  }

  addState(startSet);

  while (queue.length) {
    const current = queue.shift();
    const currentSet = new Set(current.nfaStates);
    for (const symbol of alphabet) {
      const targetMove = move(currentSet, symbol, nfa.transitions);
      const targetClosure = epsilonClosure(targetMove, nfa.transitions);
      if (targetClosure.size === 0) continue;
      const target = addState(targetClosure);
      transitions.push({ from: current.name, input: symbol, to: target.name });
    }
  }

  if (alphabet.length > 0) {
    const deadNeeded = states.some(state => alphabet.some(symbol => !transitions.find(t => t.from === state.name && t.input === symbol)));
    if (deadNeeded) {
      const dead = { name: 'DEAD', nfaStates: [], isStart: false, isFinal: false, isDead: true };
      states.push(dead);
      for (const state of states) {
        for (const symbol of alphabet) {
          const exists = transitions.find(t => t.from === state.name && t.input === symbol);
          if (!exists) transitions.push({ from: state.name, input: symbol, to: 'DEAD' });
        }
      }
    }
  }

  return { states, transitions };
}

function buildTransitionTable(states, alphabet, transitions) {
  return states.map(state => {
    const row = { state: state.name, type: state.isStart ? 'Start' : state.isFinal ? 'Final' : state.isDead ? 'Dead' : 'Normal' };
    for (const symbol of alphabet) {
      const t = transitions.find(x => x.from === state.name && x.input === symbol);
      row[symbol] = t ? t.to : '-';
    }
    return row;
  });
}

function acceptsString(input, dfa, alphabet) {
  let current = dfa.states.find(s => s.isStart)?.name || 'q0';
  for (const char of input) {
    if (!alphabet.includes(char)) return false;
    const t = dfa.transitions.find(x => x.from === current && x.input === char);
    if (!t) return false;
    current = t.to;
  }
  return dfa.states.some(s => s.name === current && s.isFinal);
}

function generateStrings(alphabet, maxLength) {
  const result = [''];
  function helper(prefix, length) {
    if (length === 0) return;
    for (const symbol of alphabet) {
      const next = prefix + symbol;
      result.push(next);
      helper(next, length - 1);
    }
  }
  helper('', maxLength);
  return result;
}

function sampleStrings(dfa, alphabet) {
  if (!alphabet.length) return { accepted: [], rejected: [] };
  const all = generateStrings(alphabet, Math.min(4, Math.max(2, alphabet.length + 2)));
  const accepted = [];
  const rejected = [];
  for (const s of all) {
    if (acceptsString(s, dfa, alphabet)) {
      if (accepted.length < 5) accepted.push(s === '' ? 'ε' : s);
    } else {
      if (rejected.length < 5) rejected.push(s === '' ? 'ε' : s);
    }
    if (accepted.length >= 5 && rejected.length >= 5) break;
  }
  return { accepted, rejected };
}

function explainRegex(original, normalized, tokensWithConcat, postfix, nfa, dfa, alphabet) {
  const finals = dfa.states.filter(s => s.isFinal).map(s => s.name);
  const hasDead = dfa.states.some(s => s.isDead);
  return {
    original,
    normalized,
    alphabet,
    regexWithConcat: tokensWithConcat.join(''),
    postfix: postfix.join(' '),
    startState: 'q0',
    finalStates: finals,
    deadState: hasDead ? 'DEAD' : 'Not required',
    totalNfaStates: nfa.stateCount,
    totalDfaStates: dfa.states.length,
    method: 'Thompson construction → ε-closure → subset construction',
    notes: [
      'q0 is the start state.',
      finals.length ? `${finals.join(', ')} ${finals.length === 1 ? 'is' : 'are'} accepting/final state(s).` : 'No final state reached from the start set.',
      hasDead ? 'DEAD state handles missing/invalid transitions and makes the DFA complete.' : 'No DEAD state was needed because every transition is already defined.',
      'Transition table is generated from the same DFA used in the graph, so both outputs remain consistent.'
    ]
  };
}

function convertRegexToDfa(input) {
  const normalized = normalizeRegex(input);
  const tokens = tokenize(normalized);
  validateTokens(tokens);
  const alphabet = [...new Set(tokens.filter(t => isLiteral(t) && t !== EPSILON))].sort();
  if (alphabet.length === 0 && !tokens.includes(EPSILON)) {
    throw new RegexSyntaxError('No valid alphabet symbol found.');
  }
  const tokensWithConcat = addConcat(tokens);
  const postfix = toPostfix(tokensWithConcat);
  const nfa = thompson(postfix);
  const dfa = subsetConstruction(nfa, alphabet);
  const table = buildTransitionTable(dfa.states, alphabet, dfa.transitions);
  const samples = sampleStrings(dfa, alphabet);
  const explanation = explainRegex(input, normalized, tokensWithConcat, postfix, nfa, dfa, alphabet);

  return {
    regex: input,
    alphabet,
    states: dfa.states,
    transitions: dfa.transitions,
    table,
    samples,
    explanation,
    nfa: {
      start: nfa.start,
      final: nfa.final,
      stateCount: nfa.stateCount,
      transitions: nfa.transitions,
    },
  };
}

module.exports = { convertRegexToDfa, RegexSyntaxError };
