# TestFlight - Edge to Edge 1.0 (1)

## New app (App Store Connect › Apps › +)
- Platform: iOS
- Name: Edge to Edge
- Primary language: English (U.S.)
- Bundle ID: com.javinavarro.edgetoedge
- SKU: edgetoedge
- User access: Full access

## Test information (TestFlight › Test Information)
**Beta App Description**
Edge to Edge is a free Safari extension for the folded iPhone Duo. On the outer display Safari leaves an empty strip down the side of every page; with Edge to Edge turned on, pages use the whole display, including fixed headers, cookie banners and bottom bars.

**Feedback email:** javinv@mac.com

**Marketing URL / Privacy Policy URL**
- https://github.com/javinv/edge-to-edge
- https://github.com/javinv/edge-to-edge/blob/main/PRIVACY.md

## What to Test (build 1)
Turn on the extension in Settings › Apps › Safari › Extensions › Edge to Edge (Allow Extension, All Websites › Allow). Fold the iPhone and browse in Safari: pages should reach the right edge of the outer display, under Safari's buttons. Tap the Edge to Edge button in Safari to turn it off for a site. Report any site that looks wrong.

## Beta App Review information
- Contact: Francisco Javier Navarro Villanúa, javinv@mac.com, phone (required, fill in)
- Sign-in required: No
- Notes for review:
  Edge to Edge is a Safari Web Extension; the app itself only explains how to enable it. To review: install, open Settings › Apps › Safari › Extensions › Edge to Edge, turn on Allow Extension and set All Websites to Allow. The extension only acts on the folded iPhone Duo's outer display, where Safari gives pages a viewport narrower than the screen (382 of 466 points). It rewrites the page's viewport meta tag to the display's size so content fills the screen. On other iPhones and on the inner display nothing changes, so in the simulator use the "iPhone Duo" device. No data is collected and no network requests are made.

## External group
- Group name: Public
- Public link: enable, tester limit 10,000 (or lower)
- Export compliance: uses no encryption beyond Apple's (ITSAppUsesNonExemptEncryption = NO)
