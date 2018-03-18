#!/usr/bin/env bash
cd "${0%/*}"

echo stopping tabby-backend service... && \
sudo systemctl stop tabby-backend.service && \
echo done. && \
echo Installing node modules... && \
sudo www-data npm install && \
echo done.
echo building source... && \
sudo -u www-data ./node_modules/.bin/tsc -p ./tsconfig.json && \
echo done. && \
echo starting tabby-backend service... && \
sudo systemctl start tabby-backend.service
