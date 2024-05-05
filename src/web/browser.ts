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