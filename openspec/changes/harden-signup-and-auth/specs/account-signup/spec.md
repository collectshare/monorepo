## ADDED Requirements

### Requirement: Sign-up failures only undo their own work
A failed sign-up SHALL only compensate the resources created by that same request.

#### Scenario: Duplicate e-mail after a successful sign-up in the same container
- **WHEN** user A signs up successfully and then user B's sign-up fails with e-mail already in use on the same warm Lambda
- **THEN** user A still exists in Cognito and DynamoDB

#### Scenario: Failure after persisting the account
- **WHEN** the sign-up fails after the account and profile were written
- **THEN** the Cognito user, the account, the profile and the e-mail lock are all removed

### Requirement: E-mail is unique regardless of case
The system SHALL normalize e-mails to trimmed lowercase and SHALL guarantee one account per normalized e-mail atomically.

#### Scenario: Concurrent sign-ups with the same e-mail
- **WHEN** two requests sign up `Ana@x.com` and `ana@x.com` at the same time
- **THEN** exactly one account is created and the other request receives e-mail already in use

### Requirement: E-mail ownership is verified
The system SHALL NOT confirm or verify an e-mail automatically. A new account SHALL be usable only after the code sent to the e-mail is confirmed.

#### Scenario: New sign-up
- **WHEN** a visitor signs up
- **THEN** the system sends a confirmation code and does not return tokens

#### Scenario: Code confirmed
- **WHEN** the visitor submits the correct code to `POST /auth/confirm-sign-up`
- **THEN** the account becomes confirmed and sign-in works

### Requirement: Passwords are not altered
The system SHALL NOT trim passwords and SHALL accept any non-alphanumeric character as a special character. Sign-in SHALL only require a non-empty password.

#### Scenario: Wrong password on sign-in
- **WHEN** a user signs in with a password that does not meet the sign-up rules
- **THEN** the system responds 401 invalid credentials, not 400
