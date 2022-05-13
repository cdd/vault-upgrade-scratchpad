// this file somehow breaks things

import React from 'react';
import { shallow } from 'enzyme';
import TestReactComponent from '@/TestReactComponent';

describe("TestReactComponent", () => {
  it("should render my component", () => {

    expect(true).to.be.equal(true);
    const component = shallow(<TestReactComponent />);
    expect(component.getElements().length).to.equal(1);
  });
});