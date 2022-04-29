package main

import (
	"fmt"
	"net/http"
	"os"
	"strings"

	"log"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
)

func handleRequest(request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	apiResponse := events.APIGatewayProxyResponse{}

	measurementID := os.Getenv("MEASUREMENT_ID")
	secretKey := os.Getenv("API_SECRET")

	requestUrl := fmt.Sprintf("https://www.google-analytics.com/mp/collect?measurement_id=%s&api_secret=%s", measurementID, secretKey)
	req, err := http.NewRequest(http.MethodPost, requestUrl, strings.NewReader(request.Body))
	if err != nil {
		return apiResponse, err
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		log.Default().Fatal(err)
		return apiResponse, err
	}

	if resp.StatusCode != http.StatusNoContent {
		log.Default().Printf("Status code for %s is %d", request.Body, resp.StatusCode)
	}

	apiResponse.StatusCode = resp.StatusCode
	return apiResponse, nil
}

func main() {
	lambda.Start(handleRequest)
}
