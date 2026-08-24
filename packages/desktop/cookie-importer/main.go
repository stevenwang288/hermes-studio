package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/Code-Hex/browsercookie"
)

type cookieJSON struct {
	Name           string `json:"name"`
	Value          string `json:"value"`
	Domain         string `json:"domain"`
	Path           string `json:"path"`
	HostOnly       bool   `json:"hostOnly"`
	HTTPOnly       bool   `json:"httpOnly"`
	Secure         bool   `json:"secure"`
	SameSite       string `json:"sameSite"`
	ExpirationDate *int64 `json:"expirationDate,omitempty"`
}

func main() {
	log.SetFlags(0)
	browser := flag.String("browser", "chrome", "browser to import: chrome, edge, brave, all")
	flag.Parse()

	raw, err := loadCookies(*browser)
	if err != nil {
		// Check if it's a lock error
		if isLockErr(err) {
			fmt.Fprintf(os.Stderr, "LOCKED: %s is running. Please close it and try again.\n", *browser)
		} else {
			fmt.Fprintf(os.Stderr, "error: %v\n", err)
		}
		os.Exit(1)
	}

	cookies := convert(raw)
	out, err := json.MarshalIndent(cookies, "", "  ")
	if err != nil {
		fmt.Fprintf(os.Stderr, "json: %v\n", err)
		os.Exit(1)
	}
	if len(cookies) == 0 {
		fmt.Println("[]")
		return
	}
	fmt.Println(string(out))
}

func loadCookies(browser string) ([]*http.Cookie, error) {
	switch strings.ToLower(browser) {
	case "chrome":
		return browsercookie.Chrome()
	case "edge":
		return browsercookie.Edge()
	case "brave":
		return browsercookie.Brave()
	case "chromium":
		return browsercookie.Chromium()
	case "all":
		return browsercookie.Load()
	default:
		return nil, fmt.Errorf("unknown browser: %s", browser)
	}
}

func isLockErr(err error) bool {
	msg := err.Error()
	return strings.Contains(msg, "being used by another process") ||
		strings.Contains(msg, "permission denied") ||
		strings.Contains(msg, "cannot access the file")
}

func convert(raw []*http.Cookie) []cookieJSON {
	result := make([]cookieJSON, 0, len(raw))
	seen := map[string]bool{}
	for _, c := range raw {
		if c == nil || c.Name == "" || c.Value == "" {
			continue
		}
		hostOnly := !strings.HasPrefix(c.Domain, ".")
		domain := strings.TrimPrefix(c.Domain, ".")
		if domain == "" {
			domain = c.Domain
		}
		sameSite := "unspecified"
		switch c.SameSite {
		case http.SameSiteLaxMode:
			sameSite = "lax"
		case http.SameSiteStrictMode:
			sameSite = "strict"
		case http.SameSiteNoneMode:
			sameSite = "no_restriction"
		}
		var exp *int64
		if !c.Expires.IsZero() {
			u := c.Expires.Unix()
			exp = &u
		}
		key := domain + "|" + c.Name + "|" + c.Path
		if seen[key] {
			continue
		}
		seen[key] = true
		result = append(result, cookieJSON{
			Name:           c.Name,
			Value:          c.Value,
			Domain:         domain,
			Path:           c.Path,
			HostOnly:       hostOnly,
			HTTPOnly:       c.HttpOnly,
			Secure:         c.Secure,
			SameSite:       sameSite,
			ExpirationDate: exp,
		})
	}
	return result
}