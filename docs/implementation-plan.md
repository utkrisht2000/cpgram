# SuGam Implementation Plan and Technical Specification

## 1. System Overview
SuGam is a digital governance platform designed for citizen grievance redressal, multi-tier officer triage, deterministic SLA monitoring, and appellate workflows.

## 2. Architectural Pillars
- **Persistence Layer**: Normalized SQLite relational schema, strictly partitioned by tenancy and user roles.
- **Deterministic SLA Engine**: Independent mathematical calculation of deadlines, escalation thresholds, and appeal eligibility without AI unpredictability.
- **Isolated AI Layer**: OpenRouter integration encapsulating classification, textual clarification, status translation, officer drafting, and appeal generation with mandatory human confirmation.
- **Adaptive UI Layer**: High-contrast, mobile-first interface supporting multi-lingual accessibility (Hindi/English) and voice input.

## 3. Security and Permissions Model
- Phone-based OTP authentication with cryptographically secure HMAC verification and rate limiting.
- Bcrypt password authentication for administrative and redressal personnel.
- Signed JSON Web Tokens with fine-grained claim validation across route handlers.
- Server-side authorization verifying departmental tenancy and user ownership.
