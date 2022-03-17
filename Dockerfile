FROM scratch

LABEL org.opencontainers.image.title="Trivy" \
    org.opencontainers.image.description="Run Trivy against remote or locally stored images." \
    org.opencontainers.image.vendor="Aqua Security Software Ltd." \
    com.docker.desktop.extension.api.version=">= 0.2.0" \
    com.docker.desktop.extension.icon="https://raw.githubusercontent.com/aquasecurity/trivy/9f6842888ef5e3313cd10f0ce73652db5cba0337/docs/imgs/trivy.svg"


COPY ui ./ui
COPY trivy.svg .
COPY metadata.json .