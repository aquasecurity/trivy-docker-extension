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

	log.Default().Printf("Event body: %#v", request.Body)

	requestUrl := fmt.Sprintf("https://www.google-analytics.com/mp/collect?measurement_id=%s&api_secret=%s", measurementID, secretKey)
	req, err := http.NewRequest(http.MethodPost, requestUrl, strings.NewReader(request.Body))
	if err != nil {
		return apiResponse, err
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return apiResponse, err
	}

	apiResponse.StatusCode = resp.StatusCode
	return apiResponse, nil
}

func main() {
	lambda.Start(handleRequest)
}
