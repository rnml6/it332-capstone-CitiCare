# CitiCare: Barangay Gumamela Healthcare Monitoring System

## System Description

*CitiCare: Barangay Gumamela Healthcare Monitoring System* is a web-based healthcare information management system designed to improve the efficiency and effectiveness of healthcare service delivery within Barangay Gumamela. The system facilitates the centralized management of resident health records, enabling Barangay Health Workers (BHWs) to monitor health conditions, track patient information, and support evidence-based decision-making.

A key component of the system is its AI-powered recommendation functionality, which analyzes resident health data to identify priority cases, detect emerging disease trends, classify residents and puroks according to health-related indicators, and forecast medicine demand. By transforming healthcare data into actionable insights, the system supports proactive healthcare planning, resource allocation, and community health interventions.

## Main Features

The CitiCare system provides the following core functionalities:

* *Resident Classification and Prioritization* – Categorizes residents based on health-related factors to assist healthcare workers in identifying priority cases and allocating resources effectively.
* *Data Analytics and Health Monitoring* – Analyzes collected health data to identify trends, patterns, and potential health risks within the community.
* *Report Generation* – Generates comprehensive reports to support monitoring, evaluation, and decision-making processes for healthcare programs and services.

## System Architecture and Technologies

The system is developed using modern web technologies to ensure scalability, maintainability, and performance.

### Frontend

* React
* Next.js

### Backend

* Node.js
* JavaScript

### Database

* PostgreSQL

### Deployment Platforms

* Render
* Vercel

### Version Control

* GitHub

### 3. Focus Groups & Medical Profiles

### `focus_groups`
A lookup directory for specific health sectors (e.g., Seniors, PWDs, Pregnant Women, Infants).
* **`id`** (INT | PK, Auto Increment) — Unique identifier for the health sector group.
* **`group_name`** (VARCHAR) — Name of the sector (e.g., 'Seniors', 'PWD').

### `resident_focus_groups`
Connects residents to one or more focus groups (e.g., a resident who is both a Senior and a PWD).
* **`resident_id`** (INT | Composite PK, FK) — References `residents.id`.
* **`focus_group_id`** (INT | Composite PK, FK) — References `focus_groups.id`.

### `health_profiles`
Stores a resident's real-time, automatically calculated health risk scores and basic medical status.
* **`id`** (INT | PK, Auto Increment) — Unique identifier for the profile.
* **`resident_id`** (INT | FK, Unique) — References `residents.id` (Enforces 1:1 relation).
* **`blood_type`** (VARCHAR | Nullable) — ABO blood group system typing.
* **`has_chronic_condition`** (BOOLEAN) — Quick flag for chronic illness tracking.
* **`current_risk_score`** (DECIMAL) — Calculated real-time risk assessment score.
* **`risk_level`** (ENUM: 'Low', 'Moderate', 'High') — Evaluated tier based on the risk score.
* **`last_calculated_at`** (TIMESTAMP) — Timestamp of the last risk engine update.

### `chronic_conditions`
Records specific medical diagnoses (like Diabetes or Hypertension) tied to a resident's health profile.
* **`id`** (INT | PK, Auto Increment) — Unique identifier for the condition entry.
* **`health_profile_id`** (INT | FK) — References `health_profiles.id`.
* **`disease_name`** (VARCHAR) — Name of the illness (e.g., 'Hypertension').
* **`date_diagnosed`** (DATE | Nullable) — The date the resident was diagnosed.
* **`status`** (ENUM: 'Active', 'Managed', 'In Remission') — The clinical state of the condition.
