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
  