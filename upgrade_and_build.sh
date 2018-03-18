#!/usr/bin/env bash
cd "${0%/*}"

echo stopping tabby-backend service... && \
sudo systemctl stop tabby-backend.service && \
echo done. && \
echo Updating source... && \
sudo -u www-data git pull && \
echo done. && \
./build.sh
