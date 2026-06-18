CREATE TABLE IF NOT EXISTS children (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT NOT NULL,
  child_id TEXT NOT NULL,
  FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS daily_task_instances (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  date TEXT NOT NULL,
  meal TEXT NOT NULL,
  completed INTEGER NOT NULL DEFAULT 0,
  pages TEXT,
  child_id TEXT NOT NULL,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE
);

-- Seed Children
INSERT OR IGNORE INTO children (id, name) VALUES ('taro', 'たろう');
INSERT OR IGNORE INTO children (id, name) VALUES ('hanako', 'はなこ');

-- Seed Tasks for taro
INSERT OR IGNORE INTO tasks (id, name, icon, category, child_id) VALUES ('taro-1', 'さんすうドリル', 'pencil', 'homework', 'taro');
INSERT OR IGNORE INTO tasks (id, name, icon, category, child_id) VALUES ('taro-2', 'こくごドリル', 'pencil', 'homework', 'taro');
INSERT OR IGNORE INTO tasks (id, name, icon, category, child_id) VALUES ('taro-3', 'おんどく（音読）', 'book', 'homework', 'taro');
INSERT OR IGNORE INTO tasks (id, name, icon, category, child_id) VALUES ('taro-4', 'あさがおの水やり', 'flower', 'habit', 'taro');
INSERT OR IGNORE INTO tasks (id, name, icon, category, child_id) VALUES ('taro-5', 'ラジオ体操', 'smile', 'habit', 'taro');
INSERT OR IGNORE INTO tasks (id, name, icon, category, child_id) VALUES ('taro-6', 'はみがき（歯磨き）', 'star', 'habit', 'taro');

-- Seed Tasks for hanako
INSERT OR IGNORE INTO tasks (id, name, icon, category, child_id) VALUES ('hanako-1', 'さんすうドリル', 'pencil', 'homework', 'hanako');
INSERT OR IGNORE INTO tasks (id, name, icon, category, child_id) VALUES ('hanako-2', 'こくごドリル', 'pencil', 'homework', 'hanako');
INSERT OR IGNORE INTO tasks (id, name, icon, category, child_id) VALUES ('hanako-3', 'おんどく（音読）', 'book', 'homework', 'hanako');
INSERT OR IGNORE INTO tasks (id, name, icon, category, child_id) VALUES ('hanako-4', 'あさがおの水やり', 'flower', 'habit', 'hanako');
INSERT OR IGNORE INTO tasks (id, name, icon, category, child_id) VALUES ('hanako-5', 'ラジオ体操', 'smile', 'habit', 'hanako');
INSERT OR IGNORE INTO tasks (id, name, icon, category, child_id) VALUES ('hanako-6', 'はみがき（歯磨き）', 'star', 'habit', 'hanako');
