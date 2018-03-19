-- Up

ALTER TABLE Profile
  ADD COLUMN BgMusicUrl CHAR(150) DEFAULT 'default';

-- Down
CREATE TEMPORARY TABLE Profile_backup(Id,Title, StyleId, StyleParameters);
INSERT INTO Profile_backup SELECT Id, Title, StyleId, StyleParameters FROM Profile;
DROP TABLE Profile;
ALTER TABLE Profile_backup RENAME TO Profile;
