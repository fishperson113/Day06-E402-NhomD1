{
	"id":   "mini-hackathon-z482",
	"lang": "typescript",
	"build": {
		"docker": {
			"bundle_source": true
		},
		"hooks": {
			"postbuild": "npx next build ./frontend"
		}
	}
}
