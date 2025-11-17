// This file is used to set up the testing environment for Vitest.

// Extends Vitest's 'expect' with custom matchers for the DOM from jest-dom.
// This allows you to do things like:
// expect(element).toBeInTheDocument();
// expect(element).toHaveTextContent('...');
import '@testing-library/jest-dom';
