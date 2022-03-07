
.PHONY: build-app
build-app:
	@npm run-script build

.PHONY: build-dev
build-dev: build-app
	@docker build -t trivy-docker-extension:development .

.PHONY: deploy-dev
deploy-dev: build-dev
	@docker extension rm trivy-docker-extension:development || true
	@docker extension install trivy-docker-extension:development

.PHONY: dev-debug
dev-debug:
	@docker extension dev debug trivy-docker-extension:development

.PHONY: dev-reset
dev-reset:
	@docker extension dev reset trivy-docker-extension:development

.PHONY: remove-dev
remove-dev:
	@docker extension rm trivy-docker-extension:development || true
