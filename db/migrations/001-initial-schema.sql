-- Up
CREATE TABLE Meta (
  Key CHAR(16) NOT NULL PRIMARY KEY,
  Value CHAR(200)
);
CREATE TABLE Profile (
  Id CHAR(16) NOT NULL PRIMARY KEY,
  Title CHAR(100)
);
CREATE TABLE Tab (
  Id INTEGER PRIMARY KEY AUTOINCREMENT,
  Title CHAR(200),
  Content TEXT,
  ParentProfile CHAR(16) NOT NULL,
  FOREIGN KEY(ParentProfile) REFERENCES Profile(Id)
);
INSERT INTO Meta (Key, Value) VALUES ('version', '0.0.0');

-- Down
DROP Table Meta;
DROP Table Profile;
DROP Table Tab;
