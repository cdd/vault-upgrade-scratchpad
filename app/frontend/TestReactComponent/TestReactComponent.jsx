import React from 'react';
import ok from 'ASSETS/images/onepunchman.jpg'

class TestReactComponent extends React.Component {
  constructor() {
    super()
    this.state = { count: 0 };
  }

  handleClick = () => {
    this.setState({count: this.state.count + 1})
  }

  render() {
    const {count} = this.state;
    return (<div style={{ border: "1px solid black", padding: 5, background: 'lightblue', border: '5px solid white', width: 500 }}>
      <h1>React component</h1>
      <div>
        <img
          width={64} alt='ok'
          style={{ float: 'left', marginRight: 30, padding: 5 }}
          src={ok} />
        <pre>(!!$['ping']) = {(!!$['ping']).toString()}</pre>
        <p><i>^ if true, this means that jQuery was monkey-patched</i></p>
        <p>
        <button id='btnIncrement' onClick={this.handleClick}>Increment count</button> &nbsp;&nbsp;
        <span id='click-report'>Button clicked {count} time{(count !== 1) && 's'}.</span>
        </p>
      </div>
    </div>)
  }
}

export default TestReactComponent;