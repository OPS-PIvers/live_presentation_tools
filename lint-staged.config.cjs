module.exports = {
  '*.{ts,tsx}': [
    'eslint --fix',
    'prettier --write',
    'jest --findRelatedTests --passWithNoTests',
  ],
  '*.{css,md,json}': ['prettier --write'],
};
