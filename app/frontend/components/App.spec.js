// MyComponent.test.js
import React from 'react';
import { shallow } from 'enzyme';
import App from './App';

describe("App", () => {
  it("should render my component", () => {

    // when
    const component = shallow(<App />);
    // then
    expect(component.getElements().length).toBe(100);
  });
});