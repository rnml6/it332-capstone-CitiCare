# CitiCare: Barangay Gumamela Healthcare Monitoring System

# System Description

CitiCare: Barangay Gumamela Healthcare Monitoring System is a web-based healthcare information management system designed to improve the efficiency and effectiveness of healthcare service delivery within Barangay Gumamela. The system facilitates the centralized management of resident health records, enabling Barangay Health Workers (BHWs) to monitor health conditions, track patient information, and support evidence-based decision-making.

A key component of the system is its AI-powered recommendation functionality, which analyzes resident health data to identify priority cases, detect emerging disease trends, classify residents and puroks according to health-related indicators, and forecast medicine demand. By transforming healthcare data into actionable insights, the system supports proactive healthcare planning, resource allocation, and community health interventions.

# Main Features

The CitiCare system provides the following core functionalities:

- **Resident Classification and Prioritization** – Categorizes residents based on health-related factors to assist healthcare workers in identifying priority cases and allocating resources effectively.
  
- **Data Analytics and Health Monitoring** – Analyzes collected health data to identify trends, patterns, and potential health risks within the community.
  
- **Report Generation** – Generates comprehensive reports to support monitoring, evaluation, and decision-making processes for healthcare programs and services.

## System Architecture and Technologies

**Resident Classification and Prioritization** – Categorizes residents based on health-related factors to assist healthcare workers in identifying priority cases and allocating resources effectively.

**Data Analytics and Health Monitoring** – Analyzes collected health data to identify trends, patterns, and potential health risks within the community.

**Report Generation** – Generates comprehensive reports to support monitoring, evaluation, and decision-making processes for healthcare programs and services.

System Architecture and Technologies
The system is developed using modern web technologies to ensure scalability, maintainability, and performance.

Frontend
React
Next.js
Backend
Node.js
JavaScript
Database
PostgreSQL
Deployment Platforms
Render
Vercel
Version Control
GitHub
System Development Methodology
This study adopts the Agile Development Methodology, specifically the Scrum Framework, to guide the design and development of the CitiCare Healthcare Monitoring System. Agile is selected due to its iterative development approach, emphasis on stakeholder collaboration, and ability to accommodate evolving system requirements throughout the development lifecycle.

- React
- Next.js
The development process consists of six phases:

**Planning Phase** - Requirements are gathered and analyzed through consultations with Barangay Health Workers (BHWs) to identify functional and non-functional system requirements.

**Design Phase** – The system architecture, database structure, user interface, and overall system design are developed based on the identified requirements.

**Development Phase** – System functionalities are incrementally implemented through Agile sprints, allowing continuous refinement and validation of features.

**Testing Phase** – Functional, integration, and user acceptance testing are conducted to ensure system reliability, accuracy, and usability.

**Deployment Phase** – The completed system is deployed within the operational environment of Barangay Gumamela and prepared for end-user utilization.

**Review Phase** – System performance and effectiveness are evaluated through stakeholder feedback, providing a basis for future enhancements and continuous improvement.

Throughout the development process, Barangay Health Workers actively participate in requirements validation, feature evaluation, and system testing to ensure that the final product accurately reflects the healthcare workflows and operational needs of the barangay.

- Node.js
- JavaScript
Database Design

# 1. Administrative & Organizational Tables
puroks

Divides the barangay into its 12 distinct geographic sub-areas and stores a running risk score for each area.

id (INT | PK, Auto Increment) — Unique identifier for each Purok.
purok_name (VARCHAR | Unique) — The name of the geographic area.
current_risk_score (DECIMAL) — A running aggregate risk score for the area.
bhws (Barangay Health Workers)
Tracks the 12 health workers and restricts each BHW to managing exactly one Purok.

- PostgreSQL
id (INT | PK, Auto Increment) — Unique identifier for each BHW.
first_name (VARCHAR) — First name of the health worker.
last_name (VARCHAR) — Last name of the health worker.
purok_id (INT | FK, Unique) — References puroks.id (Enforces 1:1 constraint per BHW).
contact_number (VARCHAR) — Contact details of the worker.
account_status (ENUM: 'Active', 'Inactive') — Current operational status.
households
Groups family units together under a specific Purok for local tracking.

id (INT | PK, Auto Increment) — Unique identifier for the household.
household_number (VARCHAR | Unique) — Government or local tracking ID for the house.
purok_id (INT | FK) — References puroks.id.
address_details (TEXT) — Specific address descriptors (street, block, landmark).

# 2. Core Resident Data

residents
The master list of every citizen living in the barangay, containing personal details, birth dates (for age grouping), and family roles.

- Render
- Vercel
id (INT | PK, Auto Increment) — Unique identifier for the resident.

household_id (INT | FK) — References households.id.

- GitHub
purok_id (INT | FK) — References puroks.id.

first_name (VARCHAR) — First name.

This study adopts the Agile Development Methodology, specifically the Scrum Framework, to guide the design and development of the CitiCare Healthcare Monitoring System. Agile is selected due to its iterative development approach, emphasis on stakeholder collaboration, and ability to accommodate evolving system requirements throughout the development lifecycle.
middle_name (VARCHAR | Nullable) — Middle name.

last_name (VARCHAR) — Last name.

1. **Planning Phase** – Requirements are gathered and analyzed through consultations with Barangay Health Workers (BHWs) to identify functional and non-functional system requirements.
2. **Design Phase** – The system architecture, database structure, user interface, and overall system design are developed based on the identified requirements.
3. **Development Phase** – System functionalities are incrementally implemented through Agile sprints, allowing continuous refinement and validation of features.
4. **Testing Phase** – Functional, integration, and user acceptance testing are conducted to ensure system reliability, accuracy, and usability.
5. **Deployment Phase** – The completed system is deployed within the operational environment of Barangay Gumamela and prepared for end-user utilization.
6. **Review Phase** – System performance and effectiveness are evaluated through stakeholder feedback, providing a basis for future enhancements and continuous improvement.
suffix (VARCHAR | Nullable) — Name suffixes (Jr., Sr., III, etc.).

birth_date (DATE) — Used for age calculations and demographic age group sectors.

sex (ENUM: 'Male', 'Female') — Biological sex.

civil_status (ENUM: 'Single', 'Married', 'Widowed', 'Separated') — Legal civil status.

#### `puroks`

Divides the barangay into its 12 distinct geographic sub-areas and stores a running risk score for each area.

- **`id`** (INT | PK, Auto Increment) — Unique identifier for each Purok.
- **`purok_name`** (VARCHAR | Unique) — The name of the geographic area.
- **`current_risk_score`** (DECIMAL) — A running aggregate risk score for the area.

#### `bhws` (Barangay Health Workers)

Tracks the 12 health workers and restricts each BHW to managing exactly one Purok.

- **`id`** (INT | PK, Auto Increment) — Unique identifier for each BHW.
- **`first_name`** (VARCHAR) — First name of the health worker.
- **`last_name`** (VARCHAR) — Last name of the health worker.
- **`purok_id`** (INT | FK, Unique) — References `puroks.id` (Enforces 1:1 constraint per BHW).
- **`contact_number`** (VARCHAR) — Contact details of the worker.
- **`account_status`** (ENUM: 'Active', 'Inactive') — Current operational status.

#### `households`

Groups family units together under a specific Purok for local tracking.

- **`id`** (INT | PK, Auto Increment) — Unique identifier for the household.
- **`household_number`** (VARCHAR | Unique) — Government or local tracking ID for the house.
- **`purok_id`** (INT | FK) — References `puroks.id`.
- **`address_details`** (TEXT) — Specific address descriptors (street, block, landmark).
contact_number (VARCHAR | Nullable) — Personal contact number.

is_household_head (BOOLEAN) — Identifies the main representative of the household unit.

created_at (TIMESTAMP) — Record creation timestamp.

#### `residents`

The master list of every citizen living in the barangay, containing personal details, birth dates (for age grouping), and family roles.

- **`id`** (INT | PK, Auto Increment) — Unique identifier for the resident.
- **`household_id`** (INT | FK) — References `households.id`.
- **`purok_id`** (INT | FK) — References `puroks.id`.
- **`first_name`** (VARCHAR) — First name.
- **`middle_name`** (VARCHAR | Nullable) — Middle name.
- **`last_name`** (VARCHAR) — Last name.
- **`suffix`** (VARCHAR | Nullable) — Name suffixes (Jr., Sr., III, etc.).
- **`birth_date`** (DATE) — Used for age calculations and demographic age group sectors.
- **`sex`** (ENUM: 'Male', 'Female') — Biological sex.
- **`civil_status`** (ENUM: 'Single', 'Married', 'Widowed', 'Separated') — Legal civil status.
- **`contact_number`** (VARCHAR | Nullable) — Personal contact number.
- **`is_household_head`** (BOOLEAN) — Identifies the main representative of the household unit.
- **`created_at`** (TIMESTAMP) — Record creation timestamp.

### 3. Focus Groups & Medical Profiles

#### `focus_groups`

A lookup directory for specific health sectors (e.g., Seniors, PWDs, Pregnant Women, Infants).

- **`id`** (INT | PK, Auto Increment) — Unique identifier for the health sector group.
- **`group_name`** (VARCHAR) — Name of the sector (e.g., 'Seniors', 'PWD').

#### `resident_focus_groups`

Connects residents to one or more focus groups (e.g., a resident who is both a Senior and a PWD).

- **`resident_id`** (INT | Composite PK, FK) — References `residents.id`.
- **`focus_group_id`** (INT | Composite PK, FK) — References `focus_groups.id`.

#### `health_profiles`

Stores a resident's real-time, automatically calculated health risk scores and basic medical status.

- **`id`** (INT | PK, Auto Increment) — Unique identifier for the profile.
- **`resident_id`** (INT | FK, Unique) — References `residents.id` (Enforces 1:1 relation).
- **`blood_type`** (VARCHAR | Nullable) — ABO blood group system typing.
- **`has_chronic_condition`** (BOOLEAN) — Quick flag for chronic illness tracking.
- **`current_risk_score`** (DECIMAL) — Calculated real-time risk assessment score.
- **`risk_level`** (ENUM: 'Low', 'Moderate', 'High') — Evaluated tier based on the risk score.
- **`last_calculated_at`** (TIMESTAMP) — Timestamp of the last risk engine update.

#### `chronic_conditions`

Records specific medical diagnoses (like Diabetes or Hypertension) tied to a resident's health profile.

- **`id`** (INT | PK, Auto Increment) — Unique identifier for the condition entry.
- **`health_profile_id`** (INT | FK) — References `health_profiles.id`.
- **`disease_name`** (VARCHAR) — Name of the illness (e.g., 'Hypertension').
- **`date_diagnosed`** (DATE | Nullable) — The date the resident was diagnosed.
- **`status`** (ENUM: 'Active', 'Managed', 'In Remission') — The clinical state of the condition.
3. Focus Groups & Medical Profiles
focus_groups
A lookup directory for specific health sectors (e.g., Seniors, PWDs, Pregnant Women, Infants).

id (INT | PK, Auto Increment) — Unique identifier for the health sector group.
group_name (VARCHAR) — Name of the sector (e.g., 'Seniors', 'PWD').
resident_focus_groups
Connects residents to one or more focus groups (e.g., a resident who is both a Senior and a PWD).

resident_id (INT | Composite PK, FK) — References residents.id.
focus_group_id (INT | Composite PK, FK) — References focus_groups.id.
health_profiles
Stores a resident's real-time, automatically calculated health risk scores and basic medical status.

id (INT | PK, Auto Increment) — Unique identifier for the profile.
resident_id (INT | FK, Unique) — References residents.id (Enforces 1:1 relation).
blood_type (VARCHAR | Nullable) — ABO blood group system typing.
has_chronic_condition (BOOLEAN) — Quick flag for chronic illness tracking.
current_risk_score (DECIMAL) — Calculated real-time risk assessment score.
risk_level (ENUM: 'Low', 'Moderate', 'High') — Evaluated tier based on the risk score.
last_calculated_at (TIMESTAMP) — Timestamp of the last risk engine update.
chronic_conditions
Records specific medical diagnoses (like Diabetes or Hypertension) tied to a resident's health profile.

#### `vaccines`

A Department of Health (DOH) reference list of required vaccines and their total required dosages.

- **`id`** (INT | PK, Auto Increment) — Unique identifier for the vaccine.
- **`vaccine_name`** (VARCHAR) — Brand or generic medical name.
- **`total_doses_required`** (INT) — Full routine dose count required for immunity.

#### `child_immunizations`

Logs when a child receives a vaccine dose, alongside vital stats like weight and temperature at that moment.

- **`id`** (INT | PK, Auto Increment) — Unique identifier for the immunization record.
- **`resident_id`** (INT | FK) — References `residents.id`.
- **`vaccine_id`** (INT | FK) — References `vaccines.id`.
- **`dose_number`** (INT) — The specific dosage step (e.g., 1st dose, 2nd dose).
- **`date_administered`** (DATE) — The date the shot was given.
- **`weight_kg`** (DECIMAL | Nullable) — Child's weight at appointment time.
- **`temperature`** (DECIMAL | Nullable) — Child's body temperature at appointment time.
- **`remarks`** (TEXT | Nullable) — Notes regarding side effects or clinical observations.

#### `vital_signs`

Keeps a running history of physical check-up metrics (BP, heart rate, weight) collected by BHWs.

- **`id`** (INT | PK, Auto Increment) — Unique identifier for the vitals entry.
- **`resident_id`** (INT | FK) — References `residents.id`.
- **`recorded_by_bhw_id`** (INT | FK) — References `bhws.id`.
- **`systolic_bp`** (INT | Nullable) — Upper blood pressure reading.
- **`diastolic_bp`** (INT | Nullable) — Lower blood pressure reading.
- **`heart_rate`** (INT | Nullable) — Pulse rate (Beats Per Minute).
- **`temperature`** (DECIMAL | Nullable) — Body temperature in Celsius.
- **`weight_kg`** (DECIMAL | Nullable) — Body weight in kilograms.
- **`height_cm`** (DECIMAL | Nullable) — Body height in centimeters.
- **`recorded_at`** (TIMESTAMP) — Date and time metrics were extracted.

#### `checkups_and_appointments`

Schedules medical visits and tracks whether patients attended, cancelled, or missed them.

- **`id`** (INT | PK, Auto Increment) — Unique identifier for the appointment slot.
- **`resident_id`** (INT | FK) — References `residents.id`.
- **`purpose`** (VARCHAR) — Reason for clinical encounter.
- **`scheduled_date`** (DATE) — Target date of the medical appointment.
- **`status`** (ENUM: 'Pending', 'Completed', 'Missed', 'Cancelled') — Status tracking indicator.
- **`remarks`** (TEXT | Nullable) — Context notes regarding cancellations or results.

#### `medical_histories`

A unified, chronological timeline that automatically indexes every event (vaccines, vitals, missed appointments) for a quick patient summary.

- **`id`** (BIGINT | PK, Auto Increment) — Global timeline tracking index identifier.
- **`resident_id`** (INT | FK) — References `residents.id`.
- **`event_date`** (DATE) — Exact day the health event occurred.
- **`event_type`** (ENUM: 'Checkup', 'Vaccination', 'Vital Signs Update', 'Admission', 'Risk Score Change') — Categorization of the log entry.
- **`description`** (TEXT) — System generated or manually typed abstract summary.
- **`reference_table`** (VARCHAR) — Name of originating table (Polymorphic tracking).
- **`reference_id`** (INT) — Matching record ID from originating table.
- **`created_at`** (TIMESTAMP) — Logging execution timestamp.
id (INT | PK, Auto Increment) — Unique identifier for the condition entry.
health_profile_id (INT | FK) — References health_profiles.id.
disease_name (VARCHAR) — Name of the illness (e.g., 'Hypertension').
date_diagnosed (DATE | Nullable) — The date the resident was diagnosed.
status (ENUM: 'Active', 'Managed', 'In Remission') — The clinical state of the condition.
4. Dynamic Tracking & History Logs
vaccines
A Department of Health (DOH) reference list of required vaccines and their total required dosages.

id (INT | PK, Auto Increment) — Unique identifier for the vaccine.
vaccine_name (VARCHAR) — Brand or generic medical name.
total_doses_required (INT) — Full routine dose count required for immunity.
child_immunizations
Logs when a child receives a vaccine dose, alongside vital stats like weight and temperature at that moment.

id (INT | PK, Auto Increment) — Unique identifier for the immunization record.
resident_id (INT | FK) — References residents.id.
vaccine_id (INT | FK) — References vaccines.id.
dose_number (INT) — The specific dosage step (e.g., 1st dose, 2nd dose).
date_administered (DATE) — The date the shot was given.
weight_kg (DECIMAL | Nullable) — Child's weight at appointment time.
temperature (DECIMAL | Nullable) — Child's body temperature at appointment time.
remarks (TEXT | Nullable) — Notes regarding side effects or clinical observations.
vital_signs
Keeps a running history of physical check-up metrics (BP, heart rate, weight) collected by BHWs.

id (INT | PK, Auto Increment) — Unique identifier for the vitals entry.
resident_id (INT | FK) — References residents.id.
recorded_by_bhw_id (INT | FK) — References bhws.id.
systolic_bp (INT | Nullable) — Upper blood pressure reading.
diastolic_bp (INT | Nullable) — Lower blood pressure reading.
heart_rate (INT | Nullable) — Pulse rate (Beats Per Minute).
temperature (DECIMAL | Nullable) — Body temperature in Celsius.
weight_kg (DECIMAL | Nullable) — Body weight in kilograms.
height_cm (DECIMAL | Nullable) — Body height in centimeters.
recorded_at (TIMESTAMP) — Date and time metrics were extracted.
checkups_and_appointments
Schedules medical visits and tracks whether patients attended, cancelled, or missed them.

id (INT | PK, Auto Increment) — Unique identifier for the appointment slot.
resident_id (INT | FK) — References residents.id.
purpose (VARCHAR) — Reason for clinical encounter.
scheduled_date (DATE) — Target date of the medical appointment.
status (ENUM: 'Pending', 'Completed', 'Missed', 'Cancelled') — Status tracking indicator.
remarks (TEXT | Nullable) — Context notes regarding cancellations or results.
medical_histories
A unified, chronological timeline that automatically indexes every event (vaccines, vitals, missed appointments) for a quick patient summary.

id (BIGINT | PK, Auto Increment) — Global timeline tracking index identifier.
resident_id (INT | FK) — References residents.id.
event_date (DATE) — Exact day the health event occurred.
event_type (ENUM: 'Checkup', 'Vaccination', 'Vital Signs Update', 'Admission', 'Risk Score Change') — Categorization of the log entry.
description (TEXT) — System generated or manually typed abstract summary.
reference_table (VARCHAR) — Name of originating table (Polymorphic tracking).
reference_id (INT) — Matching record ID from originating table.
created_at (TIMESTAMP) — Logging execution timestamp.

# System Dependencies

1. **Core Framework & UI (Next.js, React, & Tailwind)**
next – The core full-stack React framework providing hybrid rendering and built-in API routes.
react & react-dom – The underlying UI library for building modular, stateful dashboard components.
tailwindcss – A utility-first CSS framework for creating clean, mobile-responsive interfaces for BHWs.
lucide-react – A modern, lightweight icon library for navigation menus, status tags, and health indicators.
recharts – A composable charting library built on React components to render real-time Purok risk distributions and disease trends.

2. **Backend, Routing & Server Environment (Node.js & Express)**
express – Fast, unopinionated minimalist web framework used to spin up a dedicated custom backend server alongside Next.js.
cors – Enables Cross-Origin Resource Sharing, allowing your user interface to communicate securely with your backend server.
dotenv – Loads system configurations from a .env file to protect secret keys (e.g., Supabase credentials, DeepSeek API keys).
node-cron – A pure JavaScript task scheduler used to run background jobs (e.g., automated monthly data compiling for the monthly_purok_analytics table).

3. **Database, Real-Time & Authentication (Supabase & PostgreSQL)**
@supabase/supabase-js – The official isomorphic client library connecting the application directly to the PostgreSQL instance to handle user session logins, data transactions, and real-time record synchronization.

4. **AI Engine Processing (DeepSeek AI Integration)**
openai – The official SDK used to interface seamlessly with DeepSeek's OpenAI-compatible endpoints to feed prompt histories and fetch structured community health recommendations.

5. **API Security & Request Handling**
helmet – Helps secure the Express server by setting various crucial HTTP headers to protect sensitive resident health records.
morgan – An HTTP request logger middleware for Node.js, essential for tracking down broken API routes and diagnostic debugging during development.

6. **Data Validation, Forms, & Utilities**
zod – A TypeScript-first schema declaration and validation library to ensure corrupted, empty, or incorrectly formatted medical records never hit your database.
react-hook-form – Efficient, flexible, and extensible form state manager that speeds up rendering times on slow data connections.
date-fns – A lightweight utility set for parsing and formatting dates, used to calculate structural demographic sectors (e.g., separating infants from senior citizens via birthdates).

7. **Development Dependencies**(devDependencies)
nodemon – Automatically monitors application file changes and restarts the backend server dynamically during local testing.
postcss & autoprefixer – Essential parsing and CSS compiling libraries required by Tailwind CSS to optimize, shrink, and clean code for resource-constrained client hardware.

Project Setup
1. **Database Setup (Supabase)**
The application uses Supabase as its backend database and authentication provider.

Step 1: Create a Supabase Project
Sign in to the Supabase Dashboard.
Click New Project.
Enter your project details and wait for the project to finish provisioning.

Step 2: Retrieve API Credentials
Navigate to: Settings → API Copy the following values:

Project URL
Anon (Public) Key
Service Role Key These credentials will be used by the frontend and backend.
Step 3: Initialize the Database Schema
Open the SQL Editor.
Create a new query.
Paste the project's SQL schema.
Click Run to create the required tables, indexes, and relationships.

Step 4: Configure Row Level Security (RLS)
After the tables have been created:

Enable Row Level Security (RLS) on all tables.
Create the necessary RLS policies based on your application's access requirements.
Verify that unauthorized users cannot directly access protected data.

Project Structure
Frontend (citicare-frontend)
* **`id`** (BIGINT | PK, Auto Increment) — Global timeline tracking index identifier.
* **`resident_id`** (INT | FK) — References `residents.id`.
* **`event_date`** (DATE) — Exact day the health event occurred.
* **`event_type`** (ENUM: 'Checkup', 'Vaccination', 'Vital Signs Update', 'Admission', 'Risk Score Change') — Categorization of the log entry.
* **`description`** (TEXT) — System generated or manually typed abstract summary.
* **`reference_table`** (VARCHAR) — Name of originating table (Polymorphic tracking).
* **`reference_id`** (INT) — Matching record ID from originating table.
* **`created_at`** (TIMESTAMP) — Logging execution timestamp.

## System Dependencies

### 1. Core Framework & UI (Next.js, React, & Tailwind)

- **`next`** – The core full-stack React framework providing hybrid rendering and built-in API routes.
- **`react`** & **`react-dom`** – The underlying UI library for building modular, stateful dashboard components.
- **`tailwindcss`** – A utility-first CSS framework for creating clean, mobile-responsive interfaces for BHWs.
- **`lucide-react`** – A modern, lightweight icon library for navigation menus, status tags, and health indicators.
- **`recharts`** – A composable charting library built on React components to render real-time Purok risk distributions and disease trends.

### 2. Backend, Routing & Server Environment (Node.js & Express)

- **`express`** – Fast, unopinionated minimalist web framework used to spin up a dedicated custom backend server alongside Next.js.
- **`cors`** – Enables Cross-Origin Resource Sharing, allowing your user interface to communicate securely with your backend server.
- **`dotenv`** – Loads system configurations from a `.env` file to protect secret keys (e.g., Supabase credentials, DeepSeek API keys).
- **`node-cron`** – A pure JavaScript task scheduler used to run background jobs (e.g., automated monthly data compiling for the `monthly_purok_analytics` table).

### 3. Database, Real-Time & Authentication (Supabase & PostgreSQL)

- **`@supabase/supabase-js`** – The official isomorphic client library connecting the application directly to the PostgreSQL instance to handle user session logins, data transactions, and real-time record synchronization.

### 4. AI Engine Processing (DeepSeek AI Integration)

- **`openai`** – The official SDK used to interface seamlessly with DeepSeek's OpenAI-compatible endpoints to feed prompt histories and fetch structured community health recommendations.

### 5. API Security & Request Handling

- **`helmet`** – Helps secure the Express server by setting various crucial HTTP headers to protect sensitive resident health records.
- **`morgan`** – An HTTP request logger middleware for Node.js, essential for tracking down broken API routes and diagnostic debugging during development.

### 6. Data Validation, Forms, & Utilities

- **`zod`** – A TypeScript-first schema declaration and validation library to ensure corrupted, empty, or incorrectly formatted medical records never hit your database.
- **`react-hook-form`** – Efficient, flexible, and extensible form state manager that speeds up rendering times on slow data connections.
- **`date-fns`** – A lightweight utility set for parsing and formatting dates, used to calculate structural demographic sectors (e.g., separating infants from senior citizens via birthdates).

### 7. Development Dependencies (`devDependencies`)

- **`nodemon`** – Automatically monitors application file changes and restarts the backend server dynamically during local testing.
- **`postcss`** & **`autoprefixer`** – Essential parsing and CSS compiling libraries required by Tailwind CSS to optimize, shrink, and clean code for resource-constrained client hardware.


# Project Setup

## 1. Database Setup (Supabase)

The application uses **Supabase** as its backend database and authentication provider.

### Step 1: Create a Supabase Project

1. Sign in to the **Supabase Dashboard**.
2. Click **New Project**.
3. Enter your project details and wait for the project to finish provisioning.

### Step 2: Retrieve API Credentials

Navigate to:

```text
Settings → API
```

Copy the following values:

- **Project URL**
- **Anon (Public) Key**
- **Service Role Key**

These credentials will be used by the frontend and backend.

### Step 3: Initialize the Database Schema

# Project Setup
# 1. Database Setup (Supabase)
The application uses **Supabase** as its backend database and authentication provider.
## Step 1: Create a Supabase Project
1. Sign in to the **Supabase Dashboard**.
2. Click **New Project**.
3. Enter your project details and wait for the project to finish provisioning.
---
## Step 2: Retrieve API Credentials
Navigate to:
**Settings → API**
Copy the following values:
- **Project URL**
- **Anon (Public) Key**
- **Service Role Key**
These credentials will be used by the frontend and backend.
---
## Step 3: Initialize the Database Schema
1. Open the **SQL Editor**.
2. Create a new query.
3. Paste the project's SQL schema.
4. Click **Run** to create the required tables, indexes, and relationships.

### Step 4: Configure Row Level Security (RLS)

After the tables have been created:

- Enable **Row Level Security (RLS)** on all tables.
- Create the necessary RLS policies based on your application's access requirements.
- Verify that unauthorized users cannot directly access protected data.
---
## Step 4: Configure Row Level Security (RLS)
After the tables have been created:
- Enable **Row Level Security (RLS)** on all tables.
- Create the necessary RLS policies based on your application's access requirements.
- Verify that unauthorized users cannot directly access protected data.
---
  ## Project Structure
### Frontend (`citicare-frontend`)
The frontend is a structured React application built on the Next.js App Router framework. It manages stateful dashboards, client-side data validations, responsive Tailwind CSS layouts, and dynamic visualizations optimized for community health field usage.

citicare-frontend/             
├── public/                    
├── src/
│   ├── app/                   
│   │   ├── dashboard/         
│   │   └── residents/         
│   ├── components/            
│   │   └── ui/                
│   ├── hooks/                 
│   ├── lib/                   
│   ├── styles/                
│   └── utils/                 
├── .env.local                 
├── .gitignore                 
├── next.config.js             
├── package.json               
└── tailwind.config.js
Backend (citicare-backend)
The backend is an event-driven Node.js runtime operating an Express.js API server wrapper. It interfaces securely with Supabase to execute queries, runs background cron schedulers for demographic metrics, and routes operational prompts through DeepThink/DeepSeek AI.

citicare-backend/              
├── config/                    
├── controllers/               
├── middleware/                
├── routes/                    
├── services/                  
├── utils/                     
├── .env                       
├── .gitignore                 
├── package.json               
└── server.js


# 2. Backend Setup (`citicare-backend`)
The backend is built with **Node.js** and **Express.js** and serves as the API layer between the frontend, Supabase, and external AI services.
## Step 1: Navigate to the Backend Directory
```bash
cd citicare-backend
```
---
## Step 2: Install Dependencies
```bash
npm install
```
---
## Step 3: Configure Environment Variables
Create a `.env` file in the project's root directory.
```bash
touch .env
```
Add the following environment variables:
```env
PORT=5000
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_service_role_key
DEEPSEEK_API_KEY=your_deepseek_api_key
```
---
## Step 4: Start the Backend Server
Run the development server:
```bash
npm run dev
```
Or run the production server:
```bash
npm start
```
The backend server will be available at:
```text
http://localhost:5000
```
---

# 3. Frontend Setup (`citicare-frontend`)

The frontend is built with **React** using the **Next.js App Router**.

## Step 1: Navigate to the Frontend Directory

```bash
cd ../citicare-frontend
```

---

## Step 2: Install Dependencies

```bash
npm install
```

---

## Step 3: Configure Environment Variables

Create a `.env.local` file in the project's root directory.

```bash
touch .env.local
```

Add the following environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_public_key

NEXT_PUBLIC_API_URL=http://localhost:5000
```

---

## Step 4: Start the Frontend Development Server

Run the development server:

```bash
npm run dev
```

The frontend application will be available at:

```text
http://localhost:3000
```

Open the URL above in your browser to access the application.

---

# 4. Running the Application

Start the backend and frontend in separate terminal windows.

### Terminal 1

```bash
cd citicare-backend
npm run dev
```

### Terminal 2

```bash
cd citicare-frontend
npm run dev
```

Once both services are running, open the following URLs:

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000

The application is now ready for local development.

# Database SQl

## Part 1 – Core Tables

```sql
-- ==========================================
-- USERS
-- ==========================================
CREATE TABLE users (
    id INTEGER PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- ==========================================
-- PUROKS
-- ==========================================
CREATE TABLE puroks (
    id INTEGER PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    purok_name VARCHAR(100) NOT NULL,
    current_risk_score DECIMAL(5,2) DEFAULT 0.00 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- ==========================================
-- VACCINES
-- ==========================================
CREATE TABLE vaccines (
    id INTEGER PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    vaccine_name VARCHAR(100) NOT NULL UNIQUE,
    total_doses_required INTEGER NOT NULL
);

-- ==========================================
-- FOCUS GROUPS
-- ==========================================
CREATE TABLE focus_groups (
    id INTEGER PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    group_name VARCHAR(100) NOT NULL UNIQUE
);

-- ==========================================
-- BARANGAY HEALTH WORKERS (BHWS)
-- ==========================================
CREATE TABLE bhws (
    id INTEGER PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    user_id INTEGER NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    purok_id INTEGER NOT NULL,
    contact_number VARCHAR(20),
    account_status VARCHAR(50) DEFAULT 'Active' NOT NULL
);

-- ==========================================
-- HOUSEHOLDS
-- ==========================================
CREATE TABLE households (
    id INTEGER PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    household_number VARCHAR(100) NOT NULL UNIQUE,
    purok_id INTEGER NOT NULL,
    address_details TEXT
);

-- ==========================================
-- RESIDENTS
-- ==========================================
CREATE TABLE residents (
    id INTEGER PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    household_id INTEGER,
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    suffix VARCHAR(20),
    birth_date DATE NOT NULL,
    sex VARCHAR(20) NOT NULL,
    civil_status VARCHAR(50) NOT NULL,
    contact_number VARCHAR(20),
    is_household_head BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);
```
## Part 2 – Health Records

```sql
-- ==========================================
-- VITAL SIGNS
-- ==========================================
CREATE TABLE vital_signs (
    id INTEGER PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    resident_id INTEGER NOT NULL,
    recorded_by_bhw_id INTEGER NOT NULL,
    systolic_bp INTEGER,
    diastolic_bp INTEGER,
    heart_rate INTEGER,
    temperature DECIMAL(4,1),
    weight_kg DECIMAL(5,2),
    height_cm DECIMAL(5,2),
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- ==========================================
-- CHILD IMMUNIZATIONS
-- ==========================================
CREATE TABLE child_immunizations (
    id INTEGER PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    resident_id INTEGER NOT NULL,
    vaccine_id INTEGER NOT NULL,
    vital_signs_id INTEGER,
    dose_number INTEGER NOT NULL,
    date_administered DATE NOT NULL,
    remarks TEXT
);

-- ==========================================
-- CHECKUPS AND APPOINTMENTS
-- ==========================================
CREATE TABLE checkups_and_appointments (
    id INTEGER PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    resident_id INTEGER NOT NULL,
    assigned_to_bhw_id INTEGER NOT NULL,
    purpose VARCHAR(255) NOT NULL,
    scheduled_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'Pending' NOT NULL,
    remarks TEXT,
    date_executed TIMESTAMP WITH TIME ZONE
);

-- ==========================================
-- HEALTH PROFILES
-- ==========================================
CREATE TABLE health_profiles (
    id INTEGER PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    resident_id INTEGER NOT NULL UNIQUE,
    blood_type VARCHAR(10),
    has_chronic_condition BOOLEAN DEFAULT FALSE NOT NULL,
    current_risk_score DECIMAL(5,2) DEFAULT 0.00 NOT NULL,
    risk_level VARCHAR(50) DEFAULT 'Low' NOT NULL,
    last_calculated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- ==========================================
-- CHRONIC CONDITIONS
-- ==========================================
CREATE TABLE chronic_conditions (
    id INTEGER PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    resident_id INTEGER NOT NULL,
    disease_name VARCHAR(150) NOT NULL,
    date_diagnosed DATE,
    status VARCHAR(50) DEFAULT 'Active' NOT NULL
);

-- ==========================================
-- RESIDENT MEDICATIONS
-- ==========================================
CREATE TABLE resident_medications (
    id INTEGER PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    resident_id INTEGER NOT NULL,
    medication_name VARCHAR(150) NOT NULL,
    dosage_frequency VARCHAR(100) NOT NULL
);

-- ==========================================
-- RESIDENT ALLERGENS
-- ==========================================
CREATE TABLE resident_allergens (
    id INTEGER PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    resident_id INTEGER NOT NULL,
    allergen VARCHAR(150) NOT NULL,
    severity_level VARCHAR(50)
);
```
---

## Part 3 – Relationships & Audit Trail

```sql
-- ==========================================
-- RESIDENT FOCUS GROUPS
-- ==========================================
CREATE TABLE resident_focus_groups (
    resident_id INTEGER NOT NULL,
    focus_group_id INTEGER NOT NULL,
    PRIMARY KEY (resident_id, focus_group_id)
);

-- ==========================================
-- MEDICAL HISTORIES
-- ==========================================
CREATE TABLE medical_histories (
    id INTEGER PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    resident_id INTEGER NOT NULL,
    event_date DATE NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    reference_table VARCHAR(100),
    reference_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);
```
# CitiCare: Barangay Gumamela Healthcare Monitoring System

# System Description

CitiCare: Barangay Gumamela Healthcare Monitoring System is a web-based healthcare information management system designed to improve the efficiency and effectiveness of healthcare service delivery within Barangay Gumamela. The system facilitates the centralized management of resident health records, enabling Barangay Health Workers (BHWs) to monitor health conditions, track patient information, and support evidence-based decision-making.

A key component of the system is its AI-powered recommendation functionality, which analyzes resident health data to identify priority cases, detect emerging disease trends, classify residents and puroks according to health-related indicators, and forecast medicine demand. By transforming healthcare data into actionable insights, the system supports proactive healthcare planning, resource allocation, and community health interventions.

# Main Features

The CitiCare system provides the following core functionalities:

- **Resident Classification and Prioritization** – Categorizes residents based on health-related factors to assist healthcare workers in identifying priority cases and allocating resources effectively.
  
- **Data Analytics and Health Monitoring** – Analyzes collected health data to identify trends, patterns, and potential health risks within the community.
  
- **Report Generation** – Generates comprehensive reports to support monitoring, evaluation, and decision-making processes for healthcare programs and services.

## System Architecture and Technologies

**Resident Classification and Prioritization** – Categorizes residents based on health-related factors to assist healthcare workers in identifying priority cases and allocating resources effectively.

**Data Analytics and Health Monitoring** – Analyzes collected health data to identify trends, patterns, and potential health risks within the community.

**Report Generation** – Generates comprehensive reports to support monitoring, evaluation, and decision-making processes for healthcare programs and services.

System Architecture and Technologies
The system is developed using modern web technologies to ensure scalability, maintainability, and performance.

Frontend
React
Next.js
Backend
Node.js
JavaScript
Database
PostgreSQL
Deployment Platforms
Render
Vercel
Version Control
GitHub
System Development Methodology
This study adopts the Agile Development Methodology, specifically the Scrum Framework, to guide the design and development of the CitiCare Healthcare Monitoring System. Agile is selected due to its iterative development approach, emphasis on stakeholder collaboration, and ability to accommodate evolving system requirements throughout the development lifecycle.

- React
- Next.js
The development process consists of six phases:

**Planning Phase** - Requirements are gathered and analyzed through consultations with Barangay Health Workers (BHWs) to identify functional and non-functional system requirements.

**Design Phase** – The system architecture, database structure, user interface, and overall system design are developed based on the identified requirements.

**Development Phase** – System functionalities are incrementally implemented through Agile sprints, allowing continuous refinement and validation of features.

**Testing Phase** – Functional, integration, and user acceptance testing are conducted to ensure system reliability, accuracy, and usability.

**Deployment Phase** – The completed system is deployed within the operational environment of Barangay Gumamela and prepared for end-user utilization.

**Review Phase** – System performance and effectiveness are evaluated through stakeholder feedback, providing a basis for future enhancements and continuous improvement.

Throughout the development process, Barangay Health Workers actively participate in requirements validation, feature evaluation, and system testing to ensure that the final product accurately reflects the healthcare workflows and operational needs of the barangay.

- Node.js
- JavaScript
Database Design

# 1. Administrative & Organizational Tables
puroks

Divides the barangay into its 12 distinct geographic sub-areas and stores a running risk score for each area.

id (INT | PK, Auto Increment) — Unique identifier for each Purok.
purok_name (VARCHAR | Unique) — The name of the geographic area.
current_risk_score (DECIMAL) — A running aggregate risk score for the area.
bhws (Barangay Health Workers)
Tracks the 12 health workers and restricts each BHW to managing exactly one Purok.

- PostgreSQL
id (INT | PK, Auto Increment) — Unique identifier for each BHW.
first_name (VARCHAR) — First name of the health worker.
last_name (VARCHAR) — Last name of the health worker.
purok_id (INT | FK, Unique) — References puroks.id (Enforces 1:1 constraint per BHW).
contact_number (VARCHAR) — Contact details of the worker.
account_status (ENUM: 'Active', 'Inactive') — Current operational status.
households
Groups family units together under a specific Purok for local tracking.

id (INT | PK, Auto Increment) — Unique identifier for the household.
household_number (VARCHAR | Unique) — Government or local tracking ID for the house.
purok_id (INT | FK) — References puroks.id.
address_details (TEXT) — Specific address descriptors (street, block, landmark).

# 2. Core Resident Data

residents
The master list of every citizen living in the barangay, containing personal details, birth dates (for age grouping), and family roles.

- Render
- Vercel
id (INT | PK, Auto Increment) — Unique identifier for the resident.

household_id (INT | FK) — References households.id.

- GitHub
purok_id (INT | FK) — References puroks.id.

first_name (VARCHAR) — First name.

This study adopts the Agile Development Methodology, specifically the Scrum Framework, to guide the design and development of the CitiCare Healthcare Monitoring System. Agile is selected due to its iterative development approach, emphasis on stakeholder collaboration, and ability to accommodate evolving system requirements throughout the development lifecycle.
middle_name (VARCHAR | Nullable) — Middle name.

last_name (VARCHAR) — Last name.

1. **Planning Phase** – Requirements are gathered and analyzed through consultations with Barangay Health Workers (BHWs) to identify functional and non-functional system requirements.
2. **Design Phase** – The system architecture, database structure, user interface, and overall system design are developed based on the identified requirements.
3. **Development Phase** – System functionalities are incrementally implemented through Agile sprints, allowing continuous refinement and validation of features.
4. **Testing Phase** – Functional, integration, and user acceptance testing are conducted to ensure system reliability, accuracy, and usability.
5. **Deployment Phase** – The completed system is deployed within the operational environment of Barangay Gumamela and prepared for end-user utilization.
6. **Review Phase** – System performance and effectiveness are evaluated through stakeholder feedback, providing a basis for future enhancements and continuous improvement.
suffix (VARCHAR | Nullable) — Name suffixes (Jr., Sr., III, etc.).

birth_date (DATE) — Used for age calculations and demographic age group sectors.

sex (ENUM: 'Male', 'Female') — Biological sex.

civil_status (ENUM: 'Single', 'Married', 'Widowed', 'Separated') — Legal civil status.

#### `puroks`

Divides the barangay into its 12 distinct geographic sub-areas and stores a running risk score for each area.

- **`id`** (INT | PK, Auto Increment) — Unique identifier for each Purok.
- **`purok_name`** (VARCHAR | Unique) — The name of the geographic area.
- **`current_risk_score`** (DECIMAL) — A running aggregate risk score for the area.

#### `bhws` (Barangay Health Workers)

Tracks the 12 health workers and restricts each BHW to managing exactly one Purok.

- **`id`** (INT | PK, Auto Increment) — Unique identifier for each BHW.
- **`first_name`** (VARCHAR) — First name of the health worker.
- **`last_name`** (VARCHAR) — Last name of the health worker.
- **`purok_id`** (INT | FK, Unique) — References `puroks.id` (Enforces 1:1 constraint per BHW).
- **`contact_number`** (VARCHAR) — Contact details of the worker.
- **`account_status`** (ENUM: 'Active', 'Inactive') — Current operational status.

#### `households`

Groups family units together under a specific Purok for local tracking.

- **`id`** (INT | PK, Auto Increment) — Unique identifier for the household.
- **`household_number`** (VARCHAR | Unique) — Government or local tracking ID for the house.
- **`purok_id`** (INT | FK) — References `puroks.id`.
- **`address_details`** (TEXT) — Specific address descriptors (street, block, landmark).
contact_number (VARCHAR | Nullable) — Personal contact number.

is_household_head (BOOLEAN) — Identifies the main representative of the household unit.

created_at (TIMESTAMP) — Record creation timestamp.

#### `residents`

The master list of every citizen living in the barangay, containing personal details, birth dates (for age grouping), and family roles.

- **`id`** (INT | PK, Auto Increment) — Unique identifier for the resident.
- **`household_id`** (INT | FK) — References `households.id`.
- **`purok_id`** (INT | FK) — References `puroks.id`.
- **`first_name`** (VARCHAR) — First name.
- **`middle_name`** (VARCHAR | Nullable) — Middle name.
- **`last_name`** (VARCHAR) — Last name.
- **`suffix`** (VARCHAR | Nullable) — Name suffixes (Jr., Sr., III, etc.).
- **`birth_date`** (DATE) — Used for age calculations and demographic age group sectors.
- **`sex`** (ENUM: 'Male', 'Female') — Biological sex.
- **`civil_status`** (ENUM: 'Single', 'Married', 'Widowed', 'Separated') — Legal civil status.
- **`contact_number`** (VARCHAR | Nullable) — Personal contact number.
- **`is_household_head`** (BOOLEAN) — Identifies the main representative of the household unit.
- **`created_at`** (TIMESTAMP) — Record creation timestamp.

### 3. Focus Groups & Medical Profiles

#### `focus_groups`

A lookup directory for specific health sectors (e.g., Seniors, PWDs, Pregnant Women, Infants).

- **`id`** (INT | PK, Auto Increment) — Unique identifier for the health sector group.
- **`group_name`** (VARCHAR) — Name of the sector (e.g., 'Seniors', 'PWD').

#### `resident_focus_groups`

Connects residents to one or more focus groups (e.g., a resident who is both a Senior and a PWD).

- **`resident_id`** (INT | Composite PK, FK) — References `residents.id`.
- **`focus_group_id`** (INT | Composite PK, FK) — References `focus_groups.id`.

#### `health_profiles`

Stores a resident's real-time, automatically calculated health risk scores and basic medical status.

- **`id`** (INT | PK, Auto Increment) — Unique identifier for the profile.
- **`resident_id`** (INT | FK, Unique) — References `residents.id` (Enforces 1:1 relation).
- **`blood_type`** (VARCHAR | Nullable) — ABO blood group system typing.
- **`has_chronic_condition`** (BOOLEAN) — Quick flag for chronic illness tracking.
- **`current_risk_score`** (DECIMAL) — Calculated real-time risk assessment score.
- **`risk_level`** (ENUM: 'Low', 'Moderate', 'High') — Evaluated tier based on the risk score.
- **`last_calculated_at`** (TIMESTAMP) — Timestamp of the last risk engine update.

#### `chronic_conditions`

Records specific medical diagnoses (like Diabetes or Hypertension) tied to a resident's health profile.

- **`id`** (INT | PK, Auto Increment) — Unique identifier for the condition entry.
- **`health_profile_id`** (INT | FK) — References `health_profiles.id`.
- **`disease_name`** (VARCHAR) — Name of the illness (e.g., 'Hypertension').
- **`date_diagnosed`** (DATE | Nullable) — The date the resident was diagnosed.
- **`status`** (ENUM: 'Active', 'Managed', 'In Remission') — The clinical state of the condition.
3. Focus Groups & Medical Profiles
focus_groups
A lookup directory for specific health sectors (e.g., Seniors, PWDs, Pregnant Women, Infants).

id (INT | PK, Auto Increment) — Unique identifier for the health sector group.
group_name (VARCHAR) — Name of the sector (e.g., 'Seniors', 'PWD').
resident_focus_groups
Connects residents to one or more focus groups (e.g., a resident who is both a Senior and a PWD).

resident_id (INT | Composite PK, FK) — References residents.id.
focus_group_id (INT | Composite PK, FK) — References focus_groups.id.
health_profiles
Stores a resident's real-time, automatically calculated health risk scores and basic medical status.

id (INT | PK, Auto Increment) — Unique identifier for the profile.
resident_id (INT | FK, Unique) — References residents.id (Enforces 1:1 relation).
blood_type (VARCHAR | Nullable) — ABO blood group system typing.
has_chronic_condition (BOOLEAN) — Quick flag for chronic illness tracking.
current_risk_score (DECIMAL) — Calculated real-time risk assessment score.
risk_level (ENUM: 'Low', 'Moderate', 'High') — Evaluated tier based on the risk score.
last_calculated_at (TIMESTAMP) — Timestamp of the last risk engine update.
chronic_conditions
Records specific medical diagnoses (like Diabetes or Hypertension) tied to a resident's health profile.

#### `vaccines`

A Department of Health (DOH) reference list of required vaccines and their total required dosages.

- **`id`** (INT | PK, Auto Increment) — Unique identifier for the vaccine.
- **`vaccine_name`** (VARCHAR) — Brand or generic medical name.
- **`total_doses_required`** (INT) — Full routine dose count required for immunity.

#### `child_immunizations`

Logs when a child receives a vaccine dose, alongside vital stats like weight and temperature at that moment.

- **`id`** (INT | PK, Auto Increment) — Unique identifier for the immunization record.
- **`resident_id`** (INT | FK) — References `residents.id`.
- **`vaccine_id`** (INT | FK) — References `vaccines.id`.
- **`dose_number`** (INT) — The specific dosage step (e.g., 1st dose, 2nd dose).
- **`date_administered`** (DATE) — The date the shot was given.
- **`weight_kg`** (DECIMAL | Nullable) — Child's weight at appointment time.
- **`temperature`** (DECIMAL | Nullable) — Child's body temperature at appointment time.
- **`remarks`** (TEXT | Nullable) — Notes regarding side effects or clinical observations.

#### `vital_signs`

Keeps a running history of physical check-up metrics (BP, heart rate, weight) collected by BHWs.

- **`id`** (INT | PK, Auto Increment) — Unique identifier for the vitals entry.
- **`resident_id`** (INT | FK) — References `residents.id`.
- **`recorded_by_bhw_id`** (INT | FK) — References `bhws.id`.
- **`systolic_bp`** (INT | Nullable) — Upper blood pressure reading.
- **`diastolic_bp`** (INT | Nullable) — Lower blood pressure reading.
- **`heart_rate`** (INT | Nullable) — Pulse rate (Beats Per Minute).
- **`temperature`** (DECIMAL | Nullable) — Body temperature in Celsius.
- **`weight_kg`** (DECIMAL | Nullable) — Body weight in kilograms.
- **`height_cm`** (DECIMAL | Nullable) — Body height in centimeters.
- **`recorded_at`** (TIMESTAMP) — Date and time metrics were extracted.

#### `checkups_and_appointments`

Schedules medical visits and tracks whether patients attended, cancelled, or missed them.

- **`id`** (INT | PK, Auto Increment) — Unique identifier for the appointment slot.
- **`resident_id`** (INT | FK) — References `residents.id`.
- **`purpose`** (VARCHAR) — Reason for clinical encounter.
- **`scheduled_date`** (DATE) — Target date of the medical appointment.
- **`status`** (ENUM: 'Pending', 'Completed', 'Missed', 'Cancelled') — Status tracking indicator.
- **`remarks`** (TEXT | Nullable) — Context notes regarding cancellations or results.

#### `medical_histories`

A unified, chronological timeline that automatically indexes every event (vaccines, vitals, missed appointments) for a quick patient summary.

- **`id`** (BIGINT | PK, Auto Increment) — Global timeline tracking index identifier.
- **`resident_id`** (INT | FK) — References `residents.id`.
- **`event_date`** (DATE) — Exact day the health event occurred.
- **`event_type`** (ENUM: 'Checkup', 'Vaccination', 'Vital Signs Update', 'Admission', 'Risk Score Change') — Categorization of the log entry.
- **`description`** (TEXT) — System generated or manually typed abstract summary.
- **`reference_table`** (VARCHAR) — Name of originating table (Polymorphic tracking).
- **`reference_id`** (INT) — Matching record ID from originating table.
- **`created_at`** (TIMESTAMP) — Logging execution timestamp.
id (INT | PK, Auto Increment) — Unique identifier for the condition entry.
health_profile_id (INT | FK) — References health_profiles.id.
disease_name (VARCHAR) — Name of the illness (e.g., 'Hypertension').
date_diagnosed (DATE | Nullable) — The date the resident was diagnosed.
status (ENUM: 'Active', 'Managed', 'In Remission') — The clinical state of the condition.
4. Dynamic Tracking & History Logs
vaccines
A Department of Health (DOH) reference list of required vaccines and their total required dosages.

id (INT | PK, Auto Increment) — Unique identifier for the vaccine.
vaccine_name (VARCHAR) — Brand or generic medical name.
total_doses_required (INT) — Full routine dose count required for immunity.
child_immunizations
Logs when a child receives a vaccine dose, alongside vital stats like weight and temperature at that moment.

id (INT | PK, Auto Increment) — Unique identifier for the immunization record.
resident_id (INT | FK) — References residents.id.
vaccine_id (INT | FK) — References vaccines.id.
dose_number (INT) — The specific dosage step (e.g., 1st dose, 2nd dose).
date_administered (DATE) — The date the shot was given.
weight_kg (DECIMAL | Nullable) — Child's weight at appointment time.
temperature (DECIMAL | Nullable) — Child's body temperature at appointment time.
remarks (TEXT | Nullable) — Notes regarding side effects or clinical observations.
vital_signs
Keeps a running history of physical check-up metrics (BP, heart rate, weight) collected by BHWs.

id (INT | PK, Auto Increment) — Unique identifier for the vitals entry.
resident_id (INT | FK) — References residents.id.
recorded_by_bhw_id (INT | FK) — References bhws.id.
systolic_bp (INT | Nullable) — Upper blood pressure reading.
diastolic_bp (INT | Nullable) — Lower blood pressure reading.
heart_rate (INT | Nullable) — Pulse rate (Beats Per Minute).
temperature (DECIMAL | Nullable) — Body temperature in Celsius.
weight_kg (DECIMAL | Nullable) — Body weight in kilograms.
height_cm (DECIMAL | Nullable) — Body height in centimeters.
recorded_at (TIMESTAMP) — Date and time metrics were extracted.
checkups_and_appointments
Schedules medical visits and tracks whether patients attended, cancelled, or missed them.

id (INT | PK, Auto Increment) — Unique identifier for the appointment slot.
resident_id (INT | FK) — References residents.id.
purpose (VARCHAR) — Reason for clinical encounter.
scheduled_date (DATE) — Target date of the medical appointment.
status (ENUM: 'Pending', 'Completed', 'Missed', 'Cancelled') — Status tracking indicator.
remarks (TEXT | Nullable) — Context notes regarding cancellations or results.
medical_histories
A unified, chronological timeline that automatically indexes every event (vaccines, vitals, missed appointments) for a quick patient summary.

id (BIGINT | PK, Auto Increment) — Global timeline tracking index identifier.
resident_id (INT | FK) — References residents.id.
event_date (DATE) — Exact day the health event occurred.
event_type (ENUM: 'Checkup', 'Vaccination', 'Vital Signs Update', 'Admission', 'Risk Score Change') — Categorization of the log entry.
description (TEXT) — System generated or manually typed abstract summary.
reference_table (VARCHAR) — Name of originating table (Polymorphic tracking).
reference_id (INT) — Matching record ID from originating table.
created_at (TIMESTAMP) — Logging execution timestamp.

# System Dependencies

1. **Core Framework & UI (Next.js, React, & Tailwind)**
next – The core full-stack React framework providing hybrid rendering and built-in API routes.
react & react-dom – The underlying UI library for building modular, stateful dashboard components.
tailwindcss – A utility-first CSS framework for creating clean, mobile-responsive interfaces for BHWs.
lucide-react – A modern, lightweight icon library for navigation menus, status tags, and health indicators.
recharts – A composable charting library built on React components to render real-time Purok risk distributions and disease trends.

2. **Backend, Routing & Server Environment (Node.js & Express)**
express – Fast, unopinionated minimalist web framework used to spin up a dedicated custom backend server alongside Next.js.
cors – Enables Cross-Origin Resource Sharing, allowing your user interface to communicate securely with your backend server.
dotenv – Loads system configurations from a .env file to protect secret keys (e.g., Supabase credentials, DeepSeek API keys).
node-cron – A pure JavaScript task scheduler used to run background jobs (e.g., automated monthly data compiling for the monthly_purok_analytics table).

3. **Database, Real-Time & Authentication (Supabase & PostgreSQL)**
@supabase/supabase-js – The official isomorphic client library connecting the application directly to the PostgreSQL instance to handle user session logins, data transactions, and real-time record synchronization.

4. **AI Engine Processing (DeepSeek AI Integration)**
openai – The official SDK used to interface seamlessly with DeepSeek's OpenAI-compatible endpoints to feed prompt histories and fetch structured community health recommendations.

5. **API Security & Request Handling**
helmet – Helps secure the Express server by setting various crucial HTTP headers to protect sensitive resident health records.
morgan – An HTTP request logger middleware for Node.js, essential for tracking down broken API routes and diagnostic debugging during development.

6. **Data Validation, Forms, & Utilities**
zod – A TypeScript-first schema declaration and validation library to ensure corrupted, empty, or incorrectly formatted medical records never hit your database.
react-hook-form – Efficient, flexible, and extensible form state manager that speeds up rendering times on slow data connections.
date-fns – A lightweight utility set for parsing and formatting dates, used to calculate structural demographic sectors (e.g., separating infants from senior citizens via birthdates).

7. **Development Dependencies**(devDependencies)
nodemon – Automatically monitors application file changes and restarts the backend server dynamically during local testing.
postcss & autoprefixer – Essential parsing and CSS compiling libraries required by Tailwind CSS to optimize, shrink, and clean code for resource-constrained client hardware.

Project Setup
1. **Database Setup (Supabase)**
The application uses Supabase as its backend database and authentication provider.

Step 1: Create a Supabase Project
Sign in to the Supabase Dashboard.
Click New Project.
Enter your project details and wait for the project to finish provisioning.

Step 2: Retrieve API Credentials
Navigate to: Settings → API Copy the following values:

Project URL
Anon (Public) Key
Service Role Key These credentials will be used by the frontend and backend.
Step 3: Initialize the Database Schema
Open the SQL Editor.
Create a new query.
Paste the project's SQL schema.
Click Run to create the required tables, indexes, and relationships.

Step 4: Configure Row Level Security (RLS)
After the tables have been created:

Enable Row Level Security (RLS) on all tables.
Create the necessary RLS policies based on your application's access requirements.
Verify that unauthorized users cannot directly access protected data.

Project Structure
Frontend (citicare-frontend)
* **`id`** (BIGINT | PK, Auto Increment) — Global timeline tracking index identifier.
* **`resident_id`** (INT | FK) — References `residents.id`.
* **`event_date`** (DATE) — Exact day the health event occurred.
* **`event_type`** (ENUM: 'Checkup', 'Vaccination', 'Vital Signs Update', 'Admission', 'Risk Score Change') — Categorization of the log entry.
* **`description`** (TEXT) — System generated or manually typed abstract summary.
* **`reference_table`** (VARCHAR) — Name of originating table (Polymorphic tracking).
* **`reference_id`** (INT) — Matching record ID from originating table.
* **`created_at`** (TIMESTAMP) — Logging execution timestamp.

## System Dependencies

### 1. Core Framework & UI (Next.js, React, & Tailwind)

- **`next`** – The core full-stack React framework providing hybrid rendering and built-in API routes.
- **`react`** & **`react-dom`** – The underlying UI library for building modular, stateful dashboard components.
- **`tailwindcss`** – A utility-first CSS framework for creating clean, mobile-responsive interfaces for BHWs.
- **`lucide-react`** – A modern, lightweight icon library for navigation menus, status tags, and health indicators.
- **`recharts`** – A composable charting library built on React components to render real-time Purok risk distributions and disease trends.

### 2. Backend, Routing & Server Environment (Node.js & Express)

- **`express`** – Fast, unopinionated minimalist web framework used to spin up a dedicated custom backend server alongside Next.js.
- **`cors`** – Enables Cross-Origin Resource Sharing, allowing your user interface to communicate securely with your backend server.
- **`dotenv`** – Loads system configurations from a `.env` file to protect secret keys (e.g., Supabase credentials, DeepSeek API keys).
- **`node-cron`** – A pure JavaScript task scheduler used to run background jobs (e.g., automated monthly data compiling for the `monthly_purok_analytics` table).

### 3. Database, Real-Time & Authentication (Supabase & PostgreSQL)

- **`@supabase/supabase-js`** – The official isomorphic client library connecting the application directly to the PostgreSQL instance to handle user session logins, data transactions, and real-time record synchronization.

### 4. AI Engine Processing (DeepSeek AI Integration)

- **`openai`** – The official SDK used to interface seamlessly with DeepSeek's OpenAI-compatible endpoints to feed prompt histories and fetch structured community health recommendations.

### 5. API Security & Request Handling

- **`helmet`** – Helps secure the Express server by setting various crucial HTTP headers to protect sensitive resident health records.
- **`morgan`** – An HTTP request logger middleware for Node.js, essential for tracking down broken API routes and diagnostic debugging during development.

### 6. Data Validation, Forms, & Utilities

- **`zod`** – A TypeScript-first schema declaration and validation library to ensure corrupted, empty, or incorrectly formatted medical records never hit your database.
- **`react-hook-form`** – Efficient, flexible, and extensible form state manager that speeds up rendering times on slow data connections.
- **`date-fns`** – A lightweight utility set for parsing and formatting dates, used to calculate structural demographic sectors (e.g., separating infants from senior citizens via birthdates).

### 7. Development Dependencies (`devDependencies`)

- **`nodemon`** – Automatically monitors application file changes and restarts the backend server dynamically during local testing.
- **`postcss`** & **`autoprefixer`** – Essential parsing and CSS compiling libraries required by Tailwind CSS to optimize, shrink, and clean code for resource-constrained client hardware.


# Project Setup

## 1. Database Setup (Supabase)

The application uses **Supabase** as its backend database and authentication provider.

### Step 1: Create a Supabase Project

1. Sign in to the **Supabase Dashboard**.
2. Click **New Project**.
3. Enter your project details and wait for the project to finish provisioning.

### Step 2: Retrieve API Credentials

Navigate to:

```text
Settings → API
```

Copy the following values:

- **Project URL**
- **Anon (Public) Key**
- **Service Role Key**

These credentials will be used by the frontend and backend.

### Step 3: Initialize the Database Schema

# Project Setup
# 1. Database Setup (Supabase)
The application uses **Supabase** as its backend database and authentication provider.
## Step 1: Create a Supabase Project
1. Sign in to the **Supabase Dashboard**.
2. Click **New Project**.
3. Enter your project details and wait for the project to finish provisioning.
---
## Step 2: Retrieve API Credentials
Navigate to:
**Settings → API**
Copy the following values:
- **Project URL**
- **Anon (Public) Key**
- **Service Role Key**
These credentials will be used by the frontend and backend.
---
## Step 3: Initialize the Database Schema
1. Open the **SQL Editor**.
2. Create a new query.
3. Paste the project's SQL schema.
4. Click **Run** to create the required tables, indexes, and relationships.

### Step 4: Configure Row Level Security (RLS)

After the tables have been created:

- Enable **Row Level Security (RLS)** on all tables.
- Create the necessary RLS policies based on your application's access requirements.
- Verify that unauthorized users cannot directly access protected data.
---
## Step 4: Configure Row Level Security (RLS)
After the tables have been created:
- Enable **Row Level Security (RLS)** on all tables.
- Create the necessary RLS policies based on your application's access requirements.
- Verify that unauthorized users cannot directly access protected data.
---
  ## Project Structure
### Frontend (`citicare-frontend`)
The frontend is a structured React application built on the Next.js App Router framework. It manages stateful dashboards, client-side data validations, responsive Tailwind CSS layouts, and dynamic visualizations optimized for community health field usage.

citicare-frontend/             
├── public/                    
├── src/
│   ├── app/                   
│   │   ├── dashboard/         
│   │   └── residents/         
│   ├── components/            
│   │   └── ui/                
│   ├── hooks/                 
│   ├── lib/                   
│   ├── styles/                
│   └── utils/                 
├── .env.local                 
├── .gitignore                 
├── next.config.js             
├── package.json               
└── tailwind.config.js
Backend (citicare-backend)
The backend is an event-driven Node.js runtime operating an Express.js API server wrapper. It interfaces securely with Supabase to execute queries, runs background cron schedulers for demographic metrics, and routes operational prompts through DeepThink/DeepSeek AI.

citicare-backend/              
├── config/                    
├── controllers/               
├── middleware/                
├── routes/                    
├── services/                  
├── utils/                     
├── .env                       
├── .gitignore                 
├── package.json               
└── server.js


# 2. Backend Setup (`citicare-backend`)
The backend is built with **Node.js** and **Express.js** and serves as the API layer between the frontend, Supabase, and external AI services.
## Step 1: Navigate to the Backend Directory
```bash
cd citicare-backend
```
---
## Step 2: Install Dependencies
```bash
npm install
```
---
## Step 3: Configure Environment Variables
Create a `.env` file in the project's root directory.
```bash
touch .env
```
Add the following environment variables:
```env
PORT=5000
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_service_role_key
DEEPSEEK_API_KEY=your_deepseek_api_key
```
---
## Step 4: Start the Backend Server
Run the development server:
```bash
npm run dev
```
Or run the production server:
```bash
npm start
```
The backend server will be available at:
```text
http://localhost:5000
```
---

# 3. Frontend Setup (`citicare-frontend`)

The frontend is built with **React** using the **Next.js App Router**.

## Step 1: Navigate to the Frontend Directory

```bash
cd ../citicare-frontend
```

---

## Step 2: Install Dependencies

```bash
npm install
```

---


```bash
npm install
```

---

## Step 3: Configure Environment Variables

Create a `.env.local` file in the project's root directory.

```bash
touch .env.local
```

Add the following environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_public_key

NEXT_PUBLIC_API_URL=http://localhost:5000
```

---

## Step 4: Start the Frontend Development Server

Run the development server:

```bash
npm run dev
```

The frontend application will be available at:

```text
http://localhost:3000
```

Open the URL above in your browser to access the application.

---

# 4. Running the Application

Start the backend and frontend in separate terminal windows.

### Terminal 1

```bash
cd citicare-backend
npm run dev
```

### Terminal 2

```bash
cd citicare-frontend
npm run dev
```

Once both services are running, open the following URLs:

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000

The application is now ready for local development.

# Database SQl

## Part 1 – Core Tables

```sql
-- ==========================================
-- USERS
-- ==========================================
CREATE TABLE users (
    id INTEGER PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- ==========================================
-- PUROKS
-- ==========================================
CREATE TABLE puroks (
    id INTEGER PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    purok_name VARCHAR(100) NOT NULL,
    current_risk_score DECIMAL(5,2) DEFAULT 0.00 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- ==========================================
-- VACCINES
-- ==========================================
CREATE TABLE vaccines (
    id INTEGER PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    vaccine_name VARCHAR(100) NOT NULL UNIQUE,
    total_doses_required INTEGER NOT NULL
);

-- ==========================================
-- FOCUS GROUPS
-- ==========================================
CREATE TABLE focus_groups (
    id INTEGER PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    group_name VARCHAR(100) NOT NULL UNIQUE
);

-- ==========================================
-- BARANGAY HEALTH WORKERS (BHWS)
-- ==========================================
CREATE TABLE bhws (
    id INTEGER PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    user_id INTEGER NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    purok_id INTEGER NOT NULL,
    contact_number VARCHAR(20),
    account_status VARCHAR(50) DEFAULT 'Active' NOT NULL
);

-- ==========================================
-- HOUSEHOLDS
-- ==========================================
CREATE TABLE households (
    id INTEGER PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    household_number VARCHAR(100) NOT NULL UNIQUE,
    purok_id INTEGER NOT NULL,
    address_details TEXT
);

-- ==========================================
-- RESIDENTS
-- ==========================================
CREATE TABLE residents (
    id INTEGER PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    household_id INTEGER,
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    suffix VARCHAR(20),
    birth_date DATE NOT NULL,
    sex VARCHAR(20) NOT NULL,
    civil_status VARCHAR(50) NOT NULL,
    contact_number VARCHAR(20),
    is_household_head BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);
```
## Part 2 – Health Records

```sql
-- ==========================================
-- VITAL SIGNS
-- ==========================================
CREATE TABLE vital_signs (
    id INTEGER PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    resident_id INTEGER NOT NULL,
    recorded_by_bhw_id INTEGER NOT NULL,
    systolic_bp INTEGER,
    diastolic_bp INTEGER,
    heart_rate INTEGER,
    temperature DECIMAL(4,1),
    weight_kg DECIMAL(5,2),
    height_cm DECIMAL(5,2),
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- ==========================================
-- CHILD IMMUNIZATIONS
-- ==========================================
CREATE TABLE child_immunizations (
    id INTEGER PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    resident_id INTEGER NOT NULL,
    vaccine_id INTEGER NOT NULL,
    vital_signs_id INTEGER,
    dose_number INTEGER NOT NULL,
    date_administered DATE NOT NULL,
    remarks TEXT
);

-- ==========================================
-- CHECKUPS AND APPOINTMENTS
-- ==========================================
CREATE TABLE checkups_and_appointments (
    id INTEGER PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    resident_id INTEGER NOT NULL,
    assigned_to_bhw_id INTEGER NOT NULL,
    purpose VARCHAR(255) NOT NULL,
    scheduled_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'Pending' NOT NULL,
    remarks TEXT,
    date_executed TIMESTAMP WITH TIME ZONE
);

-- ==========================================
-- HEALTH PROFILES
-- ==========================================
CREATE TABLE health_profiles (
    id INTEGER PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    resident_id INTEGER NOT NULL UNIQUE,
    blood_type VARCHAR(10),
    has_chronic_condition BOOLEAN DEFAULT FALSE NOT NULL,
    current_risk_score DECIMAL(5,2) DEFAULT 0.00 NOT NULL,
    risk_level VARCHAR(50) DEFAULT 'Low' NOT NULL,
    last_calculated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- ==========================================
-- CHRONIC CONDITIONS
-- ==========================================
CREATE TABLE chronic_conditions (
    id INTEGER PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    resident_id INTEGER NOT NULL,
    disease_name VARCHAR(150) NOT NULL,
    date_diagnosed DATE,
    status VARCHAR(50) DEFAULT 'Active' NOT NULL
);

-- ==========================================
-- RESIDENT MEDICATIONS
-- ==========================================
CREATE TABLE resident_medications (
    id INTEGER PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    resident_id INTEGER NOT NULL,
    medication_name VARCHAR(150) NOT NULL,
    dosage_frequency VARCHAR(100) NOT NULL
);

-- ==========================================
-- RESIDENT ALLERGENS
-- ==========================================
CREATE TABLE resident_allergens (
    id INTEGER PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    resident_id INTEGER NOT NULL,
    allergen VARCHAR(150) NOT NULL,
    severity_level VARCHAR(50)
);
```
## Part 3 – Relationships & Audit Trail

```sql
-- ==========================================
-- RESIDENT FOCUS GROUPS
-- ==========================================
CREATE TABLE resident_focus_groups (
    resident_id INTEGER NOT NULL,
    focus_group_id INTEGER NOT NULL,
    PRIMARY KEY (resident_id, focus_group_id)
);

-- ==========================================
-- MEDICAL HISTORIES
-- ==========================================
CREATE TABLE medical_histories (
    id INTEGER PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    resident_id INTEGER NOT NULL,
    event_date DATE NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    reference_table VARCHAR(100),
    reference_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);
```
---

## Conceptual Framework

The conceptual framework of the CitiCare: Barangay Gumamela Healthcare Monitoring System follows an Input-Process-Output (IPO) model. The Input stage consists of all raw data entered into the system by Barangay Health Workers (BHWs). This includes resident personal information, resident medical history, and resident checkup records. These inputs serve as the foundational data that the system processes to generate meaningful outputs.

The Process stage is divided into various steps. The first is to store and organize all resident data for efficient retrieval. The next is the computation of health risk scores for residents and puroks. Resident health risk scores are computed based on age, chronic conditions, vital signs, and missed checkups, while purok health risk scores are based on the number of residents in each health risk level. The third step is to identify and analyze health trends, which determines monthly health risk level distributions, identifies the most common diseases per purok, and identifies the number of health risk levels per purok. An additional step is generating recommendations, which uses the outputs from previous steps to provide suggestions for BHWs.

The Output stage delivers the final results to BHWs. These include accurate health reports, a purok priority list, a prioritized list of residents who need immediate attention, and health trends analytics, which are used in a dashboard to provide a visual presentation of data, as well as AI-generated recommendations for monthly, quarterly, and annual schedules. This framework shows how CitiCare processes raw residents data to obtain insights within a structured, sequential process that allows Barangay Gumamela to shift its manual, inefficient healthcare management to a proactive, data-driven system.

## AI Integration Design

The AI integration layer of CitiCare features a specialized Health Recommendation Engine that transforms resident data into actionable community health insights. This component utilizes the DeepSeek large language model API to provide intelligent decision support for Barangay Health Workers (BHWs). The integration uses a client-side inference approach via the DeepSeek API, enabling the system to process complex medical histories and health trends.

AI-Powered Health Recommendation Engine
The Health Recommendation Engine serves as a proactive monitoring tool, generating data-driven suggestions to improve healthcare delivery in Barangay Gumamela. The engine's primary purpose is to analyze structured health data, including resident medical histories, chronic conditions, and vital signs, to identify priority cases and emerging community health patterns. By processing these inputs, the AI generates specific recommendations for BHWs, such as identifying high- and critical-risk residents who require urgent home visits or LGU referrals, highlighting puroks with rising disease trends, and suggesting medicine procurement priorities based on seasonal illness trends.

Integration of the DeepSeek model will be achieved through using designed prompts that turn data from the barangay's PostgreSQL database into meaningful input for the API. Whenever a BHW accesses the system, it gathers relevant health details, such as medical histories and existing conditions, and it sends a secure request to the DeepSeek API. The model returns a structured recommendation, which the system translates and displays within the CitiCare interface. To keep recommendations accurate and locally appropriate, the system uses a custom prompt that limits the AI's reasoning to community health guidelines and Barangay Gumamela's specific needs. These recommendations are updated on a regular schedule, specifically monthly, quarterly, and yearly. This ensures barangay leaders always have current and useful information for planning resources and running preventive health programs.


