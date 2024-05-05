import { LowSync } from 'lowdb';
import { TextFileSync } from 'lowdb/node';

// TextFileSyncアダプターを使ってテキストファイルにデータを保存
const adapter = new TextFileSync('text-file-sync.txt');
const db = new LowSync(adapter, "");

db.read();
db.data ||= 'Initial Sync Data\n';
db.data += 'New line of sync data\n';
db.write();