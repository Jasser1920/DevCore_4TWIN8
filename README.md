1. Overview
Artificial Intelligence tools were used during the SmartSite project to support development, debugging, documentation, testing, accessibility review, and performance reporting.
AI was used as an assistant, not as a replacement for developer review. All generated suggestions were checked, adapted, tested, and integrated according to the SmartSite project stack and requirements.
2. AI Tools Used
Tool	Usage
ChatGPT	Debugging help, documentation, explanation, and report drafting
OpenAI Codex	Code analysis, project documentation, and technical writing support
GitHub Copilot	In-editor code completion and boilerplate suggestions
Claude	Documentation phrasing and alternative explanations
3. LLMs and Agents Used
LLM / Agent	Role
OpenAI ChatGPT	General technical assistant for explanations, debugging, and documentation
OpenAI Codex	Coding and repository assistance, including code review and improvement suggestions
GitHub Copilot Agent	IDE coding assistant for inline suggestions and repetitive code scaffolding
Claude	Documentation and writing assistant for clearer phrasing and requirement interpretation
4. Tasks Assisted by AI
Task	AI Usage
Code generation	Suggested React components, NestJS services, DTOs, helper functions, and reusable UI patterns
Debugging	Helped analyze frontend and backend errors and suggested possible causes
Documentation	Helped draft README files, workflow guides, and submission reports
Testing	Suggested unit test cases, integration checks, and manual QA scenarios
Accessibility	Helped map implemented accessibility features to WCAG criteria
Performance reporting	Helped structure Grafana-based performance documentation and optimization summaries
DevOps documentation	Helped describe Docker, Jenkins, monitoring, Prometheus, Grafana, and deployment steps
Refactoring	Suggested cleaner organization for components, services, hooks, and utility functions
5. Example Prompts Used
Code Generation
```text
Generate a reusable React form field component with label, error handling, aria-describedby, and support for input, select, and textarea.
```
Backend Development
```text
Create a NestJS DTO for project creation with validation decorators and clear error messages.
```
Debugging
```text
I am getting an unauthorized error when calling a protected NestJS endpoint with Keycloak. What should I check first?
```
Accessibility Review
```text
Review these implemented accessibility features and map them to WCAG 2.1 Level A and AA criteria: skip-to-content, focus indicators, high contrast mode, reduced motion, modal focus trap, and form error alerts.
```
Performance Documentation
```text
Help me write a performance report for a full-stack React and NestJS application monitored using Grafana and Prometheus instead of Lighthouse.
```
DevOps Documentation
```text
Explain how to document a Docker Compose setup that includes frontend, backend, Keycloak, PostgreSQL, MongoDB, Prometheus, Grafana, Jenkins, and SonarQube.
```
Testing
```text
Suggest manual test scenarios for role-based dashboards in a construction project management application.
```
6. How AI Output Was Validated
AI-generated outputs were not accepted automatically. The project team reviewed and validated all suggestions before using them.
Validation Step	Description
Manual review	Code and documentation suggestions were reviewed before integration
Stack compatibility check	Suggestions were adapted to React, TypeScript, Vite, NestJS, Keycloak, Docker, and project conventions
Functional testing	Implemented features were tested through the application flows
Documentation review	Generated text was rewritten where necessary to match the real project implementation
Security review	Authentication, authorization, and role-based access suggestions were checked before use
Accessibility review	WCAG mapping was compared with the actual accessibility features implemented
Performance review	Performance claims were aligned with Grafana, Prometheus, Docker, and browser inspection evidence
7. Benefits of AI Assistance
AI tools helped improve productivity during the project by providing quick explanations, examples, and documentation structures. They were especially useful for reducing time spent on repetitive boilerplate, improving report clarity, suggesting test cases, and organizing technical content.
The main benefits were:
Faster drafting of documentation and reports.
Faster identification of possible debugging directions.
Better structuring of accessibility and performance audit documents.
Useful suggestions for reusable frontend and backend patterns.
Improved clarity in README files and technical explanations.
8. Limitations of AI Assistance
AI tools were limited to providing suggestions and explanations. They did not replace manual implementation, testing, or decision-making.
Important limitations included:
AI suggestions could be too generic and required adaptation.
Some generated code needed correction to match the SmartSite architecture.
AI could not independently verify the real runtime behavior of the deployed application.
Performance and accessibility claims had to be checked against actual project evidence.
Security-related suggestions required careful developer review.
9. Responsible Use Statement
AI was used responsibly as a support tool during the SmartSite project. It helped with brainstorming, code suggestions, debugging ideas, documentation drafting, testing ideas, accessibility mapping, and performance-report organization.
All final code, documentation, testing decisions, and submitted reports were reviewed and accepted by the project team. AI-generated content was edited and validated to ensure it accurately represented the implemented SmartSite application.
10. Conclusion
Artificial Intelligence tools supported the SmartSite development process by improving productivity, documentation quality, and technical organization. However, the final implementation remained under human control. The project team reviewed, modified, tested, and validated all AI-assisted outputs before including them in the final project submission.
11. Deployment URL
https://d02f-196-187-149-45.ngrok-free.app/

