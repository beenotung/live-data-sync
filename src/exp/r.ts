import { r, RCursor } from 'rethinkdb-ts'

function initTables(tables: string[]) {
  return Promise.all(
    tables.map(table =>
      r
        .tableCreate(table)
        .run()
        .catch(e => {
          if (!e.toString().includes('already exists')) {
            throw e
          }
        }),
    ),
  )
}

async function main() {
  let pool = await r.connectPool({
    server: {
      host: '172.18.0.3',
      port: 28015,
    },
  })
  try {
    await initTables(['user', 'post'])

    let filter: any

    filter = { username: 'alice' }
    let [user] = await r.table('user').filter(filter).run()
    if (!user) {
      let result = await r.table('user').insert(filter).run()
      let id = result.generated_keys?.[0]
      user = { id, ...filter }
    }
    console.log({ user })

    r.table('post')
      .filter({ user_id: user.id })
      .orderBy(r.desc('timestamp'))
      .limit(1)
      .changes({ includeInitial: true })
      .run(((error: any, cursor: RCursor) => {
        console.log({ error, cursor })
      }) as any)

    let result = await r
      .table('post')
      .insert({ content: 'check in', timestamp: r.now(), user_id: user.id })
      .run()
    let id = result.generated_keys?.[0]
    console.log({ new_post_id: id })

    let merged = await r
      .table('user')
      .merge((user: any) => ({
        // user,
        posts: r
          .table('post')
          .filter({ user_id: user.getField('id') })
          .coerceTo('array'),
      }))
      .run()

    console.dir({ merged }, { depth: 20 })
  } finally {
    await pool.drain()
  }
}
main()
