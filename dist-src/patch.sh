#!/bin/bash

REPO_URL=iqb-berlin/testcenter

source .env


# 14.0.2: include mySQL-config
wget -nv -O config/my.cnf https://raw.githubusercontent.com/${REPO_URL}/${VERSION}/scripts/database/my.cnf
