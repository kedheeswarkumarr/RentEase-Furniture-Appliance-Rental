\
    @echo off
    title RentEase - Furniture and Appliance Rental
    cd /d "%~dp0"
    echo ==========================================
    echo           RentEase Project
    echo ==========================================
    echo.
    where node >nul 2>nul
    if errorlevel 1 (
      echo Node.js was not found. Install Node.js LTS from https://nodejs.org/
      pause
      exit /b 1
    )
    if not exist node_modules (
      echo Installing project dependencies for the first time...
      call npm.cmd install
      if errorlevel 1 (
        echo.
        echo Installation failed. Copy the error message and ask for help.
        pause
        exit /b 1
      )
    )
    echo.
    echo Starting RentEase...
    echo Keep this window open while using the website.
    echo Open http://localhost:3000 in Chrome.
    echo.
    call npm.cmd start
    echo.
    echo RentEase stopped. If an error appeared above, take a screenshot.
    pause
