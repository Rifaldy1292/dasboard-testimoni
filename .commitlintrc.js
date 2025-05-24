module.exports = {
    extends: ['@commitlint/config-conventional'],
    rules: {
        'type-enum': [2, 'always', [
            'feat',     // New feature
            'fix',      // Bug fix
            'refactor', // Code change that neither fixes a bug nor adds a feature
            'style',    // Changes that do not affect the meaning of the code
            'docs',     // Documentation only changes
            'chore',    // Other changes that don't modify src or test files
            'revert',   // Reverts a previous commit
            'backup'    // Backup related changes
        ]],
        'scope-enum': [2, 'always', [
            'fe',       // Frontend changes
            'be',       // Backend changes
            'db',       // Database changes
            'ws',       // WebSocket related
            'api',      // API related
            'ui',       // UI components
            'auth',     // Authentication related
            'core'      // Core functionality
        ]],
        'subject-case': [0],
        'scope-case': [0]
    }
}