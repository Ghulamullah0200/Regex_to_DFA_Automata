# Regex to DFA Converter

A web-based **Theory of Automata** project for converting a valid Regular Expression into a DFA. The project includes:

- Regex input form
- Regex parser with support for `+`, `|`, `*`, `()`, implicit concatenation, and `ε/e`
- Thompson NFA construction
- ε-closure and subset construction for DFA generation
- SVG-based DFA graph visualization
- DFA transition table
- String simulation on generated DFA
- Accepted/rejected sample strings
- PostgreSQL/Neon SQL history for saved conversions
- Vercel deployment-ready structure

## Color Palette

```css
Primary heading color: #622B14
Secondary / hover / support text: #995F2F
Muted olive accent: #978F66
Soft background / card highlight: #E4D6A9
```

## Folder Structure

```txt
regex-to-dfa-converter/
├── api/
│   ├── convert.js        # Main API: regex to DFA conversion
│   ├── history.js        # Recent SQL conversion history
│   └── setup-db.js       # Creates SQL table if DATABASE_URL exists
├── lib/
│   ├── db.js             # Neon/PostgreSQL helper
│   └── regexToDfa.js     # Regex parser + NFA + DFA algorithm
├── public/
│   ├── app.js            # Frontend JavaScript
│   ├── index.html        # Main UI
│   └── styles.css        # UI styling
├── sql/
│   └── schema.sql        # SQL table schema
├── tests/
│   └── regexToDfa.test.js
├── docs/
│   └── PROJECT_GUIDE.md
├── package.json
├── vercel.json
└── README.md
```

## Local Setup

### 1. Install Node.js

Use Node.js 20 or newer.

### 2. Install dependencies

```bash
npm install
```

### 3. Run tests

```bash
npm test
```

### 4. Start locally

```bash
npm run dev
```

Open the local Vercel URL shown in the terminal, usually:

```txt
http://localhost:3000
```

## SQL Database Setup

The project uses PostgreSQL through Neon/Vercel Marketplace.

### Option A: Run without database locally

The DFA converter works even without SQL. If `DATABASE_URL` is missing, the website shows:

```txt
DATABASE_URL is not configured. Conversion worked, but SQL logging is disabled.
```

### Option B: Enable SQL history

Create a Neon PostgreSQL database and add this environment variable:

```env
DATABASE_URL=your_neon_postgres_connection_string
```

Then run:

```bash
npm run dev
```

Open:

```txt
/api/setup-db
```

This creates the `regex_conversions` SQL table.

## Deploy on Vercel with GitHub

1. Create a GitHub repository.
2. Push this project to GitHub.
3. Open Vercel dashboard.
4. Click **Add New Project**.
5. Import the GitHub repository.
6. Keep build settings default.
7. Add PostgreSQL/Neon database from Vercel Marketplace.
8. Make sure `DATABASE_URL` is available in Environment Variables.
9. Deploy.
10. After deployment, visit:

```txt
https://your-project-name.vercel.app/api/setup-db
```

Then open the main website and test any regex.

## Supported Regex Examples

```txt
(a+b)*aba(a+b)*
a(a+b)*a
aa(a+b)*b
0(0+1)*01
(0+1)*101
```

## Important Notes

- `+` and `|` both mean union.
- Concatenation is implicit, so `ab` means `a` followed by `b`.
- `*` means Kleene star.
- `ε` or `e` means epsilon.
- Valid symbols can be letters or digits.
- Unsupported symbols such as `[a-z]`, `{2}`, `?`, and `.` are not included because this is a formal language/automata course project, not a full JavaScript regex engine.

## Academic Concepts Covered

- Regular Expression
- NFA
- Thompson Construction
- Epsilon Closure
- Subset Construction
- DFA
- Start State
- Final State
- Dead State
- Transition Table
- String Acceptance/Rejection
