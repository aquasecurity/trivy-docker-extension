FROM scratch

LABEL org.opencontainers.image.title="Trivy" \
    org.opencontainers.image.description="Run Trivy against an locally stored images." \
    org.opencontainers.image.vendor="Aqua Security Software Ltd." \
    com.docker.desktop.extension.api.version="0.2.0"

COPY ui ./ui
COPY trivy.svg .
COPY metadata.json .