#!/bin/bash

# https://www.baeldung.com/linux/auditd-monitor-file-access

augenrules --load
auditd
service apache2 restart

rm mem.log
free -s 0.01 > mem.log &

NOW=$(date +"%H:%M:%S")

# Run stuff
bash audit/get_files.sh

# stop recorder
kill %1

# show measurements
CALLS=$(aureport -f -i --start "$NOW" | grep /usr/sbin/apache2)

echo ""
echo "--------------------------------------------------------------------------------------------------------"
echo "Memory"
cat mem.log



echo ""
echo "--------------------------------------------------------------------------------------------------------"
echo "Filesystem Calls:"
echo "$CALLS"

echo ""
echo "--------------------------------------------------------------------------------------------------------"
echo "Filesystem Calls Count:"
echo "$CALLS" | wc -l