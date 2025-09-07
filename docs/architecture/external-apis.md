# External APIs

## Twilio SMS API

- **Purpose:** Send SMS OTP codes for product user authentication
- **Documentation:** https://www.twilio.com/docs/sms
- **Base URL(s):** https://api.twilio.com/2010-04-01/Accounts/{AccountSid}/Messages.json
- **Authentication:** Basic Auth with Account SID and Auth Token
- **Rate Limits:** 1 SMS per phone number per minute, 100 SMS per day per phone number

**Key Endpoints Used:**

- `POST /Messages` - Send SMS OTP to product user's phone number

**Integration Notes:** Implement rate limiting to prevent abuse, handle delivery failures gracefully, and ensure secure storage of authentication credentials.

## YouTube Video Integration

- **Purpose:** Embed and display exercise demonstration videos from YouTube
- **Documentation:** https://developers.google.com/youtube/iframe_api_reference
- **Base URL(s):** https://www.youtube.com/embed/{video_id}
- **Authentication:** No authentication required for public video embedding
- **Rate Limits:** No rate limits for video embedding

**Key Features Used:**

- YouTube iframe embed API for video playback
- Video ID extraction from YouTube URLs
- Mobile-optimized video player with responsive design

**Integration Notes:** Extract video IDs from YouTube URLs, implement responsive video embeds, and handle video loading failures gracefully. Use YouTube's built-in mobile optimization for video delivery.
