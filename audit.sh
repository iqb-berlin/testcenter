#!/bin/bash

# https://www.baeldung.com/linux/auditd-monitor-file-access

augenrules --load
auditd
service apache2 restart

NOW=$(date +"%H:%M:%S")


bash audit/get_files.sh

CALLS=$(aureport -f -i --start "$NOW" | grep /usr/sbin/apache2)

echo ""
echo "--------------------------------------------------------------------------------------------------------"
echo "Filesystem Calls:"
echo "$CALLS"

echo ""
echo "--------------------------------------------------------------------------------------------------------"
echo "Filesystem Calls Count:"
echo "$CALLS" | wc -l