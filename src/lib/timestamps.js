import {
  format,
  parse,
  addHours,
  addDays,
  addWeeks,
  addMonths,
  addYears,
  subHours,
  subDays,
  subWeeks,
  subMonths,
  subYears,
  isBefore,
} from 'date-fns';

export const renderAsText = timestamp => {
  const {
    isActive,
    year,
    month,
    day,
    dayName,
    startHour,
    startMinute,
    endHour,
    endMinute,
    repeaterType,
    repeaterValue,
    repeaterUnit,
    delayType,
    delayValue,
    delayUnit,
  } = timestamp.toJS();

  let timestampText = '';
  timestampText += isActive ? '<' : '[';
  timestampText += `${year}-${month}-${day}`;
  timestampText += !!dayName ? ` ${dayName}` : '';
  timestampText += !!startHour ? ` ${startHour}:${startMinute}` : '';
  timestampText += !!endHour ? `-${endHour}:${endMinute}` : '';
  timestampText += !!repeaterType ? ` ${repeaterType}${repeaterValue}${repeaterUnit}` : '';
  timestampText += !!delayType ? ` ${delayType}${delayValue}${delayUnit}` : '';
  timestampText += isActive ? '>' : ']';

  return timestampText;
};

export const getCurrentTimestamp = ({ isActive = true, withStartTime = false } = {}) => {
  const time = new Date();

  const timestamp = {
    isActive,
    year: format(time, 'yyyy'),
    month: format(time, 'MM'),
    day: format(time, 'dd'),
    dayName: format(time, 'eee'),
    startHour: null,
    startMinute: null,
    endHour: null,
    endMinute: null,
    repeaterType: null,
    repeaterValue: null,
    repeaterUnit: null,
    delayType: null,
    delayValue: null,
    delayUnit: null,
  };

  if (withStartTime) {
    timestamp.startHour = format(time, 'HH');
    timestamp.startMinute = format(time, 'mm');
  }

  return timestamp;
};

export const getCurrentTimestampAsText = () => `<${format(new Date(), 'yyyy-MM-dd eee')}>`;

export const dateForTimestamp = timestamp => {
  const { year, month, day, startHour, startMinute } = timestamp.toJS();

  let timestampString = `${year}-${month}-${day}`;
  let parsedDate;
  if (!!startHour && !!startMinute) {
    timestampString += ` ${startHour.padStart(2, '0')}:${startMinute}`;
    parsedDate = parse(timestampString, 'yyyy-MM-dd HH:mm', new Date());
  } else {
    parsedDate = parse(timestampString, 'yyyy-MM-dd', new Date());
  }

  return parsedDate;
};

export const addTimestampUnitToDate = (date, numUnits, timestampUnit) =>
  ({
    h: addHours(date, numUnits),
    d: addDays(date, numUnits),
    w: addWeeks(date, numUnits),
    m: addMonths(date, numUnits),
    y: addYears(date, numUnits),
  }[timestampUnit]);

export const subtractTimestampUnitFromDate = (date, numUnits, timestampUnit) =>
  ({
    h: subHours(date, numUnits),
    d: subDays(date, numUnits),
    w: subWeeks(date, numUnits),
    m: subMonths(date, numUnits),
    y: subYears(date, numUnits),
  }[timestampUnit]);

export const applyRepeater = (timestamp, currentDate) => {
  if (!timestamp.get('repeaterType')) {
    return timestamp;
  }

  let newDate = null;
  switch (timestamp.get('repeaterType')) {
    case '+':
      newDate = addTimestampUnitToDate(
        dateForTimestamp(timestamp),
        timestamp.get('repeaterValue'),
        timestamp.get('repeaterUnit')
      );
      break;
    case '++':
      newDate = addTimestampUnitToDate(
        dateForTimestamp(timestamp),
        timestamp.get('repeaterValue'),
        timestamp.get('repeaterUnit')
      );
      while (isBefore(newDate, currentDate)) {
        newDate = addTimestampUnitToDate(
          newDate,
          timestamp.get('repeaterValue'),
          timestamp.get('repeaterUnit')
        );
      }
      break;
    case '.+':
      newDate = addTimestampUnitToDate(
        new Date(),
        timestamp.get('repeaterValue'),
        timestamp.get('repeaterUnit')
      );
      break;
    default:
      console.error(`Unrecognized timestamp repeater type: ${timestamp.get('repeaterType')}`);
      return timestamp;
  }

  timestamp = timestamp
    .set('day', format(newDate, 'dd'))
    .set('dayName', format(newDate, 'eee'))
    .set('month', format(newDate, 'MM'))
    .set('year', format(newDate, 'yyyy'));

  if (timestamp.get('startHour') !== undefined && timestamp.get('startHour') !== null) {
    timestamp = timestamp
      .set('startHour', format(newDate, 'HH'))
      .set('startMinute', format(newDate, 'mm'));
  }

  return timestamp;
};
