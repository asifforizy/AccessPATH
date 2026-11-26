# AccessPath route scoring algorithm

Implemented in `accesspath-backend/src/modules/routes/routes.engine.ts` and documented
here in full.

## Why accessibility-first?

A 900 m route with two blocked sidewalks and a broken elevator is worse for a wheelchair
user than a 1.1 km route with ramps and step-free entrances. AccessPath therefore ranks
routes by **accessibility score first, travel time second**, and never presents distance
as the primary criterion.

## 1. Candidate corridors

No third-party routing provider (Google/Mapbox/OSRM) is configured, so the engine
generates up to four deterministic **candidate corridors** between origin and destination:

| Kind | Geometry |
| --- | --- |
| `direct` | origin → destination |
| `left` | origin → midpoint offset perpendicular (+90°) → destination |
| `right` | origin → midpoint offset perpendicular (−90°) → destination |
| `double-bend` | origin → 30% offset left → 70% offset right → destination |

Offset distance: `min(900 m, max(120 m, 0.08 × straight-line distance))`.

Each corridor is sampled every **120 m** (max 60 samples). Accessibility context is
loaded once per request from a bounding box covering all candidates:

- approved locations with an accessibility profile,
- barrier reports with status `PENDING` or `UNDER_REVIEW` (report GPS, falling back to the
  location pin for older rows).

A location or barrier is **inside the corridor** if it is within **80 m** of any sample.

## 2. Score formula

```
score = 100
      − distancePenalty       (0…25)
      − barrierPenalty        (0…60)
      + supportBonus          (0…18)
      + modeBonus             (0…6,  wheelchair mode only)
      − requirementPenalty    (0…20)
      − dataQualityPenalty    (0…9)
score = clamp(score, 0, 100)
```

### distancePenalty

```
detour = candidateDistance / shortestCandidateDistance − 1
distancePenalty = clamp(detour × 80, 0, 25)
```

A 10% detour costs 8 points; 31% costs the full 25.

### barrierPenalty

Per barrier inside the corridor:

```
penalty += weight[type] × proximity × modeMultiplier
proximity     = clamp(1 − distance / 80 m, 0.35, 1)
modeMultiplier= 1.25 for WHEELCHAIR on MISSING_RAMP, UNSAFE_CROSSING,
                BROKEN_FOOTPATH, BLOCKED_SIDEWALK; otherwise 1
```

| Barrier type | Weight |
| --- | --- |
| Broken elevator | 14 |
| Unsafe crossing | 14 |
| Blocked sidewalk | 11 |
| Broken footpath | 9 |
| Accessibility issue (other) | 8 |
| Location reported closed | 8 |
| Missing ramp | 7 |
| Missing feature | 5 |
| Other | 4 |
| Incorrect information | 3 |

The sum is capped at 60. If the traveller asked to avoid unsafe crossings, every unsafe
crossing adds 6 extra points.

### supportBonus

For up to 8 supporting locations inside the corridor:

```
quality = 0.45 × (accessibilityScore / 100)
        + verified ? 0.30 : 0.12
        + stepFreeEntrance ? 0.15 : 0
        + rampAvailable     ? 0.10 : 0
        + elevatorAvailable ? 0.10 : 0
        + doorAccessibility ? 0.05 : 0
quality = clamp(quality, 0, 1)

supportBonus = average(quality) × 18
```

Verified data is worth roughly 2.5× unverified data, and missing features earn nothing —
unknown is never treated as positive.

### modeBonus (wheelchair)

```
modeBonus = (step-free locations / supporting locations) × 6
```

### requirementPenalty

| Requirement | Penalty when unmet |
| --- | --- |
| `avoidStairs` (fewer than 50% step-free) | 10 |
| `requireElevator` | 6 |
| `requireRestroom` | 4 |
| `requireParking` | 2 |

### dataQualityPenalty

- No accessibility data along the corridor → **9** and a "conditions unknown" warning.
- Fewer than 50% of supporting locations verified → **4**.

## 3. Ranking and warnings

Options are sorted by `accessibilityScore` descending, then `durationSeconds` ascending.
The first option is labelled `Recommended`.

Each option returns a machine-readable `breakdown` (all six components), `support`
(sampled locations, verified ratio, step-free ratio, barrier counts) and a `warnings[]`
list with severity and distance:

```json
{
  "accessibilityScore": 82,
  "grade": "B",
  "breakdown": {
    "distancePenalty": 3.1,
    "barrierPenalty": 35.8,
    "supportBonus": 16.3,
    "modeBonus": 4.8,
    "requirementPenalty": 0,
    "dataQualityPenalty": 0
  },
  "warnings": [
    { "code": "BARRIER_BLOCKED_SIDEWALK", "severity": "high", "message": "Blocked sidewalk near …", "distanceMeters": 22 }
  ]
}
```

Grades: A ≥ 85, B ≥ 70, C ≥ 55, D ≥ 40, E < 40.

## 4. Worked example (seeded Dhaka data)

Request: Ramna Park → National Museum, `WHEELCHAIR`, `avoidStairs` + `requireElevator`.

| Option | Distance | Score | Grade |
| --- | --- | --- | --- |
| Recommended | 0.89 km | 82 | B |
| Alternative | 0.85 km | 60 | C |
| Left-side corridor | 0.89 km | 53 | D |
| Wide sweep corridor | 0.92 km | 50 | D |

The shortest corridor (0.85 km) is **not** recommended: it accumulates a larger barrier
penalty. Switching the same request to `WALKING` removes the wheelchair multiplier and the
step-free bonus (score 83 with `modeBonus: 0`).

## 5. Limitations and extension points

- **Geometry** is a candidate generator, not road-network routing. To use a real engine
  (OSRM / Valhalla / GraphHopper), replace `buildRouteCandidates()` with provider
  polylines — the scoring pipeline consumes waypoints and needs no other change.
- Corridor context is sampled at 120 m intervals, so very short barrier segments between
  samples can be missed.
- Stair data is modelled through `stepFreeEntrance`; there is no per-segment
  stair/kerb graph.
- `POST /routes/score` remains available as an **area** score (average accessibility of
  locations near the destination) and is labelled "Area score" in the UI.
