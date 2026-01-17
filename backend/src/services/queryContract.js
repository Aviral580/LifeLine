{
  "searchRequest": {
    "query": "string",
    "mode": "normal | emergency",
    "page": "number (pagination page number)",
    "limit": "number (results per page)",
    "filters": {
      "source": "string (optional)",
      "language": "string (optional)",
      "dateRange": {
        "from": "YYYY-MM-DD",
        "to": "YYYY-MM-DD"
      }
    }
  },
  "searchResponse": {
    "query": "string",
    "mode": "normal | emergency",
    "page": "number",
    "limit": "number",
    "totalResults": "number",
    "results": [
      {
        "title": "string",
        "description": "string",
        "source": "string",
        "url": "string",
        "publishedAt": "ISO date string",
        "trustScore": "number (0-100)",
        "crossSourceAgreement": "number (0-1)",
        "rankingScore": "number (0-100)"
      }
    ],
    "analytics": {
      "ctr": "number",
      "bounceRate": "number",
      "avgTimeOnPage": "number (seconds)"
    }
  }
}

