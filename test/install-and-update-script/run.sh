#!/bin/bash
source /test/lib/functions.sh
source /test/lib/helper.sh

echo_h1 "Testing install and update scripts!"

before_all

source /test/tests/current-installer.sh
source /test/tests/install-15.0.0.sh




echo_h1 "Tests finished."