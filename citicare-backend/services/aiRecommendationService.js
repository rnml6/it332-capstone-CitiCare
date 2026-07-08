const { supabaseAdmin } = require('../config/supabase');
const { GoogleGenerativeAI } = require('@google/generative-ai');

class AIRecommendationService {
    constructor() {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error('❌ GEMINI_API_KEY is not set in environment variables');
        } else {
            console.log('✅ Gemini API Key found (length:', apiKey.length, ')');
        }
        
        this.apiKey = apiKey;
        this.genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
        
        // Use Gemini models
        this.modelNames = [
            'gemini-2.5-flash',
            'gemini-2.5-flash-lite',
            'gemini-2.0-flash',
            'gemini-1.5-pro'
        ];
        
        this.model = null;
        this.modelName = null;
        this.tableColumns = null;
        this.initialized = false;
        this.initPromise = null;
        this.lastError = null;
        
        this.initModel();
    }

    async initModel() {
        if (this.initPromise) return this.initPromise;
        
        this.initPromise = (async () => {
            if (this.initialized && this.model) {
                console.log('✅ Model already initialized:', this.modelName);
                return;
            }
            
            if (!this.apiKey || !this.genAI) {
                console.error('❌ No API key available');
                this.initialized = false;
                this.lastError = 'API key not available';
                return;
            }

            console.log('🔄 Initializing Gemini models...');
            let lastError = null;

            for (const modelName of this.modelNames) {
                try {
                    console.log(`🔄 Trying model: ${modelName}`);
                    
                    const model = this.genAI.getGenerativeModel({ 
                        model: modelName,
                        generationConfig: {
                            temperature: 0.7,
                            topK: 1,
                            topP: 0.8,
                            maxOutputTokens: 2048,
                        }
                    });
                    
                    const testResult = await Promise.race([
                        model.generateContent('Hello'),
                        new Promise((_, reject) => 
                            setTimeout(() => reject(new Error('Timeout')), 10000)
                        )
                    ]);
                    
                    if (testResult && testResult.response) {
                        this.model = model;
                        this.modelName = modelName;
                        this.initialized = true;
                        this.lastError = null;
                        console.log(`✅ Successfully initialized: ${modelName}`);
                        return;
                    }
                } catch (error) {
                    lastError = error;
                    console.log(`❌ ${modelName} failed:`, error.message);
                }
            }
            
            this.lastError = lastError ? lastError.message : 'All models failed';
            console.error('❌ No Gemini models available');
            this.initialized = false;
            this.model = null;
        })();
        
        return this.initPromise;
    }

    async ensureModel() {
        if (this.initPromise) {
            await this.initPromise;
        }
        
        if (!this.initialized || !this.model) {
            console.log('🔄 Retrying model initialization...');
            this.initPromise = null;
            await this.initModel();
            
            if (!this.initialized || !this.model) {
                throw new Error(`Gemini AI unavailable: ${this.lastError}`);
            }
        }
        
        return this.model;
    }

    // ============= CORE AI RECOMMENDATION FUNCTION =============
    async generateRecommendations(residentId, period) {
        try {
            console.log(`📊 Generating ${period} recommendations for resident: ${residentId}`);
            
            const model = await this.ensureModel();
            const residentData = await this.gatherResidentData(residentId);
            console.log(`✅ Data gathered for ${residentData.resident.first_name}`);
            
            const prompt = this.buildPrompt(residentData, period);
            console.log(`📝 Sending to Gemini AI (${this.modelName})...`);
            
            let recommendationText = null;
            let structuredData = null;
            let lastError = null;
            
            // Retry logic with 3 attempts
            for (let attempt = 1; attempt <= 3; attempt++) {
                try {
                    console.log(`🔄 AI Attempt ${attempt}/3...`);
                    
                    const result = await Promise.race([
                        model.generateContent(prompt),
                        new Promise((_, reject) => 
                            setTimeout(() => reject(new Error('Timeout (30s)')), 30000)
                        )
                    ]);
                    
                    recommendationText = result.response.text();
                    
                    if (recommendationText && recommendationText.length > 50) {
                        console.log(`✅ AI generated (${recommendationText.length} chars)`);
                        structuredData = this.parseStructuredRecommendation(recommendationText);
                        break;
                    }
                } catch (error) {
                    lastError = error;
                    console.error(`❌ Attempt ${attempt} failed:`, error.message);
                    
                    if (attempt < 3) {
                        await new Promise(resolve => setTimeout(resolve, attempt * 3000));
                    }
                }
            }
            
            if (!recommendationText) {
                throw new Error(`AI generation failed after 3 attempts: ${lastError?.message || 'Unknown error'}`);
            }

            // Build insert data with all fields
            const insertData = {
                resident_id: residentId,
                recommendation_type: period,
                recommendation_text: recommendationText,
                generated_at: new Date().toISOString(),
                model_used: this.modelName || 'unknown',
                priority_level: structuredData?.priorityLevel || this.extractPriorityLevel(recommendationText),
                risk_score: structuredData?.riskScore || this.extractRiskScore(recommendationText),
                action_items: structuredData?.actionItems || this.extractActionItems(recommendationText),
                warning_signs: structuredData?.warningSigns || this.extractWarningSigns(recommendationText),
                referral_needed: structuredData?.referralNeeded || this.extractReferralNeeded(recommendationText),
                follow_up_date: structuredData?.followUpDate || this.calculateFollowUpDate(period)
            };

            console.log('💾 Saving AI-generated recommendations to database...');

            const { data, error } = await supabaseAdmin
                .from('ai_recommendations')
                .insert(insertData)
                .select()
                .single();

            if (error) {
                console.error('❌ Save error:', error);
                // Try saving minimal data if full save fails
                const minimalData = {
                    resident_id: residentId,
                    recommendation_type: period,
                    recommendation_text: recommendationText,
                    generated_at: new Date().toISOString(),
                    model_used: this.modelName || 'unknown'
                };
                const { data: minimalResult, error: minimalError } = await supabaseAdmin
                    .from('ai_recommendations')
                    .insert(minimalData)
                    .select()
                    .single();
                
                if (minimalError) throw minimalError;
                console.log('✅ Minimal data saved');
                return minimalResult;
            }

            console.log('✅ AI recommendations saved successfully');
            return data;
            
        } catch (error) {
            console.error('❌ Error generating AI recommendations:', error);
            throw new Error(`AI recommendation generation failed: ${error.message}`);
        }
    }

    // ============= PARSE STRUCTURED RECOMMENDATION =============
    parseStructuredRecommendation(recommendationText) {
        try {
            // Try to extract JSON from the response
            const jsonMatch = recommendationText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return {
                    priorityLevel: parsed.priorityLevel || 'MEDIUM',
                    riskScore: parsed.riskScore || 50,
                    actionItems: parsed.actionItems || [],
                    warningSigns: parsed.warningSigns || [],
                    referralNeeded: parsed.referralNeeded || false,
                    followUpDate: parsed.followUpDate || null
                };
            }
        } catch (error) {
            console.log('Could not parse JSON from AI response, using text extraction');
        }
        
        // Fallback to text extraction
        return {
            priorityLevel: this.extractPriorityLevel(recommendationText),
            riskScore: this.extractRiskScore(recommendationText),
            actionItems: this.extractActionItems(recommendationText),
            warningSigns: this.extractWarningSigns(recommendationText),
            referralNeeded: this.extractReferralNeeded(recommendationText),
            followUpDate: null
        };
    }

    // ============= EXTRACTION HELPER FUNCTIONS =============
    extractPriorityLevel(text) {
        const lower = text.toLowerCase();
        if (lower.includes('critical') || lower.includes('emergency')) return 'CRITICAL';
        if (lower.includes('high') || lower.includes('severe') || lower.includes('urgent')) return 'HIGH';
        if (lower.includes('medium') || lower.includes('moderate')) return 'MEDIUM';
        if (lower.includes('low') || lower.includes('minor')) return 'LOW';
        return 'MEDIUM';
    }

    extractRiskScore(text) {
        // Try to find explicit risk score
        const match = text.match(/risk score[:\s]*(\d+)/i);
        if (match) {
            const score = parseInt(match[1]);
            if (score >= 0 && score <= 100) return score;
        }
        
        // Calculate based on keywords
        let score = 50;
        const lower = text.toLowerCase();
        if (lower.includes('critical') || lower.includes('emergency')) score += 30;
        if (lower.includes('high') || lower.includes('severe')) score += 20;
        if (lower.includes('moderate') || lower.includes('medium')) score += 10;
        if (lower.includes('low') || lower.includes('minor')) score -= 10;
        if (lower.includes('multiple')) score += 10;
        if (lower.includes('chronic')) score += 5;
        if (lower.includes('uncontrolled')) score += 15;
        if (lower.includes('elderly') || lower.includes('senior')) score += 10;
        if (lower.includes('child') || lower.includes('infant')) score += 10;
        
        return Math.min(100, Math.max(0, score));
    }

    extractActionItems(text) {
        const actions = [];
        const lines = text.split('\n');
        let inActionSection = false;
        
        for (const line of lines) {
            const trimmedLine = line.trim();
            
            // Detect action section headers
            if (trimmedLine.toLowerCase().includes('action') || 
                trimmedLine.toLowerCase().includes('recommendation') ||
                trimmedLine.toLowerCase().includes('steps to take') ||
                trimmedLine.toLowerCase().includes('what to do')) {
                inActionSection = true;
                continue;
            }
            
            // End of action section
            if (inActionSection && (trimmedLine === '' || 
                trimmedLine.toLowerCase().includes('warning') ||
                trimmedLine.toLowerCase().includes('signs') ||
                trimmedLine.toLowerCase().includes('referral'))) {
                inActionSection = false;
                continue;
            }
            
            // Extract action items
            if (inActionSection || trimmedLine.match(/^[-•*]\s*(recommend|action|follow-up|monitor|schedule|check|refer|take|exercise|eat|avoid|maintain|practice|consult|review|ensure|consider|implement|attend|keep|record|track|report|discuss|plan|prepare|arrange|visit|call|contact)/i)) {
                const action = trimmedLine.replace(/^[-•*]\s*/, '').trim();
                if (action.length > 10) {
                    let urgency = 'PLANNED';
                    let type = 'OTHER';
                    
                    // Determine urgency
                    if (action.toLowerCase().includes('immediate') || 
                        action.toLowerCase().includes('urgent') || 
                        action.toLowerCase().includes('asap')) {
                        urgency = 'IMMEDIATE';
                    } else if (action.toLowerCase().includes('week') || 
                              action.toLowerCase().includes('days') ||
                              action.toLowerCase().includes('within')) {
                        urgency = 'WITHIN_WEEK';
                    } else if (action.toLowerCase().includes('month')) {
                        urgency = 'WITHIN_MONTH';
                    }
                    
                    // Determine action type
                    if (action.toLowerCase().includes('visit') || 
                        action.toLowerCase().includes('home') || 
                        action.toLowerCase().includes('house')) {
                        type = 'HOME_VISIT';
                    } else if (action.toLowerCase().includes('refer') || 
                              action.toLowerCase().includes('lgu') || 
                              action.toLowerCase().includes('specialist') ||
                              action.toLowerCase().includes('hospital')) {
                        type = 'LGU_REFERRAL';
                    } else if (action.toLowerCase().includes('medication') || 
                              action.toLowerCase().includes('prescribe') || 
                              action.toLowerCase().includes('drug') ||
                              action.toLowerCase().includes('medicine')) {
                        type = 'MEDICATION';
                    } else if (action.toLowerCase().includes('diet') || 
                              action.toLowerCase().includes('eat') || 
                              action.toLowerCase().includes('nutrition') || 
                              action.toLowerCase().includes('food')) {
                        type = 'DIET';
                    } else if (action.toLowerCase().includes('exercise') || 
                              action.toLowerCase().includes('walk') || 
                              action.toLowerCase().includes('activity') || 
                              action.toLowerCase().includes('physical')) {
                        type = 'EXERCISE';
                    } else if (action.toLowerCase().includes('vaccine') || 
                              action.toLowerCase().includes('immunization') || 
                              action.toLowerCase().includes('shot')) {
                        type = 'VACCINATION';
                    } else if (action.toLowerCase().includes('stress') || 
                              action.toLowerCase().includes('mental') || 
                              action.toLowerCase().includes('emotional') || 
                              action.toLowerCase().includes('psych')) {
                        type = 'MENTAL_HEALTH';
                    } else if (action.toLowerCase().includes('follow') || 
                              action.toLowerCase().includes('check') || 
                              action.toLowerCase().includes('monitor') || 
                              action.toLowerCase().includes('track')) {
                        type = 'FOLLOW_UP';
                    } else if (action.toLowerCase().includes('test') || 
                              action.toLowerCase().includes('screen') || 
                              action.toLowerCase().includes('exam')) {
                        type = 'SCREENING';
                    } else if (action.toLowerCase().includes('lifestyle') || 
                              action.toLowerCase().includes('habit') || 
                              action.toLowerCase().includes('routine')) {
                        type = 'LIFESTYLE';
                    }
                    
                    actions.push({ action, urgency, type });
                }
            }
        }
        
        return actions.slice(0, 10);
    }

    extractWarningSigns(text) {
        const warnings = [];
        const lines = text.split('\n');
        let inWarningSection = false;
        
        for (const line of lines) {
            const trimmedLine = line.trim();
            
            // Detect warning section headers
            if (trimmedLine.toLowerCase().includes('warning sign') || 
                trimmedLine.toLowerCase().includes('signs to watch') ||
                trimmedLine.toLowerCase().includes('watch for') ||
                trimmedLine.toLowerCase().includes('danger sign') ||
                trimmedLine.toLowerCase().includes('symptoms to monitor')) {
                inWarningSection = true;
                continue;
            }
            
            // Extract warning items
            if (inWarningSection && trimmedLine.match(/^[-•*]/)) {
                const warning = trimmedLine.replace(/^[-•*]\s*/, '').trim();
                if (warning.length > 5) {
                    warnings.push(warning);
                }
            }
            
            if (inWarningSection && trimmedLine === '' && warnings.length > 0) {
                inWarningSection = false;
            }
        }
        
        return warnings.slice(0, 10);
    }

    extractReferralNeeded(text) {
        const lower = text.toLowerCase();
        return lower.includes('referral') || 
               lower.includes('refer to') || 
               lower.includes('specialist') ||
               lower.includes('hospital') ||
               lower.includes('lgu') ||
               lower.includes('clinic') ||
               lower.includes('emergency room') ||
               lower.includes('er') ||
               lower.includes('tertiary') ||
               lower.includes('doctor') ||
               lower.includes('physician');
    }

    // ============= DATA GATHERING =============
    async gatherResidentData(residentId) {
        try {
            // Get resident with household and purok info
            const { data: resident, error: residentError } = await supabaseAdmin
                .from('residents')
                .select(`
                    *,
                    households!inner(
                        household_number, 
                        address_details, 
                        puroks!inner(purok_name, risk_level)
                    )
                `)
                .eq('id', residentId)
                .single();
            if (residentError) throw residentError;

            // Get health profile
            const { data: healthProfile, error: healthProfileError } = await supabaseAdmin
                .from('health_profiles')
                .select('*')
                .eq('resident_id', residentId)
                .maybeSingle();
            if (healthProfileError) throw healthProfileError;

            // Get chronic conditions
            const { data: conditions, error: conditionError } = await supabaseAdmin
                .from('chronic_conditions')
                .select('*')
                .eq('resident_id', residentId)
                .eq('status', 'Active');
            if (conditionError) throw conditionError;

            // Get medications
            const { data: medications, error: medError } = await supabaseAdmin
                .from('resident_medications')
                .select('*')
                .eq('resident_id', residentId)
                .eq('status', 'Active');
            if (medError) throw medError;

            // Get allergens
            const { data: allergens, error: allergenError } = await supabaseAdmin
                .from('resident_allergens')
                .select('*')
                .eq('resident_id', residentId);
            if (allergenError) throw allergenError;

            // Get vital signs
            const { data: vitals, error: vitalError } = await supabaseAdmin
                .from('vital_signs')
                .select('*')
                .eq('resident_id', residentId)
                .order('recorded_at', { ascending: false })
                .limit(5);
            if (vitalError) throw vitalError;

            // Get appointments
            const { data: appointments, error: appError } = await supabaseAdmin
                .from('checkups_and_appointments')
                .select('*')
                .eq('resident_id', residentId)
                .order('scheduled_date', { ascending: false })
                .limit(5);
            if (appError) throw appError;

            // Get medical history
            const { data: medicalHistory, error: historyError } = await supabaseAdmin
                .from('medical_histories')
                .select('*')
                .eq('resident_id', residentId)
                .order('event_date', { ascending: false })
                .limit(5);
            if (historyError) throw historyError;

            // Get focus groups
            const { data: focusGroupLinks, error: focusGroupError } = await supabaseAdmin
                .from('resident_focus_groups')
                .select('focus_groups(id, group_name)')
                .eq('resident_id', residentId);
            if (focusGroupError) throw focusGroupError;

            const focusGroups = (focusGroupLinks || [])
                .map(link => link.focus_groups?.group_name)
                .filter(Boolean);

            // Get immunizations
            const { data: immunizations, error: immunizationError } = await supabaseAdmin
                .from('child_immunizations')
                .select(`
                    dose_number,
                    date_administered,
                    remarks,
                    vaccines(vaccine_name)
                `)
                .eq('resident_id', residentId)
                .order('date_administered', { ascending: false });
            if (immunizationError) throw immunizationError;

            return {
                resident,
                healthProfile: healthProfile || null,
                conditions: conditions || [],
                medications: medications || [],
                allergens: allergens || [],
                vitals: vitals || [],
                appointments: appointments || [],
                medicalHistory: medicalHistory || [],
                focusGroups,
                immunizations: immunizations || []
            };
        } catch (error) {
            console.error('Error gathering resident data:', error);
            throw error;
        }
    }

    // ============= BUILD PROMPT FOR GEMINI =============
    buildPrompt(residentData, period) {
        const age = this.calculateAge(residentData.resident.birth_date);
        const purok = residentData.resident.households?.puroks;
        const household = residentData.resident.households;
        const healthProfile = residentData.healthProfile;

        let prompt = `You are a healthcare AI assistant for the CitiCare: Barangay Gumamela Healthcare Monitoring System. 
Generate comprehensive ${period} health recommendations for a ${residentData.resident.sex} resident aged ${age} years old.

RESIDENT INFORMATION:
- Name: ${residentData.resident.first_name} ${residentData.resident.last_name}
- Age: ${age}
- Sex: ${residentData.resident.sex}
- Civil Status: ${residentData.resident.civil_status || 'Not specified'}
- Occupation: ${residentData.resident.occupation || 'Not specified'}
- Household Number: ${household?.household_number || 'Not specified'}
- Address: ${household?.address_details || 'Not specified'}
- Purok: ${purok?.purok_name || 'Not specified'}
- Purok Risk Level: ${purok?.risk_level || 'Not assessed'}
- Health Risk Level: ${healthProfile?.risk_level || 'Not assessed'}
- Blood Type: ${healthProfile?.blood_type || 'Not on record'}
`;

        // Add BMI if exists
        if (healthProfile?.bmi) {
            prompt += `- BMI: ${healthProfile.bmi}\n`;
        }

        // Add focus groups
        if (residentData.focusGroups && residentData.focusGroups.length > 0) {
            prompt += `- Focus Groups: ${residentData.focusGroups.join(', ')}\n`;
        }

        // Health profile details
        if (healthProfile) {
            prompt += `\nHEALTH PROFILE:\n`;
            if (healthProfile.medical_history) {
                prompt += `- Medical History: ${healthProfile.medical_history}\n`;
            }
            if (healthProfile.family_history) {
                prompt += `- Family History: ${healthProfile.family_history}\n`;
            }
            if (healthProfile.smoking_status) {
                prompt += `- Smoking Status: ${healthProfile.smoking_status}\n`;
            }
            if (healthProfile.alcohol_consumption) {
                prompt += `- Alcohol Consumption: ${healthProfile.alcohol_consumption}\n`;
            }
        }

        // Chronic conditions
        if (residentData.conditions && residentData.conditions.length > 0) {
            prompt += `\nACTIVE CHRONIC CONDITIONS:\n`;
            residentData.conditions.forEach(c => {
                prompt += `- ${c.disease_name} (Diagnosed: ${c.date_diagnosed || 'Unknown'}, Severity: ${c.severity || 'Not specified'})\n`;
                if (c.treatment_plan) {
                    prompt += `  Treatment: ${c.treatment_plan}\n`;
                }
            });
        }

        // Medications
        if (residentData.medications && residentData.medications.length > 0) {
            prompt += `\nCURRENT MEDICATIONS:\n`;
            residentData.medications.forEach(m => {
                prompt += `- ${m.medication_name}: ${m.dosage_frequency || 'As prescribed'}${m.dosage ? `, ${m.dosage}` : ''}\n`;
            });
        }

        // Allergens
        if (residentData.allergens && residentData.allergens.length > 0) {
            prompt += `\nKNOWN ALLERGENS:\n`;
            residentData.allergens.forEach(a => {
                prompt += `- ${a.allergen} (Severity: ${a.severity_level || 'Not specified'})\n`;
            });
        }

        // Vital signs
        if (residentData.vitals && residentData.vitals.length > 0) {
            const latest = residentData.vitals[0];
            prompt += `\nLATEST VITAL SIGNS (${new Date(latest.recorded_at).toLocaleDateString()}):\n`;
            prompt += `- Blood Pressure: ${latest.systolic_bp || 'N/A'}/${latest.diastolic_bp || 'N/A'} mmHg\n`;
            prompt += `- Heart Rate: ${latest.heart_rate || 'N/A'} bpm\n`;
            prompt += `- Temperature: ${latest.temperature || 'N/A'} °C\n`;
            prompt += `- Weight: ${latest.weight_kg || 'N/A'} kg\n`;
            prompt += `- Height: ${latest.height_cm || 'N/A'} cm\n`;
            if (latest.blood_sugar) prompt += `- Blood Sugar: ${latest.blood_sugar} mg/dL\n`;
            if (latest.oxygen_saturation) prompt += `- Oxygen Saturation: ${latest.oxygen_saturation}%\n`;
        }

        // Appointments
        if (residentData.appointments && residentData.appointments.length > 0) {
            prompt += `\nRECENT APPOINTMENTS:\n`;
            residentData.appointments.forEach(a => {
                prompt += `- ${a.scheduled_date}: ${a.purpose || 'Check-up'} (Status: ${a.status || 'Scheduled'})\n`;
            });
        }

        // Medical history
        if (residentData.medicalHistory && residentData.medicalHistory.length > 0) {
            prompt += `\nRECENT MEDICAL HISTORY:\n`;
            residentData.medicalHistory.forEach(h => {
                prompt += `- ${h.event_date}: ${h.event_type || 'Medical event'}\n`;
            });
        }

        // Immunizations
        if (residentData.immunizations && residentData.immunizations.length > 0) {
            prompt += `\nIMMUNIZATIONS:\n`;
            residentData.immunizations.forEach(i => {
                prompt += `- ${i.vaccines?.vaccine_name || 'Vaccine'}: Dose ${i.dose_number || 'N/A'}, Administered: ${i.date_administered || 'Unknown'}\n`;
            });
        }

        // ===== THE IMPORTANT PART: AI RECOMMENDATION INSTRUCTIONS =====
        prompt += `\nBased on this complete health profile, provide detailed ${period} health recommendations.

PURPOSE OF AI RECOMMENDATIONS:
1. Identify priority cases that need immediate attention
2. Detect emerging disease trends before they become outbreaks
3. Suggest appropriate actions based on resident health data
4. Support proactive, data-driven healthcare delivery
5. Enable early intervention and continuity of care

RECOMMENDATION SCHEDULE CONTEXT:
- Monthly: Short-term monitoring and immediate intervention needs
- Quarterly: Medium-term health trend analysis and program adjustments
- Annual: Long-term community health planning and resource allocation

YOUR RECOMMENDATIONS SHOULD INCLUDE:
1. Priority Level: CRITICAL (needs immediate attention), HIGH (needs urgent follow-up), MEDIUM (routine monitoring), or LOW (minimal intervention)
2. Risk Score: 0-100 based on health risk assessment
3. Action Items: Specific, measurable, time-bound recommendations
4. Warning Signs: Symptoms or conditions to watch for
5. Referral Needed: Whether LGU/specialist referral is required
6. Follow-up Date: Recommended next check-up date

IMPORTANT: Your response MUST be valid JSON with this exact structure:
{
    "priorityLevel": "CRITICAL|HIGH|MEDIUM|LOW",
    "riskScore": 0-100,
    "actionItems": [
        {
            "action": "specific actionable step",
            "urgency": "IMMEDIATE|WITHIN_WEEK|WITHIN_MONTH|PLANNED",
            "type": "HOME_VISIT|LGU_REFERRAL|FOLLOW_UP|MEDICATION|LIFESTYLE|DIET|EXERCISE|VACCINATION|MENTAL_HEALTH|SCREENING|OTHER"
        }
    ],
    "warningSigns": ["warning sign 1", "warning sign 2"],
    "referralNeeded": true/false,
    "followUpDate": "YYYY-MM-DD"
}

Make recommendations practical, personalized, and actionable for a community healthcare setting in the Philippines (Barangay Gumamela).
Consider the barangay context, available resources, and cultural factors.
Provide specific, measurable, and time-bound recommendations.

RESPOND ONLY WITH THE JSON OBJECT, NO OTHER TEXT.`;

        return prompt;
    }

    // ============= HELPER FUNCTIONS =============
    calculateAge(birthDate) {
        if (!birthDate) return 0;
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return Math.max(0, age);
    }

    calculateFollowUpDate(period) {
        const date = new Date();
        switch(period) {
            case 'monthly': date.setMonth(date.getMonth() + 1); break;
            case 'quarterly': date.setMonth(date.getMonth() + 3); break;
            case 'annual': date.setFullYear(date.getFullYear() + 1); break;
            default: date.setMonth(date.getMonth() + 1);
        }
        return date.toISOString().split('T')[0];
    }

    // ============= GET RECOMMENDATIONS =============
    async getResidentRecommendations(residentId, period = null) {
        try {
            let query = supabaseAdmin
                .from('ai_recommendations')
                .select('*')
                .eq('resident_id', residentId)
                .order('generated_at', { ascending: false });

            if (period) {
                query = query.eq('recommendation_type', period);
            }

            const { data, error } = await query;
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error getting recommendations:', error);
            throw error;
        }
    }

    // ============= PUROK LEVEL RECOMMENDATIONS =============
    async getPurokLevelRecommendations(purokId, period) {
        try {
            const { data: residents, error } = await supabaseAdmin
                .from('residents')
                .select(`
                    id,
                    first_name,
                    last_name,
                    birth_date,
                    sex,
                    households!inner(
                        household_number,
                        address_details,
                        puroks!inner(
                            purok_name,
                            risk_level
                        )
                    )
                `)
                .eq('households.purok_id', purokId)
                .eq('is_archived', false);

            if (error) throw error;

            if (!residents || residents.length === 0) {
                return {
                    purokId,
                    purokName: 'Unknown',
                    totalResidents: 0,
                    recommendations: [],
                    message: 'No residents found in this purok'
                };
            }

            const recommendations = [];
            for (const resident of residents) {
                try {
                    const recs = await this.getResidentRecommendations(resident.id, period);
                    if (recs && recs.length > 0) {
                        recommendations.push({
                            resident: {
                                id: resident.id,
                                name: `${resident.first_name} ${resident.last_name}`,
                                age: this.calculateAge(resident.birth_date),
                                sex: resident.sex,
                                household_number: resident.households?.household_number
                            },
                            latestRecommendation: recs[0]
                        });
                    }
                } catch (err) {
                    console.error(`Error getting recommendations for resident ${resident.id}:`, err);
                }
            }

            return {
                purokId,
                purokName: residents[0]?.households?.puroks?.purok_name || 'Unknown',
                purokRiskLevel: residents[0]?.households?.puroks?.risk_level || 'Not assessed',
                totalResidents: residents.length,
                residentsWithRecommendations: recommendations.length,
                recommendations: recommendations
            };
        } catch (error) {
            console.error('Error getting purok recommendations:', error);
            throw error;
        }
    }

    // ============= TREND FORECASTING =============
    async getTrendForecasting() {
        try {
            const { data: residents, error } = await supabaseAdmin
                .from('residents')
                .select(`
                    id,
                    first_name,
                    last_name,
                    birth_date,
                    sex,
                    health_profiles(
                        risk_level,
                        current_risk_score,
                        smoking_status,
                        alcohol_consumption
                    ),
                    chronic_conditions(
                        disease_name,
                        severity,
                        date_diagnosed,
                        status
                    ),
                    vital_signs(
                        systolic_bp,
                        diastolic_bp,
                        heart_rate,
                        blood_sugar,
                        recorded_at
                    )
                `)
                .eq('is_archived', false);

            if (error) throw error;

            const diseaseCounts = {};
            const riskLevels = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
            const ageGroups = {
                '0-17': 0,
                '18-39': 0,
                '40-59': 0,
                '60+': 0
            };
            const bloodPressureTrends = { normal: 0, elevated: 0, high: 0 };
            const diabetesRisk = { low: 0, medium: 0, high: 0 };
            
            let totalResidents = 0;
            let totalChronicConditions = 0;
            let highRiskResidents = 0;

            residents.forEach(resident => {
                totalResidents++;
                
                const age = this.calculateAge(resident.birth_date);
                if (age < 18) ageGroups['0-17']++;
                else if (age < 40) ageGroups['18-39']++;
                else if (age < 60) ageGroups['40-59']++;
                else ageGroups['60+']++;

                if (resident.chronic_conditions) {
                    resident.chronic_conditions.forEach(condition => {
                        if (condition.status === 'Active') {
                            totalChronicConditions++;
                            if (condition.disease_name) {
                                diseaseCounts[condition.disease_name] = 
                                    (diseaseCounts[condition.disease_name] || 0) + 1;
                            }
                        }
                    });
                }

                const riskLevel = resident.health_profiles?.risk_level || 'MEDIUM';
                riskLevels[riskLevel] = (riskLevels[riskLevel] || 0) + 1;
                if (riskLevel === 'HIGH' || riskLevel === 'CRITICAL') {
                    highRiskResidents++;
                }

                if (resident.vital_signs && resident.vital_signs.length > 0) {
                    const latest = resident.vital_signs[0];
                    if (latest.systolic_bp && latest.diastolic_bp) {
                        const systolic = parseInt(latest.systolic_bp);
                        const diastolic = parseInt(latest.diastolic_bp);
                        if (systolic < 120 && diastolic < 80) {
                            bloodPressureTrends.normal++;
                        } else if (systolic < 140 || diastolic < 90) {
                            bloodPressureTrends.elevated++;
                        } else {
                            bloodPressureTrends.high++;
                        }
                    }
                }

                const bloodSugar = resident.vital_signs?.[0]?.blood_sugar;
                if (bloodSugar) {
                    const sugar = parseFloat(bloodSugar);
                    if (sugar < 100) diabetesRisk.low++;
                    else if (sugar < 126) diabetesRisk.medium++;
                    else diabetesRisk.high++;
                }
            });

            const diseasePrevalence = Object.entries(diseaseCounts)
                .map(([disease, count]) => ({
                    disease,
                    count,
                    prevalence: totalResidents > 0 ? ((count / totalResidents) * 100).toFixed(1) : 0
                }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 10);

            const forecast = {
                diseaseTrends: diseasePrevalence.map(dp => ({
                    disease: dp.disease,
                    prevalence: parseFloat(dp.prevalence),
                    trend: dp.prevalence > 20 ? 'INCREASING' : 
                           dp.prevalence > 10 ? 'STABLE' : 'DECLINING',
                    riskLevel: dp.prevalence > 30 ? 'HIGH' :
                              dp.prevalence > 15 ? 'MEDIUM' : 'LOW'
                })),
                demographicTrends: {
                    agingPopulation: totalResidents > 0 ? (ageGroups['60+'] / totalResidents * 100).toFixed(1) : 0,
                    youthPopulation: totalResidents > 0 ? (ageGroups['0-17'] / totalResidents * 100).toFixed(1) : 0,
                    workingAge: totalResidents > 0 ? ((ageGroups['18-39'] + ageGroups['40-59']) / totalResidents * 100).toFixed(1) : 0
                },
                riskFactorTrends: {
                    hypertension: {
                        prevalence: totalResidents > 0 ? ((bloodPressureTrends.high + bloodPressureTrends.elevated) / totalResidents * 100).toFixed(1) : 0,
                        trend: bloodPressureTrends.high > totalResidents * 0.3 ? 'HIGH' : 'MODERATE'
                    },
                    diabetes: {
                        prevalence: totalResidents > 0 ? ((diabetesRisk.high + diabetesRisk.medium) / totalResidents * 100).toFixed(1) : 0,
                        trend: diabetesRisk.high > totalResidents * 0.15 ? 'HIGH' : 'MODERATE'
                    }
                }
            };

            return {
                timestamp: new Date().toISOString(),
                totalResidents,
                totalChronicConditions,
                highRiskResidents,
                highRiskPercentage: totalResidents > 0 ? ((highRiskResidents / totalResidents) * 100).toFixed(1) : 0,
                diseaseCounts,
                diseasePrevalence,
                riskLevels,
                ageGroups,
                bloodPressureTrends,
                diabetesRisk,
                forecast,
                recommendations: [
                    'Increase health screening for high-risk residents',
                    'Implement lifestyle intervention programs',
                    'Strengthen chronic disease management protocols',
                    'Enhance community health education',
                    'Improve access to healthcare services'
                ]
            };
        } catch (error) {
            console.error('Error generating trend forecast:', error);
            throw error;
        }
    }

    // ============= BULK RECOMMENDATIONS =============
    async generateBulkRecommendations(period) {
        try {
            const { data: residents, error } = await supabaseAdmin
                .from('residents')
                .select('id, birth_date, sex, first_name, last_name')
                .eq('is_archived', false)
                .limit(50);

            if (error) throw error;

            const results = {
                total: residents.length,
                successful: 0,
                failed: 0,
                recommendations: [],
                errors: []
            };

            for (const resident of residents) {
                try {
                    const rec = await this.generateRecommendations(resident.id, period);
                    results.recommendations.push({
                        resident: `${resident.first_name} ${resident.last_name}`,
                        recommendation: rec
                    });
                    results.successful++;
                    
                    // Rate limiting to avoid API throttling
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } catch (err) {
                    results.failed++;
                    results.errors.push({
                        resident: `${resident.first_name} ${resident.last_name}`,
                        error: err.message
                    });
                    console.error(`Failed to generate for resident ${resident.id}:`, err);
                }
            }

            return results;
        } catch (error) {
            console.error('Error generating bulk recommendations:', error);
            throw error;
        }
    }

    // ============= SYSTEM-WIDE INSIGHTS =============
    async getSystemWideInsights(period) {
        try {
            const { data: recommendations, error } = await supabaseAdmin
                .from('ai_recommendations')
                .select(`
                    *,
                    residents(
                        first_name,
                        last_name,
                        households!inner(
                            puroks!inner(
                                purok_name,
                                risk_level
                            )
                        )
                    )
                `)
                .eq('recommendation_type', period)
                .order('generated_at', { ascending: false });

            if (error) throw error;

            if (!recommendations || recommendations.length === 0) {
                return {
                    period,
                    totalResidentsAnalyzed: 0,
                    message: 'No recommendations found for this period'
                };
            }

            const insights = {
                period,
                totalResidentsAnalyzed: recommendations.length,
                priorityDistribution: { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 },
                purokDistribution: {},
                riskScoreStats: {
                    average: 0,
                    min: 100,
                    max: 0,
                    total: 0
                },
                referralStats: {
                    total: 0,
                    byPurok: {}
                },
                topActionTypes: {},
                modelUsage: {},
                generatedAt: new Date().toISOString()
            };

            let riskScoreSum = 0;
            let riskScoreCount = 0;

            recommendations.forEach(rec => {
                const priority = rec.priority_level || 'MEDIUM';
                insights.priorityDistribution[priority] = 
                    (insights.priorityDistribution[priority] || 0) + 1;

                const purokName = rec.residents?.households?.puroks?.purok_name || 'Unknown';
                if (!insights.purokDistribution[purokName]) {
                    insights.purokDistribution[purokName] = 0;
                }
                insights.purokDistribution[purokName]++;

                const riskScore = rec.risk_score || 0;
                if (riskScore > 0) {
                    riskScoreSum += riskScore;
                    riskScoreCount++;
                    insights.riskScoreStats.min = Math.min(insights.riskScoreStats.min, riskScore);
                    insights.riskScoreStats.max = Math.max(insights.riskScoreStats.max, riskScore);
                }

                if (rec.referral_needed) {
                    insights.referralStats.total++;
                    if (!insights.referralStats.byPurok[purokName]) {
                        insights.referralStats.byPurok[purokName] = 0;
                    }
                    insights.referralStats.byPurok[purokName]++;
                }

                if (rec.action_items && Array.isArray(rec.action_items)) {
                    rec.action_items.forEach(action => {
                        const type = action.type || 'OTHER';
                        if (!insights.topActionTypes[type]) {
                            insights.topActionTypes[type] = 0;
                        }
                        insights.topActionTypes[type]++;
                    });
                }

                const model = rec.model_used || 'unknown';
                if (!insights.modelUsage[model]) {
                    insights.modelUsage[model] = 0;
                }
                insights.modelUsage[model]++;
            });

            insights.riskScoreStats.average = riskScoreCount > 0 
                ? Math.round(riskScoreSum / riskScoreCount) 
                : 0;

            insights.topPuroks = Object.entries(insights.purokDistribution)
                .map(([name, count]) => ({ purokName: name, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 10);

            insights.topActionTypes = Object.entries(insights.topActionTypes)
                .map(([type, count]) => ({ type, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 10);

            insights.summary = {
                highPriorityNeeded: insights.priorityDistribution.CRITICAL + insights.priorityDistribution.HIGH,
                highPriorityPercentage: recommendations.length > 0 ? ((insights.priorityDistribution.CRITICAL + insights.priorityDistribution.HIGH) / recommendations.length * 100).toFixed(1) : 0,
                referralRate: recommendations.length > 0 ? ((insights.referralStats.total / recommendations.length) * 100).toFixed(1) : 0,
                averageRiskScore: insights.riskScoreStats.average
            };

            return insights;
        } catch (error) {
            console.error('Error getting system-wide insights:', error);
            throw error;
        }
    }

    // ============= RECOMMENDATION STATS =============
    async getRecommendationStats(residentId) {
        try {
            const { data: recommendations, error } = await supabaseAdmin
                .from('ai_recommendations')
                .select('*')
                .eq('resident_id', residentId)
                .order('generated_at', { ascending: false });

            if (error) throw error;

            if (!recommendations || recommendations.length === 0) {
                return {
                    residentId,
                    totalRecommendations: 0,
                    message: 'No recommendations found for this resident'
                };
            }

            const stats = {
                residentId,
                totalRecommendations: recommendations.length,
                byPeriod: {},
                priorityLevels: { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 },
                riskScoreTrend: [],
                referralNeeded: 0,
                latestRecommendation: recommendations[0],
                generatedAt: new Date().toISOString()
            };

            recommendations.forEach(rec => {
                const period = rec.recommendation_type || 'unknown';
                if (!stats.byPeriod[period]) {
                    stats.byPeriod[period] = 0;
                }
                stats.byPeriod[period]++;

                const priority = rec.priority_level || 'MEDIUM';
                stats.priorityLevels[priority] = (stats.priorityLevels[priority] || 0) + 1;

                if (rec.risk_score) {
                    stats.riskScoreTrend.push({
                        date: rec.generated_at,
                        score: rec.risk_score
                    });
                }

                if (rec.referral_needed) {
                    stats.referralNeeded++;
                }
            });

            stats.riskScoreTrend.sort((a, b) => new Date(a.date) - new Date(b.date));

            return stats;
        } catch (error) {
            console.error('Error getting recommendation stats:', error);
            throw error;
        }
    }

    // ============= HEALTH CHECK =============
    async healthCheck() {
        try {
            await this.ensureModel();
            return {
                status: 'healthy',
                model: this.modelName,
                initialized: this.initialized,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                error: error.message,
                model: this.modelName,
                initialized: this.initialized,
                timestamp: new Date().toISOString()
            };
        }
    }
}

module.exports = new AIRecommendationService();