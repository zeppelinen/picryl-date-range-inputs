import React, {Component} from 'react';
import ReactDOM from 'react-dom';
import DateRangeInput from './../src/index';

const style = {
  width: 400,
  padding: 10,
  fontSize: 'large',
};

class App extends Component {
  state = {
    value: [null, null]
  };

  change(min, max) {
    this.setState({value: [min, max]});
  }

  render() {
    const {value} = this.state;

    return (
      <div>
        min: {value[0]}<br/>
        max: {value[1]}<br/>
        <DateRangeInput style={style} value={value} onChange={this.change.bind(this)} />
      </div>
    )
  }
}

function onChange(min, max) {
  render({value: [min, max], onChange});
}

ReactDOM.render(
  <App />,
  document.getElementById('container')
);
