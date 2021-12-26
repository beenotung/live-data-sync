#!/bin/bash
set -e
set -o pipefail

docker run --name docker-rethinkdb -v "$PWD/rethinkdb_data" rethinkdb
