REM https://github.com/npm/npm/issues/2938 need to use call before NPM
call npm install -g serverless
ECHO Finished installing serverless

call serverless --version
