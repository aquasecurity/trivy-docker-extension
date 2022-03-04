docker build -t trivy-docker-extension:development .

docker extension rm trivy-docker-extension:development || true

docker extension install trivy-docker-extension:development

