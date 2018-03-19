-- Up
CREATE TABLE User (
  Id CHAR(16) NOT NULL PRIMARY KEY,
  Email CHAR(100) UNIQUE,
  Password CHAR(100) UNIQUE,
  Salt CHAR(100),
  Registered DATETIME DEFAULT CURRENT_TIMESTAMP,
  LastLogin DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TEMPORARY TABLE Profile_backup(Id,Title,StyleId,StyleParameters);
INSERT INTO Profile_backup SELECT Id,Title,StyleId,StyleParameters FROM Profile;
DROP TABLE Profile;
CREATE TABLE Profile (
  Id CHAR(16) NOT NULL PRIMARY KEY,
  Title CHAR(100),
  StyleId CHAR(20) DEFAULT 'default',
  StyleParameters TEXT DEFAULT '',
  Owner CHAR(16),
  FOREIGN KEY(Owner) REFERENCES User(Id)
);
INSERT INTO Profile SELECT Id,Title,StyleId,StyleParameters FROM Profile_backup;
DROP TABLE Profile_backup;
-- Down
DROP TABLE User;
CREATE TEMPORARY TABLE Profile_backup(Id,Title,StyleId,StyleParameters);
INSERT INTO Profile_backup SELECT Id,Title,StyleId,StyleParameters FROM Profile;
DROP TABLE Profile;
ALTER TABLE Profile_backup RENAME TO Profile;
