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

### 4. Dynamic Tracking & History Logs

### `vaccines`
A Department of Health (DOH) reference list of required vaccines and their total required dosages.
* **`id`** (INT | PK, Auto Increment) — Unique identifier for the vaccine.
* **`vaccine_name`** (VARCHAR) — Brand or generic medical name.
* **`total_doses_required`** (INT) — Full routine dose count required for immunity.

### `child_immunizations`
Logs when a child receives a vaccine dose, alongside vital stats like weight and temperature at that moment.
* **`id`** (INT | PK, Auto Increment) — Unique identifier for the immunization record.
* **`resident_id`** (INT | FK) — References `residents.id`.
* **`vaccine_id`** (INT | FK) — References `vaccines.id`.
* **`dose_number`** (INT) — The specific dosage step (e.g., 1st dose, 2nd dose).
* **`date_administered`** (DATE) — The date the shot was given.
* **`weight_kg`** (DECIMAL | Nullable) — Child's weight at appointment time.
* **`temperature`** (DECIMAL | Nullable) — Child's body temperature at appointment time.
* **`remarks`** (TEXT | Nullable) — Notes regarding side effects or clinical observations.

### `vital_signs`
Keeps a running history of physical check-up metrics (BP, heart rate, weight) collected by BHWs.
* **`id`** (INT | PK, Auto Increment) — Unique identifier for the vitals entry.
* **`resident_id`** (INT | FK) — References `residents.id`.
* **`recorded_by_bhw_id`** (INT | FK) — References `bhws.id`.
* **`systolic_bp`** (INT | Nullable) — Upper blood pressure reading.
* **`diastolic_bp`** (INT | Nullable) — Lower blood pressure reading.
* **`heart_rate`** (INT | Nullable) — Pulse rate (Beats Per Minute).
* **`temperature`** (DECIMAL | Nullable) — Body temperature in Celsius.
* **`weight_kg`** (DECIMAL | Nullable) — Body weight in kilograms.
* **`height_cm`** (DECIMAL | Nullable) — Body height in centimeters.
* **`recorded_at`** (TIMESTAMP) — Date and time metrics were extracted.

### `checkups_and_appointments`
Schedules medical visits and tracks whether patients attended, cancelled, or missed them.
* **`id`** (INT | PK, Auto Increment) — Unique identifier for the appointment slot.
* **`resident_id`** (INT | FK) — References `residents.id`.
* **`purpose`** (VARCHAR) — Reason for clinical encounter.
* **`scheduled_date`** (DATE) — Target date of the medical appointment.
* **`status`** (ENUM: 'Pending', 'Completed', 'Missed', 'Cancelled') — Status tracking indicator.
* **`remarks`** (TEXT | Nullable) — Context notes regarding cancellations or results.

### `medical_histories`
A unified, chronological timeline that automatically indexes every event (vaccines, vitals, missed appointments) for a quick patient summary.
* **`id`** (BIGINT | PK, Auto Increment) — Global timeline tracking index identifier.
* **`resident_id`** (INT | FK) — References `residents.id`.
* **`event_date`** (DATE) — Exact day the health event occurred.
* **`event_type`** (ENUM: 'Checkup', 'Vaccination', 'Vital Signs Update', 'Admission', 'Risk Score Change') — Categorization of the log entry.
* **`description`** (TEXT) — System generated or manually typed abstract summary.
* **`reference_table`** (VARCHAR) — Name of originating table (Polymorphic tracking).
* **`reference_id`** (INT) — Matching record ID from originating table.
* **`created_at`** (TIMESTAMP) — Logging execution timestamp.
