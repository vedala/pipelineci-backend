const knexEnvOptions = {
  development: {
    client: 'sqlite3',
    connection: {
      filename: "./mydb.sqlite"
    },
    useNullAsDefault: true
  },
  production: {
    client: 'pg',
    connection: {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 5432,
      ssl: {
        rejectUnauthorized: true,
        ca: process.env.RDS_CERT_BUNDLE,
      },
      pool: {
        min: 2,             // Minimum number of connections in the pool
        max: 10,            // Maximum number of connections in the pool
        acquireTimeoutMillis: 30000, // Timeout for acquiring a connection (in ms)
        idleTimeoutMillis: 30000,    // Time a connection can be idle before being released (in ms)
        createTimeoutMillis: 3000,   // Timeout for creating a new connection (in ms)
        destroyTimeoutMillis: 5000,  // Timeout for destroying a connection (in ms)
        reapIntervalMillis: 1000,    // Frequency of checking for idle connections (in ms)
        propagateCreateError: false, // If true, errors during pool creation will propagate
      },
    }
  }
}

export default knexEnvOptions;
