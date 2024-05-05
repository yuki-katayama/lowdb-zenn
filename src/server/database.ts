import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node'
import lodash from "lodash"

// データベースのスキーマを定義
export interface DbSchema {
  posts: Array<{ id: number; title: string; published: boolean }>;
  user: { name: string; age: number };
}

// JSONファイルを使ったアダプタの作成
class LowWithLodash<T> extends Low<T> {
  chain: lodash.ExpChain<this['data']> = lodash.chain(this).get('data')
}
const adapter = new JSONFile<DbSchema>('db.json');
const db = new LowWithLodash(adapter, { posts: [], user: { name: '', age: 0 } })

// database.ts
export const createPost = async (title: string) => {
	await db.update(({posts}) => posts.push({ id: Math.floor(Math.random() * 100), title, published: false }))
}

// database.ts
export const getPosts = async () => {
  await db.read();
  return db.data.posts
}

export const findPostByTitle = async (title: string) => {
  await db.read();
  return db.chain.get('posts').find({title}).value()
}

// database.ts
export const deletePost = async (id: number) => {
  await db.update(({posts}) => {
      const index = posts.findIndex(p => p.id === id);
      if (index !== -1) {db.data!.posts.splice(index, 1);};
  })
}

// database.ts
export const updatePost = async (id: number, title: string) => {
  db.update(({posts}) => {
      const post = posts.find(p => p.id === id);
      if (post) { post.title = title; }
  })
}

// データベースを初期化する非同期関数
const initializeDb = async () => {
  await db.read();
  // デフォルト値を設定
  db.data ||= { posts: [], user: { name: '', age: 0 } };
  await db.write();
}

await initializeDb();
