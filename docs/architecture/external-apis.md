# External APIs

## WebAuthN/FIDO2 API

- **Purpose:** Passkey-based authentication for product users
- **Documentation:** https://www.w3.org/TR/webauthn-2/
- **Browser Support:** Modern browsers with WebAuthN support
- **Authentication:** Public key cryptography with passkeys
- **Rate Limits:** No external API rate limits (browser-native)

**Key Features Used:**

- `navigator.credentials.create()` - Register new passkeys
- `navigator.credentials.get()` - Authenticate with existing passkeys
- `@simplewebauthn/server` - Server-side WebAuthN operations

**Integration Notes:** Implement proper challenge generation, credential storage, and verification. Ensure browser compatibility and provide fallback guidance for unsupported browsers.

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
