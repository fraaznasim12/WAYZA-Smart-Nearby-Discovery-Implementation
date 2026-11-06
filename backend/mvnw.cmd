@REM =========================================================================
@REM AccessMap Maven Wrapper for Windows (CMD / PowerShell)
@REM =========================================================================
@echo off
setlocal

if "%JAVA_HOME%"=="" (
    if exist "C:\Program Files\Java\latest\jdk-26" (
        set "JAVA_HOME=C:\Program Files\Java\latest\jdk-26"
    )
)

if "%JAVA_HOME%"=="" (
    echo Error: JAVA_HOME is not set and no JDK was found in standard path.
    exit /b 1
)

set "JAVACMD=%JAVA_HOME%\bin\java.exe"
if not exist "%JAVACMD%" (
    echo Error: %JAVACMD% does not exist.
    exit /b 1
)

set "PROJECT_DIR=%~dp0"
if "%PROJECT_DIR:~-1%"=="\" set "PROJECT_DIR=%PROJECT_DIR:~0,-1%"
set "WRAPPER_JAR=%PROJECT_DIR%\.mvn\wrapper\maven-wrapper.jar"

if not exist "%WRAPPER_JAR%" (
    echo Error: Could not find %WRAPPER_JAR%
    exit /b 1
)

"%JAVACMD%" "-Dmaven.multiModuleProjectDirectory=%PROJECT_DIR%" -cp "%WRAPPER_JAR%" org.apache.maven.wrapper.MavenWrapperMain %*
exit /b %ERRORLEVEL%
