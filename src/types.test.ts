/**
 * Tests for type shapes and validation (TagType, TodateType, SchoolStartDate,
 * TodatesType, TagsType, DateValue, Dataset, Store). Dataset has schoolStartDate optional.
 */
import { describe, it, expect } from 'vitest'
import {
  isTagType,
  isSchoolStartDate,
  isDateValue,
  isTodateType,
  isTodatesType,
  isTagsType,
  isDataset,
  isStore,
} from './types'

describe('isTagType', () => {
  it('accepts valid tag with _id, name, color', () => {
    expect(isTagType({ _id: 'a-b-c-d-e', name: 'Work', color: '#fff' })).toBe(true)
  })

  it('rejects null or non-object', () => {
    expect(isTagType(null)).toBe(false)
    expect(isTagType(42)).toBe(false)
    expect(isTagType([])).toBe(false)
  })

  it('rejects missing _id or empty _id', () => {
    expect(isTagType({ name: 'x', color: '#000' })).toBe(false)
    expect(isTagType({ _id: '', name: 'x', color: '#000' })).toBe(false)
  })

  it('rejects missing name or color', () => {
    expect(isTagType({ _id: 'a-b-c-d-e', color: '#000' })).toBe(false)
    expect(isTagType({ _id: 'a-b-c-d-e', name: 'x' })).toBe(false)
  })
})

describe('isSchoolStartDate', () => {
  it('accepts object with referenceYear', () => {
    expect(isSchoolStartDate({ referenceYear: 2000 })).toBe(true)
    expect(isSchoolStartDate({ referenceYear: 2020, month: 9, day: 1 })).toBe(true)
  })

  it('rejects null or non-object', () => {
    expect(isSchoolStartDate(null)).toBe(false)
    expect(isSchoolStartDate(2000)).toBe(false)
  })

  it('rejects missing or non-integer referenceYear', () => {
    expect(isSchoolStartDate({})).toBe(false)
    expect(isSchoolStartDate({ referenceYear: '2000' })).toBe(false)
    expect(isSchoolStartDate({ referenceYear: 2000.5 })).toBe(false)
  })
})

describe('isDateValue', () => {
  it('accepts school kind with schoolYear', () => {
    expect(isDateValue({ kind: 'school', schoolYear: 1 })).toBe(true)
  })

  it('accepts month kind with year and month', () => {
    expect(isDateValue({ kind: 'month', year: 2021, month: 6 })).toBe(true)
  })

  it('accepts day kind with year, month, day', () => {
    expect(isDateValue({ kind: 'day', year: 2020, month: 3, day: 15 })).toBe(true)
  })

  it('accepts datetime kind with iso', () => {
    expect(isDateValue({ kind: 'datetime', iso: '2022-01-10T14:30:00.000Z' })).toBe(true)
  })

  it('rejects null or non-object', () => {
    expect(isDateValue(null)).toBe(false)
    expect(isDateValue({ kind: 'other' })).toBe(false)
  })

  it('rejects unknown kind', () => {
    expect(isDateValue({ kind: 'invalid' })).toBe(false)
  })
})

describe('isTodateType', () => {
  const validTag = { _id: 'a-b-c-d-e', name: 'Tag', color: '#ccc' }

  it('accepts valid todate with _id, title, date, tags', () => {
    expect(
      isTodateType({
        _id: 'x-y-z-1-2',
        title: 'Event',
        date: '2023-01-15T00:00:00.000Z',
        tags: [validTag],
      })
    ).toBe(true)
  })

  it('accepts todate with optional dateDisplay and comment', () => {
    expect(
      isTodateType({
        _id: 'x-y-z-1-2',
        title: 'Event',
        date: '2023-01-15T00:00:00.000Z',
        tags: [],
        dateDisplay: { kind: 'day', year: 2023, month: 1, day: 15 },
        comment: 'Note',
      })
    ).toBe(true)
  })

  it('rejects missing _id, title, date, or tags', () => {
    expect(isTodateType({ title: 'x', date: '2023-01-01', tags: [] })).toBe(false)
    expect(isTodateType({ _id: 'a-b-c-d-e', date: '2023-01-01', tags: [] })).toBe(false)
    expect(isTodateType({ _id: 'a-b-c-d-e', title: 'x', tags: [] })).toBe(false)
    expect(isTodateType({ _id: 'a-b-c-d-e', title: 'x', date: '2023-01-01' })).toBe(false)
  })

  it('rejects invalid tag in tags array', () => {
    expect(
      isTodateType({
        _id: 'a-b-c-d-e',
        title: 'x',
        date: '2023-01-01',
        tags: [{ _id: 'a-b-c-d-e', name: 'T', color: 'red' }, { bad: 'tag' }],
      })
    ).toBe(false)
  })
})

describe('isTodatesType', () => {
  it('accepts empty object', () => {
    expect(isTodatesType({})).toBe(true)
  })

  it('accepts record of valid todates', () => {
    expect(
      isTodatesType({
        id1: {
          _id: 'a-b-c-d-e',
          title: 'One',
          date: '2023-01-01T00:00:00.000Z',
          tags: [],
        },
      })
    ).toBe(true)
  })

  it('rejects non-object or array', () => {
    expect(isTodatesType(null)).toBe(false)
    expect(isTodatesType([])).toBe(false)
  })

  it('rejects record with invalid todate value', () => {
    expect(isTodatesType({ k: { _id: 'a-b-c-d-e', title: 'x' } })).toBe(false)
  })
})

describe('isTagsType', () => {
  it('accepts empty object', () => {
    expect(isTagsType({})).toBe(true)
  })

  it('accepts record of valid tags', () => {
    expect(
      isTagsType({
        id1: { _id: 'a-b-c-d-e', name: 'A', color: '#f00' },
      })
    ).toBe(true)
  })

  it('rejects non-object or array', () => {
    expect(isTagsType(null)).toBe(false)
    expect(isTagsType([])).toBe(false)
  })

  it('rejects record with invalid tag value', () => {
    expect(isTagsType({ k: { name: 'x', color: '#000' } })).toBe(false)
  })
})

describe('isDataset', () => {
  it('accepts valid dataset with all fields including schoolStartDate', () => {
    expect(
      isDataset({
        id: 'ds1',
        name: 'Default',
        todates: {},
        tags: {},
        schoolStartDate: { referenceYear: 2000, month: 9, day: 1 },
      })
    ).toBe(true)
  })

  it('accepts dataset with schoolStartDate null', () => {
    expect(
      isDataset({
        id: 'ds1',
        name: 'Default',
        todates: {},
        tags: {},
        schoolStartDate: null,
      })
    ).toBe(true)
  })

  it('accepts dataset without schoolStartDate (optional)', () => {
    expect(
      isDataset({
        id: 'ds2',
        name: 'Work',
        todates: {},
        tags: {},
      })
    ).toBe(true)
  })

  it('accepts dataset with optional updatedAt', () => {
    expect(
      isDataset({
        id: 'ds1',
        name: 'Default',
        todates: {},
        tags: {},
        updatedAt: '2024-01-15T12:00:00.000Z',
      })
    ).toBe(true)
  })

  it('rejects null or non-object', () => {
    expect(isDataset(null)).toBe(false)
    expect(isDataset(42)).toBe(false)
  })

  it('rejects missing or invalid id', () => {
    expect(isDataset({ name: 'x', todates: {}, tags: {} })).toBe(false)
    expect(isDataset({ id: '', name: 'x', todates: {}, tags: {} })).toBe(false)
  })

  it('rejects missing name', () => {
    expect(isDataset({ id: 'ds1', todates: {}, tags: {} })).toBe(false)
  })

  it('rejects invalid todates or tags', () => {
    expect(isDataset({ id: 'ds1', name: 'x', todates: null, tags: {} })).toBe(false)
    expect(isDataset({ id: 'ds1', name: 'x', todates: {}, tags: null })).toBe(false)
  })

  it('rejects invalid schoolStartDate when present', () => {
    expect(
      isDataset({
        id: 'ds1',
        name: 'x',
        todates: {},
        tags: {},
        schoolStartDate: { referenceYear: 'invalid' },
      })
    ).toBe(false)
  })
})

describe('isStore', () => {
  it('accepts empty store', () => {
    expect(isStore({ activeId: '', datasets: {} })).toBe(true)
  })

  it('accepts store with one dataset', () => {
    expect(
      isStore({
        activeId: 'ds1',
        datasets: {
          ds1: { id: 'ds1', name: 'Default', todates: {}, tags: {} },
        },
      })
    ).toBe(true)
  })

  it('rejects null or non-object', () => {
    expect(isStore(null)).toBe(false)
    expect(isStore(42)).toBe(false)
  })

  it('rejects missing activeId or datasets', () => {
    expect(isStore({ datasets: {} })).toBe(false)
    expect(isStore({ activeId: '' })).toBe(false)
  })

  it('rejects invalid dataset in datasets', () => {
    expect(
      isStore({
        activeId: 'ds1',
        datasets: { ds1: { id: 'ds1', name: 'x' } },
      })
    ).toBe(false)
  })
})
