package request

import (
	"bytes"
	"encoding/json"
	"io"
	"meta_page_backend/app/models/logs"
	"meta_page_backend/pkg/e"
	"net/http"
)

func SendMetaGetRequest(url string) (response_body map[string]any, err error) {
	req, _ := http.NewRequest("GET", url, nil)
	res, err := http.DefaultClient.Do(req)
	if err != nil {
		logs.Create(e.CALLAPIERROR, e.GetMsg(e.CALLAPIERROR), err.Error())
		return
	}

	defer res.Body.Close()

	info, err := io.ReadAll(res.Body)
	if err != nil {
		logs.Create(e.ERROR, e.GetMsg(e.ERROR), "[Error] read body fail: "+err.Error())
		return
	}

	err = json.Unmarshal(info, &response_body)
	if err != nil {
		logs.Create(e.ERROR, e.GetMsg(e.ERROR), "[Error] format json fail: "+err.Error())
		return
	}

	return
}

func SendMetaPostRequest(url string, payload []byte) (response_body map[string]any, err error) {
	req, _ := http.NewRequest("Post", url, bytes.NewBuffer(payload))
	req.Header.Set("Content-Type", "application/json")

	res, err := http.DefaultClient.Do(req)
	if err != nil {
		logs.Create(e.CALLAPIERROR, e.GetMsg(e.CALLAPIERROR), err.Error())
		return
	}

	defer res.Body.Close()

	info, err := io.ReadAll(res.Body)
	if err != nil {
		logs.Create(e.ERROR, e.GetMsg(e.ERROR), "[Error] read body fail: "+err.Error())
		return
	}

	err = json.Unmarshal(info, &response_body)
	if err != nil {
		logs.Create(e.ERROR, e.GetMsg(e.ERROR), "[Error] format json fail: "+err.Error())
		return
	}

	return
}

func SendMetaDeleteRequest(url string) (response_body map[string]any, err error) {
	req, _ := http.NewRequest("DELETE", url, nil)
	res, err := http.DefaultClient.Do(req)
	if err != nil {
		logs.Create(e.CALLAPIERROR, e.GetMsg(e.CALLAPIERROR), err.Error())
		return
	}

	defer res.Body.Close()

	info, err := io.ReadAll(res.Body)
	if err != nil {
		logs.Create(e.ERROR, e.GetMsg(e.ERROR), "[Error] read body fail: "+err.Error())
		return
	}

	err = json.Unmarshal(info, &response_body)
	if err != nil {
		logs.Create(e.ERROR, e.GetMsg(e.ERROR), "[Error] format json fail: "+err.Error())
		return
	}

	return
}
