import detectTimeGrain from '../index.js';

const testCases = [
  { input: ['2000-01-01', '2010-01-01'], expected: { unit: 'year', count: 10 } },
  { input: ['2000-01-01', '2001-01-01'], expected: { unit: 'year', count: 1 } },
  { input: ['2000-01-01', '2000-04-01'], expected: { unit: 'month', count: 3 } },
  { input: ['2000-01-01', '2000-02-01'], expected: { unit: 'month', count: 1 } },
  { input: ['2000-01-01', '2000-01-08'], expected: { unit: 'week', count: 1 } },
  { input: ['2000-01-02', '2000-01-09'], expected: { unit: 'week', count: 1 } },
  { input: ['2000-01-01', '2000-01-02'], expected: { unit: 'day', count: 1 } },
  { input: ['2000-01-01T00:00', '2000-01-02T00:00'], expected: { unit: 'day', count: 1 } },
  { input: ['2000-01-01T00:00', '2000-01-01T01:00'], expected: { unit: 'hour', count: 1 } },
  { input: ['2000-01-01T00:00', '2000-01-01T00:01'], expected: { unit: 'minute', count: 1 } },
  { input: ['2000-01-01T00:00', '2000-01-01T00:05'], expected: { unit: 'minute', count: 5 } },
  { input: ['2000-01-01T00:00', '2000-01-01T00:10'], expected: { unit: 'minute', count: 10 } },
  { input: ['2000-01-01T00:00:00', '2000-01-01T00:00:01'], expected: { unit: 'second', count: 1 } },
  { input: ['2000-01-01T00:00:00.123', '2000-01-01T00:00:00.234'], expected: { unit: 'millisecond', count: 1 } },
  // outside UTC
  { input: ['2000-01-01T00:00:00+1200', '2000-01-02T00:00:00+1200'], expected: { unit: 'day', count: 1 } },
  { input: ['2000-01-01T00:00:00-1200', '2000-01-02T00:00:00-1200'], expected: { unit: 'day', count: 1 } },
  { input: ['2000-01-01T00:00:00+1200', '2000-02-01T00:00:00+1200'], expected: { unit: 'month', count: 1 } },
  { input: ['2000-01-01T00:00:00-1200', '2000-02-01T00:00:00-1200'], expected: { unit: 'month', count: 1 } },
  { input: ['2000-01-01T00:00:00+1200', '2000-04-01T00:00:00+1200'], expected: { unit: 'month', count: 3 } },
  { input: ['2000-01-01T00:00:00-1200', '2000-04-01T00:00:00-1200'], expected: { unit: 'month', count: 3 } },
  { input: ['2000-01-01T00:00:00+1200', '2001-01-01T00:00:00+1200'], expected: { unit: 'year', count: 1 } },
  { input: ['2000-01-01T00:00:00-1200', '2001-01-01T00:00:00-1200'], expected: { unit: 'year', count: 1 } },
  { input: ['2000-01-01T00:00:00+1200', '2010-01-01T00:00:00+1200'], expected: { unit: 'year', count: 10 } },
  { input: ['2000-01-01T00:00:00-1200', '2010-01-01T00:00:00-1200'], expected: { unit: 'year', count: 10 } },
  { input: ['2000-01-01T00:00+05:30', '2000-01-02T00:00+05:30'], expected: { unit: 'day', count: 1 } },
  // daylight savings
  { input: ['2022-03-13T05:00:00Z', '2022-03-14T04:00:00Z'], expected: { unit: 'day', count: 1 } },
  { input: ['2022-02-28T23:00:00Z', '2022-04-01T00:00:00Z'], expected: { unit: 'month', count: 1 } },
  { input: ['2022-03-26T23:00:00Z', '2022-03-28T00:00:00Z'], expected: { unit: 'day', count: 1 } },
  { input: ['2022-03-26T23:00:00Z', '2022-03-28T00:00:00Z'], expected: { unit: 'day', count: 1 } },
  { input: ['2022-05-08T00:00:00+0000', '2022-05-09T00:00:00+0100', '2022-05-10T00:00:00+0100'], expected: { unit: 'day', count: 1 } },
  // date objects
  { input: [new Date('2000-01-01'), new Date('2000-01-02'),], expected: { unit: 'day', count: 1 } }
];

for (const { input, expected } of testCases) {
  test(JSON.stringify(input), () => {
    expect(detectTimeGrain(input)).toStrictEqual(expected);
  });
}

test('invalid input', () => {
  expect(() => detectTimeGrain(['2000-01-01T00:00:00+01'])).toThrow('Invalid date: 2000-01-01T00:00:00+01');
})