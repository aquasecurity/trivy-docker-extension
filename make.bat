@echo off


IF /I "%1"=="build-app" GOTO build-app
IF /I "%1"=="build-dev" GOTO build-dev
IF /I "%1"=="deploy-dev" GOTO deploy-dev
IF /I "%1"=="dev-debug" GOTO dev-debug
IF /I "%1"=="dev-reset" GOTO dev-reset
GOTO error

:build-app
	@npm run-script build
	GOTO :EOF

:build-dev
	CALL make.bat build-app
	@docker build -t trivy-docker-extension:development .
	GOTO :EOF

:deploy-dev
	CALL make.bat build-dev
	@docker extension rm trivy-docker-extension:development || true
	@docker extension install trivy-docker-extension:development
	GOTO :EOF

:dev-debug
	@docker extension dev debug trivy-docker-extension:development
	GOTO :EOF

:dev-reset
	GOTO :EOF

:error
    IF "%1"=="" (
        ECHO make: *** No targets specified and no makefile found.  Stop.
    ) ELSE (
        ECHO make: *** No rule to make target '%1%'. Stop.
    )
    GOTO :EOF
