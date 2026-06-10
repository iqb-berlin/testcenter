ALTER TABLE tests
  MODIFY file_id VARCHAR(120) NOT NULL COMMENT 'This is the real field mapping to the booklet ID, can have same value more than once. `name` has additional information regarding adaptivity and the pre-configured state of the test.',
  MODIFY name VARCHAR(250) NOT NULL COMMENT 'This includes the file_id + the symbol "#" for further information for adaptivity and the pre-configured state of the test - the combination of all configs must be unique';
