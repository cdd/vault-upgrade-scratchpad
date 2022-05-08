declare module '*.jpg' {
  const URL: string;
  export default URL;
}

declare module '*.png' {
  const URL: string;
  export default URL;
}

declare module '*.svg' {
  const URL: string;
  export default URL;
}

declare interface JQueryStatic {
  rails: {
    csrfToken: () => string;
  };
}

// declare const expect: Chai.ExpectStatic;
