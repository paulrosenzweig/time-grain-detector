# Time Grain Detector

## What it does

This Javascript library takes a list of timestamps and tells you the grain.

For example, `["2020-01-01", "2021-01-01", "2022-01-01"]` all fall at the start of the year.
While `["2021-11-10T09:00", "2021-11-10T10:00", "2021-11-10T11:00"]` are on hour boundaries.

This should work if there are gaps in the data or if the timestamps are in a non-GMT timezone.

## Why it's useful

If you have data that was already grouped along some time unit, this will let you guess what it was. 

As a concrete example, suppose you run this SQL query and pass the results elsewhere for visualization.

```sql
select
  date_trunc('month', date) as date,
  sum(revenue) as revenue
from revenue
group by 1
```

The results from that query might look like this.

```json
[
    {"date": "1999-10-01", "revenue": 100},
    {"date": "1999-11-01", "revenue": 200},
    {"date": "1999-12-01", "revenue": 300},
]
```

When you go to visualize the data, you might not know that `'month'` was used in the SQL query.
If you want to draw a bar chart of this data with a continuous temporal axis,
you'll need to know that the bars are one month wide.

<img src="https://user-images.githubusercontent.com/691495/211659079-7711061f-9d49-44de-8cef-048e2b2c47b2.png" width="60%" />

Incorrectly thinking it's daily data would lead to really skinny bars that are a month apart from eachother.

<img src="https://user-images.githubusercontent.com/691495/211658947-a73b4a5a-0679-44ab-8fa6-89868872f3e2.png" width="60%" />

Knowing the grain is also helpful for imputing missing data and generating reasonable ticks/labels.

## How to use it

The library's default export is a function, `detectTimeGrain`.
It takes a list of Javascript date objects or ISO 8601 strings.

```js
detectTimeGrain(["2000-01-01", "2000-01-02"])
```

```js
detectTimeGrain([new Date(2000, 0, 1), new Date(2000, 0, 2)])
```

The return value is an object with two keys `unit` and `count`.
The call above would return this object:
```js
{ unit: 'day', count: 1 }
```

The `count` property is usually `1`, but sometimes a multiple of the base unit is a better fit:

```js
detectTimeGrain(["2000-01-01", "2010-01-01", "2020-01-01"])
// => { unit: 'year', count: 10 }
```

## Algorithm

We want to pick the biggest unit where all the values fall along boundaries.

The basic algorithm checks for alignment along increasingly large grains.
As soon as some grain fails, we know the previous grain was the largest.

The main iteration is almost a one-liner. Most of the logic lives in these "alignment" functions defined for each grain.

There are a few complications to this discussed below.

### Timezones
 
Timezones complicate this algorithm by making it hard to see when dates fall on some boundary.

The timestamp `2000-06-11T12:00:00Z` looks like it doesn't fall on the boundary between days, but it does in Auckland, New Zealand.

This library tries to be generous. If a series of timestamps all could fall on a boundary in _some_ timezone, it considers that boundary a valid grain. We can't do this perfectly without a database of timezones, but we can be slightly more permissive than reality and still perform well on real data.

e.g. when checking for date alignment:
- `["2000-01-01T23:00:00Z", "2000-01-02T23:00:00Z", "2000-01-03T23:00:00Z"]` ✅ These work somewhere.
- `["2000-01-01T23:00:00Z", "2000-01-02T22:00:00Z", "2000-01-03T21:00:00Z"]` ❌ These don't.

#### Implementation Note

Javascript's Date class is limited to work in UTC or the local time.
For example, there's no ability to get the time of day in US/Pacific unless you happen to be running in that timezone.
This library should function the same in any system timezone, so the code only uses the UTC methods.

Once Temporal is widely available, I'd like to update this so it can optionally incorporate explicit timezone information.

### Daylight savings

Many timezones around the world shift their UTC offset twice a year.
This compounds the complexities of timezone offsets, since multiple offsets are valid in the same dataset.

### Weeks

If a series of timestamps fall on year intervals, they also are aligned on months, days, hours, etc.
This pattern lets us check grains and find the largest acceptable. 

Weeks break this pattern. Dates that are aligned on month or year boundaries likely fall on different days of the week. The code has a notion of "skippable" grains to account for weeks.
