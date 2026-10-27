# Boulder completion slider — focused mobile verification

**Result:** PASS for the requested scoring journey. No app code was changed.

## Setup and cleanup

- Used existing open event `b76a7cf7-6d43-4aad-b72b-991517976a0b` (`RanvensWall`); it remained open and unmodified.
- Created anonymous scorecard `3a354a6c-6ee8-4e50-9b55-004f517f47dd` with unique name `MobileSlider-v3xUZcUQ`, birth year 2014, gender O, squad RavensWall, accepted terms, and no email.
- Deleted only that scorecard and its 12 attempt records after collecting results. Database verification found zero remaining rows for the scorecard/children; the existing event remained open.

## Checks and outcomes

- Failed-attempt stepper: `+` advanced 0→4 and disabled at 4; `−` returned 4→0 and disabled at 0. Changes saved immediately as append-only records.
- Touch input: used Chromium CDP `Input.dispatchTouchEvent` (`touchStart` / `touchMove` / `touchEnd`) on the actual slider thumb; did not set component state or invoke `onTrigger`.
  - Short left-to-right drag canceled and returned the thumb to its start; no confirmation and no new API record.
  - Full left-to-right drag opened completion confirmation only; history remained unchanged until confirmation.
  - Cancel left the score and history unchanged. A second full drag followed by Confirm saved completion in 1 attempt for 10 points.
  - Reload retained 10 points, 1/20 completed, and the completed Boulder 1 result.
  - Right-to-left touch drag opened undo confirmation only. Cancel preserved the completed result and history; a second drag and Confirm saved an incomplete record retaining 1 failed attempt, without deleting earlier records.
- Keyboard: focusing the incomplete slider and pressing `End` opened completion confirmation with attempts prefilled to 2; focusing Confirm and pressing Enter saved a 2-attempt completion for 7 points. Focusing the completed slider and pressing `ArrowLeft` opened undo confirmation with 2 failed attempts to keep; focusing Confirm and pressing Enter saved the undo.
- API history: canceled slider actions added no records. Final pre-cleanup history contained 12 Boulder 1 records, each attributed to the anonymous competitor, linked through valid `previousRecordId` references to a single null root. Completion and undo records were appended; earlier records remained.
- Responsive layout: at 360×844, 390×844, and 430×844, document/body width equaled viewport width (no horizontal overflow). The Boulder sheet and its Close/stepper controls fit. Pending confirmation Cancel and Confirm buttons were visible and enabled at all three widths.
- No broader event lifecycle or permission checks were performed.

## Screenshot evidence

- Sheets: 360px `cpis7u`, 390px `ahj86t`, 430px `9ny9is`.
- Confirmation buttons: 360px `ecahl9`, 390px `e0wdt9`, 430px `cr1x94`.
- Short-drag canceled state: `n3x8r6`.
- Full-drag confirmation: `77ff3s`.
- Saved completion: `0mjc3r`; persisted after reload: `44evkt`.
- Touch undo confirmation: `sc37l0`; final keyboard undo confirmation: `iez7sd`.

## Notes

One immediate API history read during rapid stepper saves briefly returned one fewer record than the UI; a settled read 500 ms later matched the UI exactly. No data loss was observed. Final cleanup removed the test card and all its child records.
