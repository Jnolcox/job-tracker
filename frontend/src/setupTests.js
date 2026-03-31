/**
 * @file setupTests.js
 * @description Jest setup file that configures testing utilities
 *
 * This file is automatically run before each test file by Jest when
 * configured in Create React App projects.
 */

// Extend Jest's expect with custom DOM matchers from jest-dom
// This adds matchers like toBeInTheDocument(), toBeVisible(), toHaveClass(), etc.
import '@testing-library/jest-dom';
