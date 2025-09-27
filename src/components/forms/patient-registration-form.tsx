'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, ChevronRight, ChevronLeft } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { SignaturePad } from './signature-pad';
import { InformedConsentForm } from './informed-consent-form';
import { calculateAge } from '@/lib/utils';
import { ALLERGIES_OPTIONS, BLOOD_TYPE_OPTIONS } from '@/lib/constants';
import { medicalConditionLabels } from '@/types';

interface PatientRegistrationFormProps {
  onSuccess: () => void;
}

export function PatientRegistrationForm({ onSuccess }: PatientRegistrationFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;
  
  const [formData, setFormData] = useState({
    // Personal Information
    first_name: '',
    last_name: '',
    middle_name: '',
    birthdate: '',
    age: 0,
    sex: '',
    nationality: '',
    nickname: '',
    home_no: '',
    office_no: '',
    fax_no: '',
    mobile_no: '',
    email: '',
    address: '',
    occupation: '',
    dental_insurance: '',
    effective_date: '',
    
    // Dental History
    previous_dentist: '',
    last_dental_visit: '',
    
    // Medical History
    physician_name: '',
    specialty: '',
    office_address: '',
    office_number: '',
    is_good_health: true,
    under_medical_treatment: false,
    medical_treatment_details: '',
    illness_operation_details: '',
    hospitalized: false,
    hospitalized_details: '',
    taking_medications: false,
    medications_list: '',
    tobacco_use: false,
    dangerous_drugs_use: false,
    
    // Allergies
    allergic_to: [] as string[],
    
    // Medical Conditions
    high_blood_pressure: false,
    low_blood_pressure: false,
    epilepsy_convulsions: false,
    aids_hiv: false,
    std: false,
    fainting: false,
    rapid_weight_loss: false,
    radiation_therapy: false,
    joint_replacement: false,
    heart_surgery: false,
    heart_attack: false,
    thyroid_problem: false,
    heart_disease: false,
    heart_murmur: false,
    liver_disease: false,
    rheumatic_fever: false,
    hay_fever: false,
    respiratory_problems: false,
    hepatitis_jaundice: false,
    tuberculosis: false,
    swollen_ankles: false,
    kidney_disease: false,
    diabetes: false,
    chest_pain: false,
    stroke: false,
    cancer: false,
    anemia: false,
    angina: false,
    asthma: false,
    emphysema: false,
    bleeding_problems: false,
    blood_diseases: false,
    head_injuries: false,
    arthritis: false,
    other_conditions: '',
    
    // For Women
    is_pregnant: false,
    is_nursing: false,
    taking_birth_control: false,
    
    // Blood Information
    blood_type: '',
    blood_pressure: '',
    
    // Consent
    informed_consent_signed: false,
    consent_signature: '',
  });

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    const supabase = createClient();

    try {
      const { error } = await supabase
        .from('patients')
        .insert([{
          ...formData,
          registration_status: 'pending',
          consent_signed_date: new Date().toISOString(),
        }]);

      if (error) throw error;

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to submit registration');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name *</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name *</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="middle_name">Middle Name</Label>
                <Input
                  id="middle_name"
                  value={formData.middle_name}
                  onChange={(e) => setFormData({ ...formData, middle_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nickname">Nickname</Label>
                <Input
                  id="nickname"
                  value={formData.nickname}
                  onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="birthdate">Birthdate *</Label>
                <Input
                  id="birthdate"
                  type="date"
                  value={formData.birthdate}
                  onChange={(e) => {
                    const age = calculateAge(e.target.value);
                    setFormData({ ...formData, birthdate: e.target.value, age });
                  }}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  value={formData.age}
                  readOnly
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sex">Sex *</Label>
                <RadioGroup
                  value={formData.sex}
                  onValueChange={(value) => setFormData({ ...formData, sex: value })}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="male" id="male" />
                    <Label htmlFor="male">Male</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="female" id="female" />
                    <Label htmlFor="female">Female</Label>
                  </div>
                </RadioGroup>
              </div>
              <div className="space-y-2">
                <Label htmlFor="nationality">Nationality</Label>
                <Input
                  id="nationality"
                  value={formData.nationality}
                  onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mobile_no">Mobile Number *</Label>
                <Input
                  id="mobile_no"
                  value={formData.mobile_no}
                  onChange={(e) => setFormData({ ...formData, mobile_no: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="home_no">Home Phone</Label>
                <Input
                  id="home_no"
                  value={formData.home_no}
                  onChange={(e) => setFormData({ ...formData, home_no: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="office_no">Office Phone</Label>
                <Input
                  id="office_no"
                  value={formData.office_no}
                  onChange={(e) => setFormData({ ...formData, office_no: e.target.value })}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="occupation">Occupation</Label>
                <Input
                  id="occupation"
                  value={formData.occupation}
                  onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dental_insurance">Dental Insurance</Label>
                <Input
                  id="dental_insurance"
                  value={formData.dental_insurance}
                  onChange={(e) => setFormData({ ...formData, dental_insurance: e.target.value })}
                />
              </div>
            </div>
          </div>
        );
        
      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Dental History</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="previous_dentist">Previous Dentist</Label>
                  <Input
                    id="previous_dentist"
                    value={formData.previous_dentist}
                    onChange={(e) => setFormData({ ...formData, previous_dentist: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_dental_visit">Last Dental Visit</Label>
                  <Input
                    id="last_dental_visit"
                    type="date"
                    value={formData.last_dental_visit}
                    onChange={(e) => setFormData({ ...formData, last_dental_visit: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Medical History</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="physician_name">Name of Physician</Label>
                    <Input
                      id="physician_name"
                      value={formData.physician_name}
                      onChange={(e) => setFormData({ ...formData, physician_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="specialty">Specialty</Label>
                    <Input
                      id="specialty"
                      value={formData.specialty}
                      onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="is_good_health"
                      checked={formData.is_good_health}
                      onCheckedChange={(checked) => 
                        setFormData({ ...formData, is_good_health: checked as boolean })
                      }
                    />
                    <Label htmlFor="is_good_health">Are you in good health?</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="under_medical_treatment"
                      checked={formData.under_medical_treatment}
                      onCheckedChange={(checked) => 
                        setFormData({ ...formData, under_medical_treatment: checked as boolean })
                      }
                    />
                    <Label htmlFor="under_medical_treatment">Are you under medical treatment now?</Label>
                  </div>
                  {formData.under_medical_treatment && (
                    <Textarea
                      placeholder="Please specify..."
                      value={formData.medical_treatment_details}
                      onChange={(e) => setFormData({ ...formData, medical_treatment_details: e.target.value })}
                      rows={2}
                    />
                  )}

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="taking_medications"
                      checked={formData.taking_medications}
                      onCheckedChange={(checked) => 
                        setFormData({ ...formData, taking_medications: checked as boolean })
                      }
                    />
                    <Label htmlFor="taking_medications">Are you taking any prescription/non-prescription medication?</Label>
                  </div>
                  {formData.taking_medications && (
                    <Textarea
                      placeholder="Please list medications..."
                      value={formData.medications_list}
                      onChange={(e) => setFormData({ ...formData, medications_list: e.target.value })}
                      rows={2}
                    />
                  )}
                </div>

                <div>
                  <Label className="mb-2 block">Blood Type</Label>
                  <Select
                    value={formData.blood_type}
                    onValueChange={(value) => setFormData({ ...formData, blood_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select blood type" />
                    </SelectTrigger>
                    <SelectContent>
                      {BLOOD_TYPE_OPTIONS.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Medical Conditions</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Please check if you have or had any of the following:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-2">
                {Object.entries(medicalConditionLabels).map(([key, label]) => (
                  <div key={key} className="flex items-center space-x-2">
                    <Checkbox
                      id={key}
                      checked={formData[key as keyof typeof formData] as boolean}
                      onCheckedChange={(checked) => 
                        setFormData({ ...formData, [key]: checked })
                      }
                    />
                    <Label htmlFor={key} className="text-sm">{label}</Label>
                  </div>
                ))}
              </div>
            </div>

            {formData.sex === 'female' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">For Women</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="is_pregnant"
                      checked={formData.is_pregnant}
                      onCheckedChange={(checked) => 
                        setFormData({ ...formData, is_pregnant: checked as boolean })
                      }
                    />
                    <Label htmlFor="is_pregnant">Are you pregnant?</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="is_nursing"
                      checked={formData.is_nursing}
                      onCheckedChange={(checked) => 
                        setFormData({ ...formData, is_nursing: checked as boolean })
                      }
                    />
                    <Label htmlFor="is_nursing">Are you nursing?</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="taking_birth_control"
                      checked={formData.taking_birth_control}
                      onCheckedChange={(checked) => 
                        setFormData({ ...formData, taking_birth_control: checked as boolean })
                      }
                    />
                    <Label htmlFor="taking_birth_control">Are you taking birth control pills?</Label>
                  </div>
                </div>
              </div>
            )}

            <div>
              <h3 className="text-lg font-semibold mb-4">Allergies</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Are you allergic to any of the following?
              </p>
              <div className="grid grid-cols-2 gap-3">
                {ALLERGIES_OPTIONS.map((allergy) => (
                  <div key={allergy} className="flex items-center space-x-2">
                    <Checkbox
                      id={allergy}
                      checked={formData.allergic_to.includes(allergy)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData({ 
                            ...formData, 
                            allergic_to: [...formData.allergic_to, allergy] 
                          });
                        } else {
                          setFormData({ 
                            ...formData, 
                            allergic_to: formData.allergic_to.filter(a => a !== allergy) 
                          });
                        }
                      }}
                    />
                    <Label htmlFor={allergy} className="text-sm">{allergy}</Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <InformedConsentForm />
            <div>
              <Label className="mb-2 block">Digital Signature *</Label>
              <SignaturePad
                onSave={(signature) => {
                  setFormData({ 
                    ...formData, 
                    consent_signature: signature,
                    informed_consent_signed: true 
                  });
                }}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="consent"
                checked={formData.informed_consent_signed}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, informed_consent_signed: checked as boolean })
                }
              />
              <Label htmlFor="consent" className="text-sm">
                I have read and understood the informed consent and agree to the terms *
              </Label>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return 'Personal Information';
      case 2:
        return 'Medical History';
      case 3:
        return 'Medical Conditions';
      case 4:
        return 'Informed Consent';
      default:
        return '';
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.first_name && formData.last_name && formData.birthdate && 
               formData.sex && formData.mobile_no && formData.email;
      case 4:
        return formData.informed_consent_signed && formData.consent_signature;
      default:
        return true;
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>{getStepTitle()}</CardTitle>
        <CardDescription>Step {currentStep} of {totalSteps}</CardDescription>
        <Progress value={(currentStep / totalSteps) * 100} className="mt-2" />
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {renderStep()}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 1 || loading}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>
        {currentStep < totalSteps ? (
          <Button
            onClick={handleNext}
            disabled={!canProceed() || loading}
          >
            Next
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={!canProceed() || loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Registration
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}