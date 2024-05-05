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
