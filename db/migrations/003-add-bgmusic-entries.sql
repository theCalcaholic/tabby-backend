-- Up

ALTER TABLE Profile
  ADD COLUMN BgMusicURL CHAR(150) DEFAULT 'default';

-- Down
CREATE TEMPORARY TABLE Profile_backup(Id,Title);
INSERT INTO Profile_backup SELECT Id,Title,StyleId,StyleParameters FROM Profile;
DROP TABLE Profile;
ALTER TABLE Profile_backup RENAME TO Profile;
