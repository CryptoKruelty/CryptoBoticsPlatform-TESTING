
@echo off
SETLOCAL EnableDelayedExpansion
ECHO Loading environment variables from .env file...

REM Parse .env file and set environment variables
FOR /F "usebackq tokens=* eol=#" %%A IN ("%~dp0.env") DO (
    SET LINE=%%A
    IF NOT "!LINE:~0,1!"=="#" (
        SET %%A
    )
)

ECHO Environment variables loaded.
SET NODE_ENV=development
ECHO Starting application...
npx tsx server/index.ts
