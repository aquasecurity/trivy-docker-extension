package auth

import (
	"bytes"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"
)

type Response struct {
	Status  int      `json:"status"`
	Message string   `json:"message"`
	Data    string   `json:"data,omitempty"`
	Errors  []string `json:"errors,omitempty"`
}

const cspmUrl = "https://api.cloudsploit.com/v2/tokens"

func ValidateCredentials(key, secret string) (string, error) {
	body := `{"validity":30,"allowed_endpoints":["ANY:v2/build/twirp/buildsecurity.BuildSecurity/*"]}`

	req, err := http.NewRequest("POST", cspmUrl, bytes.NewBuffer([]byte(body)))
	if err != nil {
		return "", err
	}

	timestampString := strconv.Itoa(int(time.Now().Unix()))
	someString := timestampString + "POST/v2/tokens" + body
	signature, err := ComputeHmac256(someString, secret)
	if err != nil {
		return "", err
	}

	req.Header.Add("x-signature", signature)
	req.Header.Add("x-timestamp", timestampString)
	req.Header.Add("x-api-key", key)

	client := &http.Client{}
	resp, err := client.Do(req)

	if err != nil {
		return "", fmt.Errorf("failed sending jwt request token with error: %w", err)
	}

	defer func() { _ = resp.Body.Close() }()

	var response Response
	err = json.NewDecoder(resp.Body).Decode(&response)
	if err != nil {
		return "", fmt.Errorf("failed decoding response with error: %w", err)
	}

	if response.Status != 200 {
		var e = "unknown error"
		if len(response.Errors) > 0 {
			e = response.Errors[0]
		}
		return "", fmt.Errorf("failed to generate Aqua token with error: %s, %s", response.Message, e)
	}
	return response.Data, nil
}

func ComputeHmac256(message string, secret string) (string, error) {
	key := []byte(secret)
	h := hmac.New(sha256.New, key)
	_, err := h.Write([]byte(message))
	if err != nil {
		return "", fmt.Errorf("failed compute hmac: %w", err)
	}
	return hex.EncodeToString(h.Sum(nil)), nil
}
