import React from 'react';
// import $ from 'jquery';

const App = (props) => {
  return <div style={{ border: "1px solid black", padding: 5, background: 'white' }}>
    <h1>React component</h1>
    <p>app\javascript\components\App.jsx</p>
    <pre>(!!$['ping']) = {(!!$['ping']).toString()}</pre>
  </div>
}

window.setTimeout(() => {
  $('body').css({ 'background-color': 'blue' });
  $.ping();
}, 100)
export default App;