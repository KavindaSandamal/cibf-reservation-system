#!/bin/bash
while true; do
    echo "=== $(date) ==="
    echo "Memory:"
    free -h | grep Mem
    echo "Swap:"
    free -h | grep Swap
    echo "I/O Wait:"
    iostat -x 1 1 | grep nvme0n1 | awk '{print "Util: "$NF"% | Await: "$10"ms"}'
    echo "Top processes:"
    ps aux --sort=-%mem | head -5
    echo "---"
    sleep 30
done
