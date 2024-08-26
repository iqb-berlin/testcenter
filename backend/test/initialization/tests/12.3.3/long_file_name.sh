#!/bin/bash

source backend/test/initialization/functions/functions.sh

echo_h1 "Long file names cause trouble. 12.3.3 should fix this finally!";

# so already installed patches can be re-installed

echo_h2 "Install Version 12.3.2";
fake_version 12.3.2
php backend/initialize.php \
--skip_read_workspace_files=true \
--skip_db_integrity_check=true
expect_init_script_ok

echo_h2 "12.3.2 broke on filenames 30+ characters"
echo "<Testtakers><Metadata><Description>30+ chars in filename</Description></Metadata><Group id=\"x\" label=\"x\"><Login mode=\"run-hot-restart\" name=\"x\"><Booklet>BOOKLET.SAMPLE-1</Booklet></Login></Group></Testtakers>" \
  > vo_data/ws_1/Testtakers/2023-04-28_V8DeuTBAPilot_LOGINS_Testtaker_FMB-A.xml
php backend/initialize.php
(
  expect_init_script_failed
)
remove_error_lock
if [ $? = 1 ] then
  return 1
fi

echo_h2 "But 12.3.3 should accept up to 120 characters";
take_current_version
php backend/initialize.php
expect_init_script_ok

echo_h2 "File with name of 120+ characters gets ignored";
echo "<Testtakers><Metadata><Description>120+ chars in filename</Description></Metadata><Group id=\"y\" label=\"y\"><Login mode=\"run-hot-restart\" name=\"y\"><Booklet>BOOKLET.SAMPLE-1</Booklet></Login></Group></Testtakers>" \
  > vo_data/ws_1/Testtakers/123456789_1_123456789_2_123456789_3_123456789_4_123456789_5_123456789_6_123456789_7_123456789_8_123456789_9_123456789_10_123456789_A.xml
php backend/initialize.php
expect_init_script_ok