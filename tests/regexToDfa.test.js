const assert = require('assert');
const { convertRegexToDfa } = require('../lib/regexToDfa');

function isAccepted(regex, input) {
  const dfa = convertRegexToDfa(regex);
  let current = dfa.states.find(s => s.isStart).name;
  for (const char of input) {
    const t = dfa.transitions.find(x => x.from === current && x.input === char);
    if (!t) return false;
    current = t.to;
  }
  return dfa.states.some(s => s.name === current && s.isFinal);
}

assert.strictEqual(isAccepted('(a+b)*aba(a+b)*', 'aba'), true);
assert.strictEqual(isAccepted('(a+b)*aba(a+b)*', 'bbababb'), true);
assert.strictEqual(isAccepted('(a+b)*aba(a+b)*', 'abba'), false);

assert.strictEqual(isAccepted('a(a+b)*a', 'aa'), true);
assert.strictEqual(isAccepted('a(a+b)*a', 'abba'), true);
assert.strictEqual(isAccepted('a(a+b)*a', 'baba'), false);

assert.strictEqual(isAccepted('aa(a+b)*b', 'aab'), true);
assert.strictEqual(isAccepted('aa(a+b)*b', 'aaab'), true);
assert.strictEqual(isAccepted('aa(a+b)*b', 'aaa'), false);

assert.strictEqual(isAccepted('0(0+1)*01', '001'), true);
assert.strictEqual(isAccepted('0(0+1)*01', '0101'), true);
assert.strictEqual(isAccepted('0(0+1)*01', '101'), false);

console.log('All Regex to DFA tests passed.');
