import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

function sql(strings, ...values) {
  if (typeof strings === 'string') {
    const params = Array.isArray(values[0]) ? values[0] : values;
    return pool.query(strings, params).then(r => r.rows);
  }

  const params = [];
  const text = strings.reduce((acc, str, i) => {
    let part = str;
    if (i < values.length) {
      if (values[i] === null || values[i] === undefined) {
        part += 'NULL';
      } else {
        part += `$${params.length + 1}`;
        params.push(values[i]);
      }
    }
    return acc + part;
  }, '');

  return pool.query(text, params).then(r => r.rows);
}

export default sql;
