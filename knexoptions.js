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
    connection: process.env.DB_URL
  }
}

export default knexEnvOptions;
