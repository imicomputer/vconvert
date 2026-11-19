#!/bin/sh
set -eu

for compose_file in compose.yaml compose.amd.yaml compose.nvidia.yaml; do
  docker compose -f "$compose_file" config --quiet
  resolved=$(UPLOAD_DIR=/custom/uploads PUBLISH_PORT=8080 PORT=3000 \
    docker compose -f "$compose_file" config --format json)
  printf '%s' "$resolved" | python3 -c '
import json
import sys

config = json.load(sys.stdin)
service = config["services"]["vconvert"]
assert service["environment"]["UPLOAD_DIR"] == "/custom/uploads"
assert service["volumes"][0]["target"] == "/custom/uploads"
assert service["ports"][0]["published"] == "8080"
assert service["ports"][0]["target"] == 3000
'
done

resolved=$(UPLOAD_DIR= docker compose -f compose.yaml config --format json)
printf '%s' "$resolved" | python3 -c '
import json
import sys

service = json.load(sys.stdin)["services"]["vconvert"]
assert service["environment"]["UPLOAD_DIR"] == "/tmp/uploads"
assert service["volumes"][0]["target"] == "/tmp/uploads"
'

printf '%s\n' 'Compose variants and UPLOAD_DIR/PUBLISH_PORT overrides passed.'