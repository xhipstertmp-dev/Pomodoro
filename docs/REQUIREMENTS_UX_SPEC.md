# Pomodoro App Redo — Requirements & UX Spec v1.0

## Scope
- Build a simple, reliable Pomodoro app with work/break cycles.
- Include intuitive controls, notifications, and edge-case handling.
- Deploy target: Vercel project `pomodoro`.

## 1) Core Timer Behavior
- Default durations:
  - Work: 25:00
  - Short break: 05:00
  - Long break: 15:00 (every 4 completed work sessions)
- Cycle rules:
  - Work complete → short break (or long break on cycle 4)
  - Break complete → work
- Timer updates each second, using wall-clock delta for drift resistance.

## 2) Controls
- Start
- Pause
- Resume
- Reset current phase
- Skip phase (confirm action to prevent accidental skip)

## 3) State Model
Track:
- `currentPhase`: `work | shortBreak | longBreak`
- `timeRemainingSeconds`
- `isRunning`
- `completedWorkSessions`
- Optional settings (durations + longBreakEvery)

Persistence:
- Save state to local storage.
- Restore on refresh/reopen.
- Fallback to safe defaults when stored data is malformed.

## 4) Notifications
On phase completion:
- in-app visual cue/banner
- optional sound cue (mute toggle)
- browser notification when permission granted

Also:
- update document title with remaining time + phase.

## 5) UX Layout
- Prominent timer display (MM:SS)
- Current phase label + cycle progress indicator
- Primary control row (start/pause/resume/reset/skip)
- Secondary controls (sound/settings/theme optional)

## 6) Accessibility
- Full keyboard accessibility
- Visible focus states
- Proper aria labels for all controls
- ARIA live updates for phase transitions
- WCAG AA contrast

## 7) Edge Cases
- Background tab throttling (must remain accurate)
- Refresh during active timer (restore state correctly)
- Multiple tabs (warn or define last-write-wins)
- Notification denied (graceful fallback)
- Audio restrictions (graceful fallback)

## 8) Acceptance Criteria (MVP)
- Start/pause/resume/reset/skip work correctly.
- Work/break/long-break cycle logic is correct.
- Notifications degrade gracefully when blocked.
- State restore works after refresh.
- Accessibility checks pass for keyboard and labels.

## 9) Suggested Follow-up Tasks
- UI integration with timer/data model module
- Notification/sound implementation
- Responsive polish + accessibility QA
- End-to-end smoke checklist before deploy
