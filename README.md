# CSharing - Cost Sharing Application

A clean, well-architected cost-sharing application built with separated concerns: Data, Business Logic, UI, and Application Controller layers.

## Architecture Overview

### Layer 1: Data Layer (`js/data.js`)
- **StateManager** - Single source of truth for application state
- Handles all persistence (localStorage)
- Provides simple mutation methods
- No business logic, no DOM interactions

### Layer 2: Services Layer (`js/services.js`)
- **FormatService** - Formatting utilities (amounts, dates)
- **ExpenseService** - Business logic for expenses and filtering
- **SummaryService** - Summary calculations
- Pure functions, no side effects, easy to test

### Layer 3: UI Layer (`js/ui.js`)
- **Component classes** for rendering (Summary, Expenses, Settlement, Users, History)
- Pure rendering functions that return HTML strings
- No state mutations, no business logic
- Easy to modify styling and structure

### Layer 4: Application Controller (`js/app.js`)
- **App class** - Orchestrates all layers
- Handles user interactions
- Coordinates state updates and re-renders
- Event handlers for forms, buttons, modals

### Utilities (`js/utils.js`)
- Helper functions (uid generation, avatar initials, category icons, toasts)

## File Structure

```
.
├── index.html          # HTML shell + CSS only
├── js/
│   ├── utils.js        # Utility functions
│   ├── data.js         # State management (Data layer)
│   ├── services.js     # Business logic (Services layer)
│   ├── ui.js           # UI components (UI layer)
│   ├── app.js          # Application controller
│   └── main.js         # Initialization
└── README.md
```

## Features

✅ Add/Edit/Delete expenses
✅ Track payment status per person
✅ Calculate settlements and minimum transfers needed
✅ Manage users (co-owners)
✅ View cost history
✅ Export/Import data
✅ Filter by user, category, and status
✅ Responsive design

## How to Run

1. Clone the repository
2. Open `index.html` in a web browser
3. Data is stored locally in browser storage (localStorage)

## Benefits of This Architecture

### Testability
- Services are pure functions - easy to unit test
- No external dependencies in business logic

### Maintainability
- Clear separation of concerns
- Each layer has a single responsibility
- Easy to locate and fix bugs

### Scalability
- Easy to add new features by combining layers
- Services can be reused in different contexts
- UI components are composable

### Flexibility
- Change UI without touching data or business logic
- Swap data persistence layer (localStorage → API)
- Reuse services for different UIs (web, mobile, CLI)

## Development Workflow

### Adding a new feature:

1. **Data Layer**: Add state mutation method in `StateManager`
2. **Services Layer**: Add business logic as pure functions
3. **UI Layer**: Create component class with render method
4. **Application Layer**: Add user interaction handler in `App` class
5. **Main**: Wire up event listeners in `index.html`

### Example: Adding a category filter

```javascript
// 1. Data layer - already has expenses

// 2. Services layer - add filter logic
ExpenseService.filterByCategory(expenses, category) {
  return expenses.filter(e => e.category === category);
}

// 3. UI layer - component already supports it

// 4. Application layer - add handler
App.filterByCategory(category) {
  // Update UI
}

// 5. Main - add event listener in HTML
// <select onchange="app.filterByCategory(this.value)">
```

## Future Enhancements

- [ ] Backend API integration
- [ ] Real-time sync across devices
- [ ] Receipt image scanning with AI (OCR)
- [ ] Multi-currency support
- [ ] Recurring expenses
- [ ] Mobile app (React Native)
- [ ] Dark/Light theme toggle

## License

MIT
