#!/bin/bash
# ddkkbot 헬스체크
if systemctl is-active --quiet ddkkbot; then
  echo "ddkkbot: running"
  exit 0
else
  echo "ddkkbot: not running"
  exit 1
fi
