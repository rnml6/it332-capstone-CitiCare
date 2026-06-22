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

## System Development Methodology

This study adopts the *Agile Development Methodology*, specifically the *Scrum Framework*, to guide the design and development of the CitiCare Healthcare Monitoring System. Agile is selected due to its iterative development approach, emphasis on stakeholder collaboration, and ability to accommodate evolving system requirements throughout the development lifecycle.

The development process consists of six phases:

1. *Planning Phase* – Requirements are gathered and analyzed through consultations with Barangay Health Workers (BHWs) to identify functional and non-functional system requirements.
2. *Design Phase* – The system architecture, database structure, user interface, and overall system design are developed based on the identified requirements.
3. *Development Phase* – System functionalities are incrementally implemented through Agile sprints, allowing continuous refinement and validation of features.
4. *Testing Phase* – Functional, integration, and user acceptance testing are conducted to ensure system reliability, accuracy, and usability.
5. *Deployment Phase* – The completed system is deployed within the operational environment of Barangay Gumamela and prepared for end-user utilization.
6. *Review Phase* – System performance and effectiveness are evaluated through stakeholder feedback, providing a basis for future enhancements and continuous improvement.

Throughout the development process, Barangay Health Workers actively participate in requirements validation, feature evaluation, and system testing to ensure that the final product accurately reflects the healthcare workflows and operational needs of the barangay.

## Database Design

### 1. Administrative & Organizational Tables

### `puroks`
Divides the barangay into its 12 distinct geographic sub-areas and stores a running risk score for each area.
* **`id`** (INT | PK, Auto Increment) — Unique identifier for each Purok.
* **`purok_name`** (VARCHAR | Unique) — The name of the geographic area.
* **`current_risk_score`** (DECIMAL) — A running aggregate risk score for the area.

### `bhws` (Barangay Health Workers)
Tracks the 12 health workers and restricts each BHW to managing exactly one Purok.
* **`id`** (INT | PK, Auto Increment) — Unique identifier for each BHW.
* **`first_name`** (VARCHAR) — First name of the health worker.
* **`last_name`** (VARCHAR) — Last name of the health worker.
* **`purok_id`** (INT | FK, Unique) — References `puroks.id` (Enforces 1:1 constraint per BHW).
* **`contact_number`** (VARCHAR) — Contact details of the worker.
* **`account_status`** (ENUM: 'Active', 'Inactive') — Current operational status.

### `households`
Groups family units together under a specific Purok for local tracking.
* **`id`** (INT | PK, Auto Increment) — Unique identifier for the household.
* **`household_number`** (VARCHAR | Unique) — Government or local tracking ID for the house.
* **`purok_id`** (INT | FK) — References `puroks.id`.
* **`address_details`** (TEXT) — Specific address descriptors (street, block, landmark).

### 2. Core Resident Data

### `residents`
The master list of every citizen living in the barangay, containing personal details, birth dates (for age grouping), and family roles.
* **`id`** (INT | PK, Auto Increment) — Unique identifier for the resident.
* **`household_id`** (INT | FK) — References `households.id`.
* **`purok_id`** (INT | FK) — References `puroks.id`.
* **`first_name`** (VARCHAR) — First name.
* **`middle_name`** (VARCHAR | Nullable) — Middle name.
* **`last_name`** (VARCHAR) — Last name.
* **`suffix`** (VARCHAR | Nullable) — Name suffixes (Jr., Sr., III, etc.).
* **`birth_date`** (DATE) — Used for age calculations and demographic age group sectors.
* **`sex`** (ENUM: 'Male', 'Female') — Biological sex.
* **`civil_status`** (ENUM: 'Single', 'Married', 'Widowed', 'Separated') — Legal civil status.
* **`contact_number`** (VARCHAR | Nullable) — Personal contact number.
* **`is_household_head`** (BOOLEAN) — Identifies the main representative of the household unit.
* **`created_at`** (TIMESTAMP) — Record creation timestamp.

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

* **`created_at`** (TIMESTAMP) — Record creation timestamp.
