#!/bin/bash
cd "${0%/*}"
sudo systemctl stop tabby-backend.service && \
sudo su www-data -s /bin/sh -c "git pull" && \
sudo su www-data -s /bin/sh -c "npm install"
sudo su www-data -s /bin/sh -c "./node_modules/.bin/tsc -p ./tsconfig.json" && \
sudo systemctl start tabby-backend.service

