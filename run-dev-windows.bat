@echo off
SETLOCAL EnableDelayedExpansion
ECHO Loading environment variables from .env file...

REM Parse .env file and set environment variables
FOR /F "tokens=*" %%A IN (.env) DO (
    SET LINE=%%A
    IF NOT "!LINE:~0,1!"=="#" (
        FOR /F "tokens=1,2 delims==" %%B IN ("!LINE!") DO (
            SET %%B=%%C
        )
    )
)

ECHO Environment variables loaded.
SET NODE_ENV=development
ECHO Starting application...
npx tsx server/index.ts