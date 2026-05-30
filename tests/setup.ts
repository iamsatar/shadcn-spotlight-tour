import "@testing-library/jest-dom";

// Minimal localStorage mock (jsdom provides one, but we make it resettable)
beforeEach(() => {
  localStorage.clear();
});
