# Session Summary

## What We Built

- Expanded the portfolio with multiple case studies and supporting assets.
- Added new case study pages for:
  - Wells Fargo & Coral
  - Medibank Health Solutions
  - Palantir Issue Management
  - Simple Lighting
  - Asian Development Bank
  - Elumia
  - Star Seeker
  - AT&T Embedded Chat
- Wired the published work into the homepage and the Work page.

## Homepage Changes

- Replaced placeholder work cards with real published case studies.
- Removed the Simple Lighting card from the homepage when requested.
- Removed the green status chips from desktop and mobile card views.
- Updated the homepage contact area to use the booking flow.

## Work Page Changes

- Rebuilt the Work page so the featured carousel highlights the intended projects.
- Trimmed the top carousel to the requested set of projects.
- Removed the trailing period from the `Selected Work` heading.
- Added mobile swipe/drag support so the carousel can be moved by thumb on phones.
- Adjusted the layout multiple times so the hero and carousel height felt right.
- Changed the Work-page `Contact` link to point to `booking.html`.

## Case Study Pages

- Wells Fargo & Coral
  - Added a modal video experience with the CTA moved into the results section.
  - Removed the video overlay button and prevented the video from being downloadable.
  - Kept the horizontal scroll carousel with the last frame centering before the page continues.

- Medibank
  - Built the main case study page with situation, approach, results, and conclusion sections.

- Palantir
  - Built the case study page around unified search across fragmented service tools.

- Simple Lighting
  - Created the case study page with:
    - a comparison section for the key UI screens
    - supporting PDF screens in a horizontal scroll section
    - meaningful copy instead of page-number labels
  - Removed `.mov` source videos after compressing and using the web-friendly assets.
  - Updated the homepage thumbnail to page 11.

- Asian Development Bank
  - Added the case study page and supporting context/assets.
  - Refined the carousel imagery so the important content reads correctly.

- Elumia
  - Added the case study page and tuned the carousel crop so the top of the UI is visible.
  - Updated the portfolio thumbnail to show the top section of the page.

- Star Seeker
  - Built a mobile-first presentation inside a phone frame.
  - Rewrote the mobile copy to focus on the first screen and supporting screens.
  - Removed the mobile screenshots from the desktop carousel.
  - Adjusted the desktop carousel crop so it starts at the top of each screen.

- AT&T Embedded Chat
  - Added a new case study page based on the ATT embedded chat assets.
  - Focused the narrative on reducing cognitive load, clarifying chat states, and keeping agents inside Salesforce.

## Booking Flow

- Confirmed that the homepage contact calendar converts Bangkok time slots to the visitor's local time.
- Updated `booking.html` to match that same behavior:
  - local-time display in the UI
  - Bangkok/ICT preserved as the source of truth
  - booking modal shows both local time and ICT when they differ
  - confirmation email payload includes both times
- Kept the booking page and homepage calendar behavior aligned.

## Asset Work

- Converted and compressed Simple Lighting video assets before using them in the page.
- Created top-cropped preview assets where needed so cards and carousels show the right part of the design.
- Added ATT asset context and used the existing image set to build the new page.

## Deployments

- Multiple changes were committed and pushed to GitHub during the session.
- Final portfolio updates were published to `main`.

