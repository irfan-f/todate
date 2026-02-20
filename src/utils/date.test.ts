/**
 * Unit test pattern for this repo:
 * - Colocate: put tests in <module>.test.ts next to the module (or *.spec.ts).
 * - One describe() per exported function or logical group; one it() per case.
 * - Prefer timezone-agnostic assertions for dates (e.g. match /^YYYY-MM-DD/ or date parts)
 *   so tests pass in any CI/local environment.
 */
import { describe, it, expect } from 'vitest'
import { dateValueToIso, isoToDatetimeLocal, schoolPeriodToCalendarRange } from './date'

describe('dateValueToIso', () => {
  it('returns ISO for day kind', () => {
    const iso = dateValueToIso(
      { kind: 'day', year: 2020, month: 6, day: 15 },
      null
    )
    expect(iso).toMatch(/^2020-06-15T\d{2}:\d{2}:\d{2}/)
  })

  it('returns ISO for month kind', () => {
    const iso = dateValueToIso(
      { kind: 'month', year: 2021, month: 3 },
      null
    )
    expect(iso).toMatch(/^2021-03-15T\d{2}:\d{2}:\d{2}/)
  })

  it('returns ISO for datetime kind', () => {
    const iso = dateValueToIso(
      { kind: 'datetime', iso: '2022-01-10T14:30:00.000Z' },
      null
    )
    expect(iso).toBe('2022-01-10T14:30:00.000Z')
  })

  it('uses school start when converting school kind', () => {
    const iso = dateValueToIso(
      { kind: 'school', schoolYear: 1, quarter: 1 },
      { referenceYear: 2000, month: 9, day: 1 }
    )
    expect(iso).toMatch(/^2000-09-01T\d{2}:\d{2}:\d{2}/)
  })
})

describe('isoToDatetimeLocal', () => {
  it('formats ISO to YYYY-MM-DDTHH:mm', () => {
    const out = isoToDatetimeLocal('2023-12-25T12:00:00.000Z')
    expect(out).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)
    expect(out).toContain('2023-12-25')
  })

  it('pads single-digit month and day', () => {
    const out = isoToDatetimeLocal('2024-01-15T12:00:00.000Z')
    expect(out).toMatch(/^2024-01-\d{2}T\d{2}:\d{2}$/)
  })
})

describe('schoolPeriodToCalendarRange', () => {
  it('returns start and end for year 1 Q1 with Sep start', () => {
    const { start, end } = schoolPeriodToCalendarRange(
      1,
      'quarter',
      1,
      { referenceYear: 2000, month: 9, day: 1 }
    )
    expect(start.getFullYear()).toBe(2000)
    expect(start.getMonth()).toBe(8)
    expect(start.getDate()).toBe(1)
    expect(end.getFullYear()).toBe(2000)
    expect(end.getMonth()).toBe(10)
    expect(end.getDate()).toBe(30)
  })
})
