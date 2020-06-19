import React, {Component} from "react";
import PropTypes from "prop-types";
import trim from "lodash/trim";
import moment from "moment";

const MONTH_DATE_FORMAT = "MM-DD";
const START_OF_YEAR = '01-01';
const END_OF_YEAR = '12-31';

const INVALID_DATE = 'invalid';


const FORMAT = {
  YEAR: "YYYY",
  FULL_ISO: "YYYY-MM-DD",
  FULL_ISO_REVERSED: "DD-MM-YYYY",
  FULL_SLASH_REVERSED: "DD/MM/YYYY",
  YEAR_BC: "YYYYY bc",
};


const FORMAT_REGEXP = {
  // 1905
  YEAR: /^([0-9]){3,4}$/,

  // 1905 - 1907
  YEAR_PAIR: /^([0-9]){3,4}[ ]*-[ ]*([0-9]){3,4}$/,

  // 1901-09-01
  FULL_ISO: /^([0-9]){3,4}-([0-9]){1,2}-([0-9]){1,2}$/,

  // 1901-09-01 - 1901-09-05
  FULL_PAIR_ISO: /^([0-9]){3,4}-([0-9]){1,2}-([0-9]){1,2}[ ]*-[ ]*([0-9]){3,4}-([0-9]){1,2}-([0-9]){1,2}$/,

  // 01-09-1901
  FULL_ISO_REVERSED: /^([0-9]){1,2}-([0-9]){1,2}-([0-9]){3,4}$/,

  // 01-09-1901 - 01-09-1902
  FULL_PAIR_ISO_REVERSED: /^([0-9]){1,2}-([0-9]){1,2}-([0-9]){3,4}[ ]*-[ ]*([0-9]){1,2}-([0-9]){1,2}-([0-9]){3,4}$/,


  // 01/09/1901
  FULL_SLASH_REVERSED: /^([0-9]){1,2}\/([0-9]){1,2}\/([0-9]){3,4}$/,

  // 01/09/1901 - 01/09/1902
  FULL_PAIR_SLASH_REVERSED: /^([0-9]){1,2}\/([0-9]){1,2}\/([0-9]){3,4}[ ]*-[ ]*([0-9]){1,2}\/([0-9]){1,2}\/([0-9]){3,4}$/,

  // 1000 bc
  YEAR_BC: /^([0-9]){2,6}[ ]*b[.]*c[.]*$/,

  // 1000 bc - 500 bc
  YEAR_PAIR_BC: /^([0-9]){2,6}[ ]*b[.]*c[.]*[ ]*-[ ]*([0-9]){2,6}[ ]*b[.]*c[.]*$/,

  // 1000 bc - 500
  YEAR_PAIR_MIXED: /^([0-9]){2,6}[ ]*b[.]*c[.]*[ ]*-[ ]*([0-9]){3,4}$/,
};


// превращает дапазон дат в строчный формат
// [Date, Date] -> "01/09/1905"
// 1905
// 1905 - 1910
// 01/09/1905
// 01/09/1905 - 01/10/1905
// 1003 bc
// 1003 bc - 500 bc
function rangeToStrValue([minDate, maxDate]) {
  if (!minDate || !maxDate) {
    return '';
  }

  if (minDate === INVALID_DATE) {
    return maxDate;
  }

  const isMinBC = moment.utc(minDate) < moment.utc({years: 0});
  const isMaxBC = moment.utc(maxDate) < moment.utc({years: 0});

  if (isMinBC && moment.utc(maxDate).isSame(moment.utc(minDate).add(1, 'y').subtract(1, 'days'))) {
    return moment.utc(minDate).format(FORMAT.YEAR_BC).replace('-', '');
  }

  if (isMinBC || isMaxBC) {
    const minFormat = isMinBC ? FORMAT.YEAR_BC : FORMAT.YEAR;
    const maxFormat = isMaxBC ? FORMAT.YEAR_BC : FORMAT.YEAR;

    return `${moment.utc(minDate).format(minFormat).replace('-', '')} - ${moment.utc(maxDate).format(maxFormat).replace('-', '')}`;
  }

  if (minDate === maxDate) {
    return moment.utc(minDate).format(FORMAT.FULL_SLASH_REVERSED);
  }

  if (moment.utc(maxDate).isSame(moment.utc(minDate).add(1, 'y').subtract(1, 'days'))) {
    return moment.utc(minDate).format(FORMAT.YEAR);
  }

  const isMaxDateStartOfYear = moment.utc(minDate).format(MONTH_DATE_FORMAT) === START_OF_YEAR;
  const isMaxDateEndOfYear = moment.utc(maxDate).format(MONTH_DATE_FORMAT) === END_OF_YEAR;

  if (isMaxDateStartOfYear && isMaxDateEndOfYear) {
    return `${moment.utc(minDate).format(FORMAT.YEAR)} - ${moment.utc(maxDate).format(FORMAT.YEAR)}`
  }

  return `${moment.utc(minDate).format(FORMAT.FULL_SLASH_REVERSED)} - ${moment.utc(maxDate).format(FORMAT.FULL_SLASH_REVERSED)}`;
}


// превращает строчный формат в дапазон дат
// "1905 - 1907" -> [Date, Date]
// 1905
// 1905 - 1907
// 1901-09-01
// 1901-09-01 - 1901-09-05
//
// 01-09-1901
// 01-09-1901 - 01-09-1902
// 01/09/1901
// 01/09/1901 - 01/09/1902
// 1000 bc
function strValueToRange(strValue) {
  let minDate;
  let maxDate;

  if (!strValue) {
    return [null, null];
  }

  strValue = trim(strValue);

  // 1905
  if (FORMAT_REGEXP.YEAR.test(strValue) && moment(strValue, FORMAT.YEAR).isValid()) {
    const years = strValue;
    minDate = moment.utc({years, months: 0, date: 1});
    maxDate = moment.utc({years, months: 0, date: 1}).add(1, 'y').subtract(1, 'days');
  }

  // 1905 - 1907
  else if (FORMAT_REGEXP.YEAR_PAIR.test(strValue)) {
    const splited = strValue.split('-');
    const minYears = trim(splited[0]);
    const maxYears = trim(splited[1]);
    minDate = moment.utc({years: minYears, months: 0, date: 1});
    maxDate = moment.utc({years: maxYears, months: 0, date: 1}).add(1, 'y').subtract(1, 'days');
  }

  // 1901-09-01
  else if (FORMAT_REGEXP.FULL_ISO.test(strValue) && moment(strValue, FORMAT.FULL_ISO).isValid()) {
    minDate = moment.utc(strValue, FORMAT.FULL_ISO);
    maxDate = moment.utc(strValue, FORMAT.FULL_ISO);
  }

  // 1901-09-01 - 1901-09-05
  else if (FORMAT_REGEXP.FULL_PAIR_ISO.test(strValue)) {
    const splited = strValue.split('-');
    const minYears = trim(splited[0]);
    const minMonths = trim(splited[1]);
    const minDates = trim(splited[2]);
    const minPart = `${minYears}-${minMonths}-${minDates}`;

    const maxYears = trim(splited[3]);
    const maxMonths = trim(splited[4]);
    const maxDates = trim(splited[5]);
    const maxPart = `${maxYears}-${maxMonths}-${maxDates}`;

    minDate = moment.utc(minPart, FORMAT.FULL_ISO);
    maxDate = moment.utc(maxPart, FORMAT.FULL_ISO);
  }

  // 01-09-1901
  else if (FORMAT_REGEXP.FULL_ISO_REVERSED.test(strValue) && moment(strValue, FORMAT.FULL_ISO_REVERSED).isValid()) {
    minDate = moment.utc(strValue, FORMAT.FULL_ISO_REVERSED);
    maxDate = moment.utc(strValue, FORMAT.FULL_ISO_REVERSED);
  }

  // 01-09-1901 - 01-09-1902
  else if (FORMAT_REGEXP.FULL_PAIR_ISO_REVERSED.test(strValue)) {
    const splited = strValue.split('-');
    const minYears = trim(splited[2]);
    const minMonths = trim(splited[1]);
    const minDates = trim(splited[0]);
    const minPart = `${minDates}-${minMonths}-${minYears}`;

    const maxYears = trim(splited[5]);
    const maxMonths = trim(splited[4]);
    const maxDates = trim(splited[3]);
    const maxPart = `${maxDates}-${maxMonths}-${maxYears}`;

    minDate = moment.utc(minPart, FORMAT.FULL_ISO_REVERSED);
    maxDate = moment.utc(maxPart, FORMAT.FULL_ISO_REVERSED);
  }

  // 01/09/1905
  else if (FORMAT_REGEXP.FULL_SLASH_REVERSED.test(strValue) && moment(strValue, FORMAT.FULL_SLASH_REVERSED).isValid()) {
    minDate = moment.utc(strValue, FORMAT.FULL_SLASH_REVERSED);
    maxDate = moment.utc(strValue, FORMAT.FULL_SLASH_REVERSED);
  }

  // 01/09/1905 - 01/10/1905
  else if (FORMAT_REGEXP.FULL_PAIR_SLASH_REVERSED.test(strValue)) {
    const splited = strValue.split('-');
    const minPart = trim(splited[0]);
    const maxPart = trim(splited[1]);

    minDate = moment.utc(minPart, FORMAT.FULL_SLASH_REVERSED);
    maxDate = moment.utc(maxPart, FORMAT.FULL_SLASH_REVERSED);
  }

  //// 1000 bc
  //else if (FORMAT_REGEXP.YEAR_BC.test(strValue)) {
  //  const years = trim(strValue.replace(/[bc.]/g, ''));
  //  minDate = moment.utc({years: -years, months: 0, date: 1});
  //  maxDate = moment.utc({years: -years, months: 0, date: 1}).add(1, 'y').subtract(1, 'days');
  //}
  //
  //// 1000 bc - 500 bc
  //else if (FORMAT_REGEXP.YEAR_PAIR_BC.test(strValue)) {
  //  const years = trim(strValue.replace(/[bc.]/g, ''));
  //
  //  const splited = years.split('-');
  //  const minPart = trim(splited[0]);
  //  const maxPart = trim(splited[1]);
  //
  //  minDate = moment.utc({years: -minPart, months: 0, date: 1});
  //  maxDate = moment.utc({years: -maxPart, months: 0, date: 1}).add(1, 'y').subtract(1, 'days');
  //}
  //
  //// 1000 bc - 500
  //else if (FORMAT_REGEXP.YEAR_PAIR_MIXED.test(strValue)) {
  //  const years = trim(strValue.replace(/[bc.]/g, ''));
  //
  //  const splited = years.split('-');
  //  const minPart = trim(splited[0]);
  //  const maxPart = trim(splited[1]);
  //
  //  minDate = moment.utc({years: -minPart, months: 0, date: 1});
  //  maxDate = moment.utc({years: maxPart, months: 0, date: 1}).add(1, 'y').subtract(1, 'days');
  //}


  else {
    return [INVALID_DATE, strValue];
  }

  if (maxDate.isBefore(minDate)) {
    return [INVALID_DATE, strValue];
  }

  minDate = minDate.toISOString();
  maxDate = maxDate.toISOString();
  return [minDate, maxDate];
}


class DateRangeInput extends Component {
  static propTypes = {
    placeholder: PropTypes.string,
    id: PropTypes.string,
    value: PropTypes.array,
    className: PropTypes.string,
    style: PropTypes.object,
    onChange: PropTypes.func,
    children: PropTypes.element,
  };

  constructor(props) {
    super(props);
    this.state = {
      value: rangeToStrValue(props.value),
      invalid: false,
    }
  }

  componentWillReceiveProps(props) {
    //if (_.isEqual(props.value, this.props.value)) return;
    const value = rangeToStrValue(props.value);
    const invalid = this.isValueInvalid(value);
    this.setState({value, invalid});
  }

  blur() {
    const [minDate, maxDate] = strValueToRange(this.state.value);
    this.setState({
      invalid: this.isValueInvalid(this.state.value),
    });

    this.props.onChange(minDate, maxDate);
  }

  focus() {
    this.setState({invalid: false});
  }

  change(value) {
    this.setState({value});
  }

  changeTarget({target}) {
    this.setState({
      value: target.value,
    });
  }

  isValueInvalid(strValue) {
    const [minDate, maxDate] = strValueToRange(strValue);
    return minDate === INVALID_DATE;

  }

  render() {
    const {className} = this.props;
    const {value, invalid} = this.state;
    const placeholder = 'Created date, format YYYY or YYYY-MM-DD or YYYY - YYYY or YYYY-MM-DD - YYYY-MM-DD';

    const {children} = this.props;

    if (!children) {
      return (
        <input
          style={this.props.style || {}}
          className={`${invalid && 'invalid'} ${className}`}
          value={value}
          onChange={this.changeTarget.bind(this)}
          onBlur={this.blur.bind(this)}
          onFocus={this.focus.bind(this)}
          placeholder={this.props.placeholder || placeholder}
          id={this.props.id} />
      );
    }

    return React.cloneElement(children, {
      ref: "input",
      isInvalid: invalid,
      value: value,

      onChange: this.change.bind(this),
      onBlur: this.blur.bind(this),
      onFocus: this.focus.bind(this),
    });
  }
}

export default {
  DateRangeInput,
  rangeToStrValue,
  strValueToRange,
}
