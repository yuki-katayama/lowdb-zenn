# はじめに
自己学習している際に、直感的且つ迅速に利用できるDBはないかと模索していました。
気軽にできそうなjsonベースのDBライブラリを見つけたので紹介します。

この記事は下記のドキュメントをベースに説明します。
[lowdb 公式ドキュメント](https://github.com/typicode/lowdb#readme)

## 実行環境
* "@types/lowdb": "^1.0.15"
*  npm: 10.5.1
*  node: v22.0.0
*  bun: 1.1.6
*  Macbook: CPU(intel), OS(Sonoma 14.4.1)
*  tsc: Version 5.4.5

# lowdbの概要
lowdbは、小規模プロジェクトやプロトタイピングに適した軽量なデータベースライブラリです。
JSONファイルをデータベースとして使用し、非常にシンプルなAPIで操作できます。
この記事では、lowdbの基本的な使い方から始めて、少し複雑なデータ操作まで実践してみます。


## lowdbの特徴と利点
jsonベースのDBライブラリは他にもあるが、lowdbが一番ユーザーが多かったです。
また、[ドキュメント](https://github.com/typicode/lowdb#readme)もシンプルでわかりやすかったです。

jsonベースのDBでは下記が特徴です。
* 軽量でシンプル：メモリ内で動作し、書き換えや読み込みが簡単。
* データの永続性：JSONファイルにデータを保存し、簡単に編集が可能。
* 柔軟なクエリ：jsのメソッドを用いてデータを取得できます。

[json-server vs lowdb vs node-json-db vs simple-json-db](https://npmtrends.com/json-server-vs-lowdb-vs-node-json-db-vs-simple-json-db)
![jsondb rank](https://storage.googleapis.com/zenn-user-upload/8a846bb97fd5-20240505.png)


# プロジェクト構成
下記のようになっています。

```shell
├── README.md
├── bun.lockb
├── dist
├── node_modules
├── package.json
├── src
    ├── adapters
    │   ├── custom-adapter.ts
    │   ├── data-file-sync.ts
    │   └── text-file-sync.ts
    ├── server
    │   ├── database.ts
    │   └── server.ts
    └── web
        ├── browser.ts
        └── index.html
├── tsconfig.json
└── webpack.config.js
```

## package.json
:::message
webpackの設定等は、「LocalStoragePresetとSessionStoragePreset」セクションで説明します。
:::
| /package.json |
|---------------------|
```json
{
  "scripts": {
    "build": "webpack"
  },
  "dependencies": {
    "@types/body-parser": "^1.19.5",
    "@types/express": "^4.17.21",
    "@types/lowdb": "^1.0.15",
    "body-parser": "^1.20.2",
    "express": "^4.19.2",
    "lodash": "^4.17.21",
    "lowdb": "^7.0.1",
    "ts-loader": "^9.5.1",
    "typescript": "^5.4.5"
  },
  "devDependencies": {
    "webpack": "^5.91.0",
    "webpack-cli": "^5.1.4"
  }
}

```

# インストールと基本的な設定
## インストール
「プロジェクト構成」のpackage.jsonを用いて、インストールを行ってください。
```
% bun i
```

## 基本的な設定

lowdbをjsonファイルに繋げるための初期設定になります。
主に下記の三つを行います。
1. データベースのスキーマを定義
2. JSONファイルへのアダプタを作成
3. データベースの初期設定

:::details 初期設定 /src/server/database.ts
```ts
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node'

// データベースのスキーマを定義
export interface DbSchema {
  posts: Array<{ id: number; title: string; published: boolean }>;
  user: { name: string; age: number };
}

// JSONファイルを使ったアダプタの作成
const adapter = new JSONFile<DbSchema>('db.json');
const db = new Low<DbSchema>(adapter,  { posts: [], user: { name: '', age: 0 } });

// データベースを初期化する非同期関数
const initializeDb = async () => {
  await db.read();
  // デフォルト値を設定
  db.data ||= { posts: [], user: { name: '', age: 0 } };
  await db.write();
}

await initializeDb();
```
:::

### 実行結果
実行したファイルと同じ階層に下記のjsonファイルができます。
initializeDb()内で、dataがない時(最初の実行時)に設定しているデータが格納されています。

```shell
% bun database.ts
```

| /src/server/db.json |
|---------------------|
```
{
  "posts": [],
  "user": {
    "name": "",
    "age": 0
  }
}
```

# expressサーバーの準備
筆者はlowdbをAPI形式で動作させたい為。準備しています。
以降の挙動の確認は、全てapi越しに行っていきます。

:::message
シンプルにts上で動作させたい方は、expressサーバーの準備不要です。
:::

| /src/server/server.ts |
|---------------------|
```ts
import express from "express";
import bodyParser from "body-parser"

const PORT = 3000
const app = express();
app.use(bodyParser.json());

app.listen(PORT, () => {
    console.log(`listening on PORT ${PORT}`)
});

```

### 実行結果
```shell
% bun server.ts
listening on PORT 3000
```

# CRUD操作の基礎
## Create
### db.write()
下記の流れで保存します。
1. db.dataのオブジェクトに直接データを追加
2. db.write()により、db.dataを変更後に更新

| /src/server/database.ts |
|---------------------|
```ts
export const createPost = async (title: string) => {
    db.data!.posts.push({ id: Math.floor(Math.random() * 100), title, published: false });
    await db.write();
}
```
| /src/server/server.ts |
|---------------------|
```ts
import { createPost } from "./database";

...
app.post('/create', async(req, res) => {
    await createPost(req.body.title)
    res.sendStatus(200);
})
...
```

### db.update()
db.updateは、db.dataオブジェクトのデータ変更後にdb.write()を必ず実行してくれます。
変更と保存のタイミングを分けたいケースではない場合は、基本的にこちらを使用するといいと思います。

| /src/server/database.ts |
|---------------------|
```ts
export const createPost = async (title: string) => {
	await db.update(({posts}) => posts.push({ id: Math.floor(Math.random() * 100), title, published: false }))
}
```
### 実行結果
正常に反映されています。
```shell
% curl -X POST -d '{"title": "タイトルのテキスト"}' -H "Content-Type: application/json" http://localhost:3000/create

OK
```

| /src/server/db.json |
|---------------------|
```json
{
  "posts": [
    {
      "id": 86,
      "title": "タイトルのテキスト",
      "published": false
    }
  ],
  "user": {
    "name": "",
    "age": 0
  }
}
```

## Read
read()を用いることで、dbの読み込みを行う。

:::message
write()やupdate()後は、直接dataに変更が反映される。
その為、read()を行わなくても最新内容が取得できる。
:::

| /src/server/database.ts |
|---------------------|
```ts
export const getPosts = async () => {
    await db.read();
    return db.data.posts
}
```
| /src/server/server.ts |
|---------------------|
```ts
import { createPost, getPosts } from "./database";
...
app.get('/gets', async(req, res) => {
    const posts = await getPosts()
    res.status(200).send(posts)
})
```


### 実行結果
```shell
% curl -X GET localhost:3000/gets
[{"id":86,"title":"タイトルのテキスト","published":false}]
```

## Update
| /src/server/database.ts |
|---------------------|
```ts
export const updatePost = async (id: number, title: string) => {
    db.update(({posts}) => {
        const post = posts.find(p => p.id === id);
        if (post) { post.title = title; }
    })
}
```
| /src/server/server.ts |
|---------------------|
```ts
import { createPost, getPosts, updatePost } from "./database";
...
app.post('/update', async(req, res) => {
    const posts = await updatePost(req.body.id, req.body.title)
    res.status(200).send(posts)
})

```

### 実行結果
指定したidのタイトルが「タイトルのテキスト」→「zenn」に変更されていることが、db.jsonからわかる。

```shell
curl -X POST -d '{"id": 86, "title": "zenn"}' -H "Content-Type: application/json" http://localhost:3000/update
```

| /src/server/db.json |
|---------------------|
```json
{
  "posts": [
    {
      "id": 86,
      "title": "zenn",
      "published": false
    }
  ],
  "user": {
    "name": "",
    "age": 0
  }
}
```

## Delete
| /src/server/database.ts |
|---------------------|
```ts
export const deletePost = async (id: number) => {
    await db.update(({posts}) => {
        const index = posts.findIndex(p => p.id === id);
        if (index !== -1) {db.data!.posts.splice(index, 1);};
    })
}
```

| /src/server/server.ts |
|---------------------|
```ts
import { createPost, deletePost, getPosts, updatePost } from "./database";
...
app.post('/delete', async(req, res) => {
    const posts = await deletePost(req.body.id)
    res.status(200).send(posts)
})
```

### 実行結果
先ほど追加していたデータが削除されている。
```shell
% curl -X POST -H "Content-Type: application/json" -d '{"id": 86}' localhost:3000/delete
```

| /src/server/db.json |
|---------------------|
```json
{
  "posts": [],
  "user": {
    "name": "",
    "age": 0
  }
}
```

## 高度な検索
lowdb.dataから直接データに参照可能のため、簡潔に書くことができます。

下記のようにデータベースから意図したデータのみを抽出することが可能
```ts
// example
const { posts } = db.data

posts.at(0) // First post
posts.filter((post) => post.title.includes('lowdb')) // Filter by title
posts.find((post) => post.id === 1) // Find by id
posts.toSorted((a, b) => a.views - b.views) // Sort by views
```


| /src/server/database.ts |
|---------------------|
```ts
export const findPostByTitle = async (title: string) => {
    await db.read();
    return db.data.posts.find(post => post.title === title)
}
```

| /src/server/server.ts |
|---------------------|
```ts
import { createPost, deletePost, findPostByTitle, getPosts, updatePost } from "./database";
...
app.get('/get/:title', async(req, res) => {
    const post = await findPostByTitle(req.params.title)
    res.status(200).send(post)
})
...
```

| /src/server/db.json |
|---------------------|
```json
{
  "posts": [
    {
      "id": 61,
      "title": "zenn",
      "published": false
    },
    {
      "id": 66,
      "title": "qiita",
      "published": false
    }
  ],
  "user": {
    "name": "",
    "age": 0
  }
}
```
### 実行結果
```shell
% curl -X GET -d '{"title": "zenn"}' http://localhost:3000/get/zenn
{"id":61,"title":"zenn","published":false}
```

# LowDBの拡張
Lodashを使用してlowdbを拡張していきます。

下記の変更をしています。
* lodashの導入
* lodash用の拡張クラスを定義
* 拡張ラクスを用いて、dbを作成
* findPostByTitleで、db.chainで使用

:::message
lodashとは
便利な関数をまとめて提供しているライブラリです。
値の操作に長けた便利関数が数多く存在します。

[lodash 公式ドキュメント](https://lodash.com/docs/4.17.15)
:::

| /src/server/database.ts |
|---------------------|
```ts
import lodash from "lodash"
...
class LowWithLodash<T> extends Low<T> {
       chain: lodash.ExpChain<this['data']> = lodash.chain(this).get('data')
}
const adapter = new JSONFile<DbSchema>('db.json');
const db = new LowWithLodash(adapter, { posts: [], user: { name: '', age: 0 } })
...
export const findPostByTitle = async (title: string) => {
    await db.read();
    return db.chain.get('posts').find({title}).value()
}
```

### 実行結果
Lodashの書き方のレスポンスも特に変化なし。

```shell
curl -X GET -d '{"title": "zenn"}' http://localhost:3000/get/zenn
{"id":61,"title":"zenn","published":false}
```

# APIのプリセット
下記の4がある。
* JSONFilePreset(filename, defaultData)
* JSONFileSyncPreset(filename, defaultData)
* LocalStoragePreset(name, defaultData)
* SessionStoragePreset(name, defaultData)

特徴としては、JSONFileのようにadapterを作成しなくとも、db作成まで一括で行うことができます。

## JSONFilePresetとJSONFileSyncPreset
JSONFilePresetは非同期用, JSONFileSyncPresetは同期用のLowオブジェクトを作成します。

```ts
const db: Low<DbSchema> = await JSONFilePreset<DbSchema>('db.json', { posts: [], user: { name: '', age: 0 } })
const db: Low<DbSchema> = JSONFileSyncPreset<DbSchema>('db.json', { posts: [], user: { name: '', age: 0 }});
```

## LocalStoragePresetとSessionStoragePreset
これからはブラウザのストレージを用いるものです。

:::details /webpack.config.js
```js
const path = require('path');

module.exports = {
  mode: 'production',
  entry: './src/web/browser.ts',  // TypeScriptファイルをエントリーポイントに指定
  output: {
    path: path.resolve(__dirname, 'dist'),  // 出力先ディレクトリ
    filename: 'browser.js'                 // 出力ファイル名
  },
  resolve: {
    extensions: ['.ts', '.js']  // TypeScriptファイルとJavaScriptファイルの両方を解決
  },
  module: {
    rules: [
      {
        test: /\.ts$/,  // 拡張子`.ts`をトランスパイル
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  }
};

```
:::

:::details /tsconfig.json
```json
{
    "compilerOptions": {
      "target": "es2022",
      "module": "esnext",
      "strict": true,
      "esModuleInterop": true,
      "skipLibCheck": true,
      "moduleResolution": "node",
      "forceConsistentCasingInFileNames": true
    },
    "include": ["src/**/*.ts"]
  }

```
:::

:::details /src/web/index.html
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>lowdb with StoragePreset</title>
</head>
<body>
  <h1>lowdb with LocalStoragePreset Example</h1>
  <div id="local-output"></div>
  <h1>lowdb with SessionStoragePreset Example</h1>
  <div id="session-output"></div>
  <script src="../../dist/browser.js"></script> <!-- WebpackでビルドしたJSファイルを読み込む -->
</body>
</html>
```
:::

:::details /src/web/browser.ts
```ts
import { Low } from "lowdb";
import { LocalStoragePreset, SessionStoragePreset } from "lowdb/browser";
import { DbSchema } from "../server/database";

// Storageプリセットでのデータベース設定
const dbName = "myWebStorageDB";
const defaultData = { posts: [], user: { name: "", age: 0 } };
const localDb = LocalStoragePreset<DbSchema>(dbName, defaultData);
const sessionDb = SessionStoragePreset<DbSchema>(dbName, defaultData);

(async () => {
  localDb.read();
  localDb.data ||= defaultData;
  localDb.data.posts.push({
    id: 1,
    title: "zenn",
    published: false,
  });
  localDb.write();

  sessionDb.read();
  sessionDb.data ||= defaultData;
  sessionDb.data.posts.push({
    id: 1,
    title: "zenn",
    published: false,
  });
  sessionDb.write();
  const local = document.getElementById("local-output");
  const session = document.getElementById("session-output");
  local!.textContent = JSON.stringify(localDb.data, null, 2);
  session!.textContent = JSON.stringify(localDb.data, null, 2);
})();
```
:::

### 実行結果
```shell
%cd プロジェクトのホームディレクトリ
% bun run build

$ webpack
asset browser.js 1.19 KiB [emitted] [minimized] (name: main)
orphan modules 2.93 KiB [orphan] 8 modules
./src/web/browser.ts + 6 modules 3.48 KiB [built] [code generated]
webpack 5.91.0 compiled successfully in 1809 ms

% open src/web/index.html
```

上記のファイルを配置し、index.htmlを読み込みます。
そうすると、localStorageとsessionStorageに値が格納されるので確認します。
提供したhtmlでは、表示されるようになっています。

ローカルストレージ
![ローカルストレージ](https://storage.googleapis.com/zenn-user-upload/c17ae2d370bf-20240505.png)

セッションストレージ
![セッションストレージ](https://storage.googleapis.com/zenn-user-upload/ab86608f36ee-20240505.png)

# クラス
dbの作成方法として、下記の二つのクラスがある。
* Low
* LowSync

違いとしては、非同期アダプター用(JSONFile)と同期アダプター用(JSONFileSync)になります。
Syncの方はPromiseを返さないため、async...awaitで実装しなくても良い分負担は減りそうです。
## Lowで実装
 ```ts
const adapter = new JSONFile('db.json')
const db = new Low(adapter, { posts: [], user: { name: '', age: 0 }})

// (alias) Low<DbSchema>.read(): Promise<void>
await db.read()
```

## LowSyncで実装
```ts
const adapter = new JSONFileSync('db.json')
const db = new LowSync(adapter, { posts: [], user: { name: '', age: 0 }})

// (alias) LowSync<DbSchema>.read(): void
db.read()
```

# アダプター
* JSONFile
* JSONFileSync
* Memory
* MemorySync
* Utility adapters
    * TextFile TextFileSync
    * DataFile DataFileSync
* CustomAdapter

## JSONFileとJSONFileSync
これはJSON ファイルの読み取りと書き込みを行うためのアダプターである。
```ts
import { JSONFile, JSONFileSync } from 'lowdb/node'

// (alias) new JSONFile<DbSchema>(filename: PathLike): JSONFile<DbSchema>
new JSONFile<DbSchema>('db.json');

// (alias) new JSONFileSync<DbSchema>(filename: PathLike): JSONFileSync<DbSchema>
new JSONFileSync<DbSchema>('db.json');
```

## MemoryとMemorySync
これは、インメモリを使用するアダプターです。その為、高速なデータ処理が求められるユニットテストや一時的なキャッシュとして活用できます。

アダプター作成時には、db指定しない為引数はなしになります。
MemoryはLow, MemorySyncはLowSyncに対応します。

:::message
インメモリーではデータをメモリ上に保存するため、プログラムを終了するとデータは失われます。
:::

```ts
import { JSONFile, JSONFileSync } from 'lowdb/node'

// (alias) new Memory<DbSchema>(): Memory<DbSchema>
new Memory<DbSchema>();
const db = new Low(adapter, {DbSchema})

// (alias) new MemorySync<DbSchema>(): MemorySync<DbSchema>
new MemorySync<DbSchema>();
const db = new LowSync(adapter, {DbSchema})
```

## TextFileとTextFileSync
TextFileとTextFileSyncは、lowdbで提供されるテキストベースのアダプターです。
これらは、シンプルなテキスト形式のデータを読み書きするためのアダプターで、データを文字列として扱います。
TextFileは非同期操作、TextFileSyncは同期操作のためのアダプターです。

### TextFileとTextFileSyncの用途
* テキストデータの直接読み書き:
    * JSON以外のフォーマットやカスタム形式のデータをテキストで保存したい場合に便利です。
* 高度なデータ加工:
    * テキスト処理により、特定のデータフォーマットで保存するカスタムアダプターを作成できます。
* 低レベルのテキスト処理:
    * シンプルなテキストファイルにデータを保存し、必要なときにカスタムの処理で操作できます。

| /src/server/adapters/text-file-sync.ts |
|---------------------|
```ts
import { LowSync } from 'lowdb';
import { TextFileSync } from 'lowdb/node';

// TextFileSyncアダプターを使ってテキストファイルにデータを保存
const adapter = new TextFileSync('text-file-sync.txt');
const db = new LowSync(adapter, "");

db.read();
db.data ||= 'Initial Sync Data\n';
db.data += 'New line of sync data\n';
db.write();
```

### 実行結果
| /src/server/adapters/text-file-sync.txt |
|---------------------|
```txt
Initial Sync Data
New line of sync data
```

## DataFileとDataFileSync
DataFileおよびDataFileSyncアダプターの「parse」と「stringify」は、データを読み込む際と書き込む際に、それぞれ自動的に使用されます。

### parseとstringifyの使用タイミング
* 読み込み時 (readメソッドの内部)
    * readメソッドが呼ばれたとき、ファイルの内容を読み取り、parse関数によってオブジェクトに変換されます。
* 書き込み時 (writeメソッドの内部)
    * writeメソッドが呼ばれたとき、オブジェクトをstringify関数でシリアライズし、その結果をファイルに書き込みます。

:::details /src/server/adapters/data-file-sync.ts
```ts
import { LowSync } from 'lowdb';
import { DataFileSync } from 'lowdb/node';
import crypto from 'crypto';

// 暗号化・復号化用の関数
function encrypt(data: string): string {
  const cipher = crypto.createCipher('aes-256-ctr', 'mySecretKey');
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  console.log("encrypt")
  return encrypted;
}

function decrypt(encrypted: string): string {
  const decipher = crypto.createDecipher('aes-256-ctr', 'mySecretKey');
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  console.log("decrypt")
  return decrypted;
}

// 暗号化をサポートするアダプター
const encryptedAdapter = new DataFileSync('encrypted-db.json', {
  parse: (data) => JSON.parse(decrypt(data)),          // 復号化してからJSONパース
  stringify: (obj) => encrypt(JSON.stringify(obj))    // JSONシリアライズしてから暗号化
});

const db = new LowSync(encryptedAdapter, { posts: [] });

// データの読み込み（parseのタイミング）
db.read();
db.data ||= { posts: [] };
db.data.posts.push({ id: 1, title: 'Encrypted Post' });

// データの書き込み（stringifyのタイミング）
db.write();
console.log(db.data.posts);

```
:::

下記の部分でparseとstringifyを設定します。
```ts
// 暗号化をサポートするアダプター
const encryptedAdapter = new DataFileSync('dbのjsonPath', {
  parse: (data) => 読み込み時の処理
  stringify: (obj) => 書き込み時の処理
});

const db = new LowSync(encryptedAdapter, { posts: [] });
```


### 実行結果
* 読み込み時は、decriptされて出力されている。
* 書き込み時は、encryptされてjsonに登録されている。
```shell
bun data-filesync.ts
encrypt
[
  {
    id: 1,
    title: "Encrypted Post",
  }
]
```
| /src/server/adapters/encrypted-db.ts |
|---------------------|
```json
a237861e7db0e4e06ff8e33fa9552c88daca8af531ab5c9c25139c9a74689e4b8d690f836b435ff97a771c770f
```

## CustomAdapter
カスタムアダプターは、Lowクラスを使ったデータベース操作を、独自のデータソースと連携させる場合に便利です。

### カスタムアダプターの用途
独自のアダプターを作成することで、さまざまなデータソースと連携したデータベースを構築できます。
例えば、外部のAPIや特定のクラウドストレージと連携するアダプターを作成することが可能です。

:::details /src/adapters/custom-adapter.ts
```ts
// Mock API
const api = {
  async read() {
    // モックデータの読み込み
    return "Initial data";
  },
  async write(data: string) {
    // データを書き込み（ここでは仮の処理）
    console.log("Data written:", data);
  },
};

// カスタムアダプタークラスの実装
class CustomAsyncAdapter {
  constructor(private args?: any) {}

  async read() {
    const data = await api.read(); // read apiの呼び出し
    return data;
  }

  async write(data: any) {
    await api.write(data); // write apiの呼び出し
  }
}
import { Low } from "lowdb";
const adapter = new CustomAsyncAdapter();
const db = new Low(adapter, "Default data");

(async () => {
  await db.read();
  console.log("Initial data:", db.data);
  db.data = "Updated data";
  await db.write();
})();

```
:::

* CustomAsyncAdapterクラス
    * readとwriteメソッドが非同期で実行され、データの読み書きが可能です。
    * api mockを使って仮のデータソースから読み書きしています。

### 実行結果
```shell
bun custom-adapter.ts
Initial data: Initial data
Data written: Updated data
```

# まとめ
やはりlowdbの強みとなるシンプルな操作と軽量なデータベース設計に魅力を感じました。
単体テスト、プロトタイプ開発や小規模なWebアプリケーションの際にサクッとdbを導入できるのも良いかと感じました。
また、アダプターも含めカスタマイズ性が想像以上に高かったので、使用する機会が以外とありそうです。

# 参考
[lowdb 公式ドキュメント](https://github.com/typicode/lowdb#readme)
