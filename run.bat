@echo off
setlocal
chcp 65001 >nul
pushd "%~dp0"

if /I "%~1"=="python" goto run_python
if /I "%~1"=="java" goto run_java
if /I "%~1"=="csharp" goto run_csharp

echo Kullanim:
echo   run.bat python
echo   run.bat java
echo   run.bat csharp
echo.
echo Gereksinimler: Python 3.9+, Java JDK ve .NET 9 SDK.
popd
exit /b 0

:run_python
where python >nul 2>nul
if errorlevel 1 (
    echo Python bulunamadi. Python 3.9 veya ustunu yukleyip PATH'e ekleyin.
    set "RESULT=1"
    goto finish
)
python miner.py
set "RESULT=%ERRORLEVEL%"
goto finish

:run_java
where javac >nul 2>nul
if errorlevel 1 (
    echo Java derleyicisi javac bulunamadi. Java JDK kurup PATH'e ekleyin.
    set "RESULT=1"
    goto finish
)
where java >nul 2>nul
if errorlevel 1 (
    echo Java bulunamadi. Java JDK kurup PATH'e ekleyin.
    set "RESULT=1"
    goto finish
)
if not exist "%TEMP%\idle-miner-java" mkdir "%TEMP%\idle-miner-java"
javac -encoding UTF-8 -d "%TEMP%\idle-miner-java" MinerGame.java
if errorlevel 1 (
    set "RESULT=1"
    goto finish
)
java -Dfile.encoding=UTF-8 -cp "%TEMP%\idle-miner-java" MinerGame
set "RESULT=%ERRORLEVEL%"
goto finish

:run_csharp
where dotnet >nul 2>nul
if errorlevel 1 (
    echo .NET bulunamadi. .NET 9 SDK kurup PATH'e ekleyin.
    set "RESULT=1"
    goto finish
)
dotnet run --project "%~dp0csharp\MinerGame.csproj"
set "RESULT=%ERRORLEVEL%"
goto finish

:finish
popd
exit /b %RESULT%
