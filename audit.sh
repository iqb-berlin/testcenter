#!/bin/bash
# call me like AUTH_TOKEN=a63a30f1ca53b08.05509630 bash audit.sh

# https://www.baeldung.com/linux/auditd-monitor-file-access

augenrules --load
auditd
service apache2 restart

rm mem.log
free -s 0.01 > mem.log &
# watch -n1 pidstat -hurd -C apache2

START_TS=$(date +"%H:%M:%S")
START_TS=$(date +"%s%N")

# Run stuff
bash audit/get_files.sh

# stop timer
END_TS=$(date +"%s%N")
DURATION="$(($END_TS-$START_TS))"

# stop recorder
kill %1

# show measurements
CALLS=$(aureport -f -i --start "$START_TS" | grep /usr/sbin/apache2)

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
echo "Duration (in ns): "
echo $DURATION

echo ""
echo "--------------------------------------------------------------------------------------------------------"
echo "Filesystem Calls Count:"
echo "$CALLS" | wc -l