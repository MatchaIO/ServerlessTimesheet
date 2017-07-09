#!/usr/bin/env bash
# https://github.com/npm/npm/issues/2938 need to use call before NPM
npm install -g serverless
ECHO Finished installing serverless

serverless --version
