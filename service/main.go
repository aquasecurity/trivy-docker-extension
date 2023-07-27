package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"

	"github.com/aquasecurity/trivy-docker-extension/service/internal/auth"
	"github.com/aquasecurity/trivy-docker-extension/service/internal/socket"
	"github.com/labstack/echo"
	"github.com/sirupsen/logrus"
)

const credsFile = "/creds/.aqua"

type Credentials struct {
	AquaKey     string `json:"aqua_key"`
	AquaSecret  string `json:"aqua_secret"`
	AquaCSPMUrl string `json:"aqua_cspm_url"`
}

func main() {
	var socketPath = flag.String("socket", "/run/guest-services/plugin-trivy.sock", "Unix domain socket to listen on")
	var testPort = flag.Int("testPort", 0, "Test port to expose instead of socket")
	flag.Parse()
	unixSocket := "unix:" + *socketPath
	logrus.Infof("Starting listening on %s", unixSocket)
	router := echo.New()
	router.HideBanner = true

	startURL := ""

	if *testPort != 0 {
		startURL = fmt.Sprintf(":%d", *testPort)
	} else {
		ln, err := socket.ListenOn(unixSocket)
		if err != nil {
			log.Fatal(err)
		}
		router.Listener = ln
	}

	router.POST("/credentials", writeCredentials)
	router.GET("/credentials", getCredentials)
	router.DELETE("/credentials", deleteCredentials)

	log.Fatal(router.Start(startURL))
}

func deleteCredentials(ctx echo.Context) error {
	logrus.Info("Received delete credentials request")
	return os.Remove(credsFile)
}

func writeCredentials(ctx echo.Context) error {
	logrus.Info("Recieved credential write request")

	if err := os.MkdirAll(filepath.Dir(credsFile), os.ModePerm); err != nil {
		return internalError(ctx, err)
	}

	creds := new(Credentials)
	if err := ctx.Bind(creds); err != nil {
		return internalError(ctx, err)
	}
	validated, err := auth.ValidateCredentials(creds.AquaKey, creds.AquaSecret, creds.AquaCSPMUrl)
	if err != nil || validated == "" {
		return internalError(ctx, err)
	}
	content, err := json.Marshal(creds)
	if err != nil {
		return internalError(ctx, err)
	}
	return os.WriteFile(credsFile, content, os.ModePerm)
}

func getCredentials(ctx echo.Context) error {
	logrus.Info("Recieved credential get request")
	var creds Credentials
	content, err := os.ReadFile(credsFile)
	if err != nil {
		return ctx.JSON(http.StatusOK, creds)
	}
	if err != json.Unmarshal(content, &creds) {
		logrus.Errorf("Error occurred while unmarshalling creds file, returning empty creds file: %w", err)
		return ctx.JSON(http.StatusOK, creds)
	}
	return ctx.JSON(http.StatusOK, creds)
}

func internalError(ctx echo.Context, err error) error {
	logrus.Error(err)
	return ctx.JSON(http.StatusInternalServerError, HTTPMessageBody{Message: err.Error()})
}

type HTTPMessageBody struct {
	Message string
}
