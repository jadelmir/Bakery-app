## 1. Authentication foundation

- [x] 1.1 Add frontend session, request, and authentication-adapter types with an in-memory mock implementation.
- [x] 1.2 Add reusable email, login, and signup validation helpers with focused unit tests.

## 2. Login and signup interface

- [x] 2.1 Build the responsive authentication layout and local login/signup mode switch using the existing visual system.
- [x] 2.2 Build the login form with labeled fields, inline validation, pending state, and accessible request errors.
- [x] 2.3 Build the signup form with email, password, confirmation, inline validation, pending state, and accessible request errors.

## 3. Workspace session boundary

- [x] 3.1 Extract the existing bakery workspace from the application entry without changing its internal screen behavior.
- [x] 3.2 Gate workspace rendering behind the in-memory session and connect successful login and signup results.
- [x] 3.3 Add desktop and mobile logout access that clears the session and returns to login.

## 4. Verification

- [x] 4.1 Add component tests for unauthenticated entry, mode switching, validation, request failure, request success, protected rendering, and logout.
- [x] 4.2 Add desktop and mobile Playwright coverage for the login, signup, and logout journeys.
- [x] 4.3 Run lint, typecheck, unit tests, build, and end-to-end tests and resolve regressions within this change's scope.
