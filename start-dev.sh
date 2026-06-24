#!/bin/bash
cd /home/z/my-project
while true; do
  if ! pgrep -f "next dev -p 3000" > /dev/null; then
    bun run dev > dev.log 2>&1 &
    disown
  fi
  sleep 8
done
