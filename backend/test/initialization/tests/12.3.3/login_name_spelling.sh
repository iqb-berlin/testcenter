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

echo_h2 "12.3.2 mistakenly handles login-names case-insensitive"
echo "<Testtakers><Metadata><Description>UC</Description></Metadata><Group id=\"X\" label=\"x\"><Login mode=\"run-hot-restart\" name=\"x\"><Booklet>BOOKLET.SAMPLE-1</Booklet></Login></Group></Testtakers>" > vo_data/ws_1/Testtakers/uc.xml
echo "<Testtakers><Metadata><Description>UC</Description></Metadata><Group id=\"x\" label=\"x\"><Login mode=\"run-hot-restart\" name=\"x\"><Booklet>BOOKLET.SAMPLE-1</Booklet></Login></Group></Testtakers>" > vo_data/ws_1/Testtakers/lc.xml
php backend/initialize.php
(
  expect_init_script_failed
)
remove_error_lock
if [ $? = 1 ] then
  return 1
fi

echo_h2 "But 12.3.3 should handle it case-sensitive";
take_current_version
php backend/initialize.php
expect_init_script_ok