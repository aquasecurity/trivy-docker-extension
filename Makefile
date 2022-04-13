IMAGE?=aquasec/trivy-docker-extension
TAG?=latest

BUILDER=buildx-multi-arch

STATIC_FLAGS=CGO_ENABLED=0
LDFLAGS="-s -w"
GO_BUILD=$(STATIC_FLAGS) go build -trimpath -ldflags=$(LDFLAGS)

.PHONY: bin
bin: ## Build the binary for the current plarform
	@echo "$(INFO_COLOR)Building...$(NO_COLOR)"
	$(GO_BUILD) -o bin/creds-service ./service

.PHONY: build-app
build-app:
	@npm run-script build

.PHONY: build-dev
build-dev:
	@DOCKER_BUILDKIT=1 docker build -t trivy-docker-extension:development .

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

.PHONY: prepare-buildx
prepare-buildx: ## Create buildx builder for multi-arch build, if not exists
	docker buildx inspect $(BUILDER) || docker buildx create --name=$(BUILDER) --driver=docker-container --driver-opt=network=host

.PHONY: release-extension
release-extension: prepare-buildx
	@docker buildx build --push --builder=$(BUILDER) --platform=linux/amd64,linux/arm64 --build-arg TAG=$(TAG) --tag=$(IMAGE):$(TAG) .