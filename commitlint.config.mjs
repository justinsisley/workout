export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Enforce conventional commit format
    'type-enum': [
      2,
      'always',
      [
        'feat', // New feature
        'fix', // Bug fix
        'docs', // Documentation changes
        'style', // Code style changes (formatting, etc.)
        'refactor', // Code refactoring
        'test', // Adding or updating tests
        'chore', // Build process or auxiliary tool changes
        'ci', // CI/CD pipeline changes
        'perf', // Performance improvements
        'build', // Build system changes
        'revert', // Revert previous commit
      ],
    ],
    // Require scope for most commit types
    'scope-enum': [
      2,
      'always',
      [
        'auth', // Authentication related
        'workout', // Workout functionality
        'program', // Program management
        'progress', // Progress tracking
        'ui', // UI components
        'api', // API endpoints
        'db', // Database related
        'config', // Configuration changes
        'deps', // Dependencies
        'docs', // Documentation
        'test', // Testing
        'ci', // CI/CD
        'security', // Security related
        'dev', // Development workflow
        'cleanup', // Cleanup and maintenance
        'chore', // General maintenance
      ],
    ],
    // Require description
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'subject-case': [2, 'never', ['sentence-case', 'start-case', 'pascal-case', 'upper-case']],

    // Optional body and footer
    'body-leading-blank': [1, 'always'],
    'footer-leading-blank': [1, 'always'],

    // Header format
    'header-max-length': [2, 'always', 100],
    'type-case': [2, 'always', 'lower-case'],
    'scope-case': [2, 'always', 'lower-case'],
  },
}
