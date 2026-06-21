# Project Guide: Regex to DFA Converter

## 1. Project Title

**Regex to DFA Converter**

## 2. Project Theme

This project belongs to the **Theory of Automata** course. It converts a formal Regular Expression into a Deterministic Finite Automaton and visualizes the generated machine on a web interface.

## 3. Problem Statement

Students often understand regular expressions and DFA transition tables separately, but they struggle to see how a regular expression becomes a finite automaton. This project solves that problem by taking a regex as input and automatically generating:

- DFA graph
- DFA transition table
- Start state
- Final states
- Dead state where required
- Accepted and rejected sample strings
- Step-by-step machine simulation

## 4. Objectives

- To convert a valid regular expression into an equivalent DFA.
- To visually display DFA states and transitions.
- To generate a transition table automatically.
- To simulate input strings on the generated DFA.
- To store conversion history in a SQL database.
- To deploy the project as a web-based application on Vercel.

## 5. Technologies Used

### Frontend

- HTML
- CSS
- JavaScript
- SVG for graph visualization

### Backend

- Node.js serverless API functions on Vercel

### Database

- PostgreSQL / Neon SQL database

### Deployment

- GitHub
- Vercel

## 6. Why Node.js Backend is Suitable

Node.js is suitable because the frontend is written in JavaScript and the DFA conversion algorithm can also be implemented in JavaScript. This keeps the project simple, fast, and easy to deploy on Vercel through serverless API routes.

## 7. Algorithm Used

The project uses the following formal automata method:

```txt
Regex → Thompson NFA → ε-closure → Subset Construction → DFA
```

### Step 1: Normalize Regex

The input regex is cleaned. Spaces are removed. The `+` operator is converted internally to `|` because both represent union.

### Step 2: Tokenization

The regex is divided into meaningful tokens such as symbols, brackets, union, and star.

### Step 3: Explicit Concatenation

Formal regex often uses implicit concatenation. For example:

```txt
ab
```

means:

```txt
a·b
```

The project adds an internal concatenation symbol `·`.

### Step 4: Postfix Conversion

The regex is converted into postfix form using operator precedence:

```txt
* has highest precedence
· has second priority
+ or | has lowest priority
```

### Step 5: Thompson NFA

The postfix expression is converted into an NFA using Thompson construction.

### Step 6: Epsilon Closure

The system calculates all states reachable through epsilon transitions.

### Step 7: Subset Construction

The NFA state sets are converted into DFA states.

### Step 8: Dead State

If a missing transition exists, a dead state is added to make the DFA complete.

## 8. Main Features

### Regex Input

The user enters a regular expression such as:

```txt
(a+b)*aba(a+b)*
```

### DFA Visualization

The website displays states as circles and transitions as arrows.

### Transition Table

The website generates a table like:

```txt
State | Type | Input | Next State
```

### Machine Simulation

The user enters a string and the system shows the state path followed by the DFA.

### SQL History

Each conversion can be saved in PostgreSQL with:

- Regex
- Alphabet
- Number of DFA states
- Number of transitions
- Final states
- Created date

## 9. Database Table

```sql
CREATE TABLE IF NOT EXISTS regex_conversions (
  id SERIAL PRIMARY KEY,
  regex_text TEXT NOT NULL,
  alphabet TEXT NOT NULL,
  dfa_state_count INTEGER NOT NULL,
  transition_count INTEGER NOT NULL,
  final_states TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## 10. Supported Operators

| Operator | Meaning |
|---|---|
| `+` | Union |
| `|` | Union |
| `*` | Kleene Star |
| `()` | Grouping |
| `ab` | Concatenation |
| `ε` or `e` | Epsilon |

## 11. Limitations

This project is designed for Theory of Automata, so it supports formal regular expressions. It does not support full programming-language regex features such as:

- `[a-z]`
- `{2,3}`
- `?`
- `.` wildcard
- lookahead/lookbehind

These are intentionally excluded to keep the project aligned with formal language theory.

## 12. Viva Questions and Answers

### Q1. What is a regular expression?

A regular expression is a formal way to describe a regular language using symbols and operators such as union, concatenation, and Kleene star.

### Q2. What is a DFA?

A DFA is a Deterministic Finite Automaton. For every state and input symbol, it has exactly one next state.

### Q3. What is the difference between NFA and DFA?

An NFA can have multiple transitions for the same input and can also use epsilon transitions. A DFA has exactly one transition for each input symbol from each state and does not use epsilon transitions.

### Q4. Which algorithm is used in this project?

The project uses Thompson construction to create an NFA and subset construction to convert that NFA into a DFA.

### Q5. What is epsilon closure?

Epsilon closure is the set of all states reachable from a state using only epsilon transitions, including the state itself.

### Q6. What is a dead state?

A dead state is a non-final state used when the machine has no valid transition for a symbol. It keeps the DFA complete.

### Q7. Why do we need a transition table?

The transition table gives a clear tabular form of the DFA. It shows the next state for each current state and input symbol.

### Q8. Why did you use SQL?

SQL is used to store conversion history, including regex, alphabet, state count, transition count, final states, and date.

### Q9. Why did you use SVG?

SVG is suitable for drawing circles, arrows, labels, and graph-like structures directly in the browser.

### Q10. Is this a full JavaScript regex engine?

No. This project supports formal automata-style regex, not all programming regex features. This is intentional because the project is based on Theory of Automata concepts.

## 13. Presentation Script in Roman Urdu

Assalam-o-Alaikum respected teacher and class fellows. Hamara project hai **Regex to DFA Converter**. Is project ka main purpose ye hai ke user ek regular expression enter kare, aur system us regex ka equivalent DFA generate kare.

Theory of Automata mein hum regular expression, NFA, DFA aur transition table study karte hain. Lekin manually conversion karna students ke liye difficult hota hai. Is liye humne ek web-based tool banaya hai jo regex ko automatically DFA mein convert karta hai.

Is project mein user regex input deta hai, phir backend algorithm pehle regex ko parse karta hai, uska NFA banata hai using Thompson construction, phir epsilon closure aur subset construction use karke DFA generate karta hai.

Website par DFA graph circles aur arrows ke form mein show hota hai. Start state, final state aur dead state clearly visible hoti hai. Iske sath transition table bhi generate hota hai jisme har state aur input symbol ka next state show hota hai.

Humne ek simulation feature bhi add kiya hai. User koi string enter kare, to machine step by step show karti hai ke string accept hogi ya reject.

Database ke liye humne SQL use kiya hai. Har conversion ka record database mein save hota hai, jaise regex, alphabet, states count, transitions count aur final states.

Ye project HTML, CSS, JavaScript, Node.js backend aur PostgreSQL database par based hai. Isko GitHub se Vercel par deploy kiya ja sakta hai.

Thank you.
