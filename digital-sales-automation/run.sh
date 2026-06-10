#!/bin/bash
# 日本語エンコードエラーを防ぐためPython起動前に設定
export PYTHONUTF8=1
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8
export PYTHONIOENCODING=utf-8

python run_weekly.py "$@"
