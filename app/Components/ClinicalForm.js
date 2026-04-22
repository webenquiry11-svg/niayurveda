'use client';
import { useState, useRef } from 'react';
import { toast } from 'react-hot-toast';

const initialFormState = {
  basicInfo: { researchCaseNo: '', opdNo: '', name: '', ipdNo: '', fatherHusbandName: '', bedNo: '', age: '', sex: '', religion: '', maritalStatus: '', occupation: '', socioEconomicStatus: '', education: '', address: '', phoneNo: '', investigatorName: '', patientConsent: false },
  history: { chiefComplaints: '', presentIllness: { onset: '', duration: '', aggravationAt: '', degradationAt: '' }, treatmentHistory: '', pastMedications: '', recentMedications: '', surgicalHistory: '' },
  personalHistory: { diet: '', dominantRasa: '', dietHabit: '', foodQuantity: '', birthPlace: '', presentHabitat: '', occupationNature: '', agni: '', kostha: '', appetite: '', bowelHabit: '', bladderHabit: '', sleep: '', sleepQuality: '', daytimeSleepDuration: '', previousNightSleep: '', exercise: '', addiction: '', sharira: '', menstrualHistory: { menarcheAge: '', menopauseAge: '', flowDuration: '', flowNature: '', cycleDuration: '', associatedSymptoms: '' }, ongoingMedications: '', familyHistory: '' },
  physicalExamination: { generalAppearance: '', built: '', weight: '', height: '', pallor: '', icterus: '', cyanosis: '', clubbing: '', lymphadenopathy: '', oedema: '', oedemaType: '', oedemaLocation: '', thyroidGland: '', vitals: { bp: '', pulseRate: '', respiratoryRate: '', temp: '' } },
  dashavidhaParikshana: { prakritiSharirik: '', prakritiMansika: '', vikritiDosha: '', saara: '', samahanana: '', pramana: '', satva: '', satmya: '', abhyavaharanaShakti: '', jaranaShakti: '', vyayamaShakti: '' },
  ashtavidhaPariksha: { nadi: '', mala: { matra: '', varna: '', gandha: '', pravritti: '', prakriti: '' }, jihwa: '', shabda: '', sparsha: '', drika: '', akriti: '', mutra: { matra: '', gandha: '', varna: '', pravritt: '' } },
  jivhaPariksha: { color: '', coating: '', coatingTypeColor: '', odor: '', shape: '', moisture: '', texture: '', movement: '', associatedSymptoms: '', imageUrl: '' },
  diagnosis: '',
  diagnosisImageUrl: ''
};

export default function ClinicalForm() {
  const [formData, setFormData] = useState(initialFormState);
  const [activeTab, setActiveTab] = useState('basicInfo');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef(null);

  const tabs = [
    { id: 'basicInfo', label: 'Basic Info' },
    { id: 'history', label: 'Clinical & Past History' },
    { id: 'personalHistory', label: 'Personal History' },
    { id: 'physicalExam', label: 'Physical Exam' },
    { id: 'dashavidha', label: 'Dashavidha Parikshana' },
    { id: 'ashtavidha', label: 'Ashtavidha Pariksha' },
    { id: 'jivha', label: 'Jivha Pariksha & Diagnosis' },
  ];

  const currentTabIndex = tabs.findIndex(t => t.id === activeTab);
  const isLastTab = currentTabIndex === tabs.length - 1;

  const validateCurrentTab = () => {
    // Explicitly check required fields in React state
    if (activeTab === 'basicInfo') {
      const { name, age, sex } = formData.basicInfo;
      if (!name || !age || !sex) {
        toast.error("Please fill all required fields (* Name, Age, Sex) before proceeding.");
        if (formRef.current) formRef.current.reportValidity();
        return false;
      }
    }
    
    // Native HTML5 fallback for any other inputs
    if (formRef.current && !formRef.current.checkValidity()) {
      formRef.current.reportValidity();
      return false;
    }
    return true;
  };

  const handleTabClick = (tabId) => {
    const targetTabIndex = tabs.findIndex(t => t.id === tabId);
    // Prevent moving FORWARD if current tab's required fields are missing
    if (targetTabIndex > currentTabIndex && !validateCurrentTab()) return;
    setActiveTab(tabId);
  };

  const handleNext = (e) => {
    if (e) e.preventDefault();
    if (!validateCurrentTab()) return;
    if (!isLastTab) {
      setActiveTab(tabs[currentTabIndex + 1].id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = (e) => {
    if (e) e.preventDefault();
    if (currentTabIndex > 0) {
      setActiveTab(tabs[currentTabIndex - 1].id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNestedChange = (section, field, value, subField = null) => {
    setFormData((prev) => {
      if (subField) {
        return {
          ...prev,
          [section]: {
            ...prev[section],
            [field]: {
              ...prev[section][field],
              [subField]: value
            }
          }
        };
      }
      if (section) {
        return {
          ...prev,
          [section]: { ...prev[section], [field]: value },
        };
      }
      return { ...prev, [field]: value };
    });
  };

  // Cloudinary Direct Upload Handler
  const handleImageUpload = async (e, section, field, subField = null) => {
    const file = e.target.files[0];
    if (!file) return;

    const loadingToast = toast.loading('Uploading image...');
    const formData = new FormData();
    formData.append('file', file);

    try {
      // Send the file to our secure Next.js backend API instead of directly to Cloudinary
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      if (response.ok && data.secure_url) {
        handleNestedChange(section, field, data.secure_url, subField);
        toast.success('Image uploaded successfully!', { id: loadingToast });
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch (error) {
      toast.error('Failed to upload image.', { id: loadingToast });
    } finally {
      e.target.value = null; // Reset input to allow selecting the same file again if removed
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prevent early submission if the user presses "Enter" on a non-final tab
    if (!isLastTab) {
      handleNext(e);
      return;
    }

    const { name, age, sex } = formData.basicInfo;
    if (!name || !age || !sex) {
      setActiveTab('basicInfo');
      setTimeout(() => {
        toast.error("Please fill all required fields (* Name, Age, Sex).");
        if (formRef.current) formRef.current.reportValidity();
      }, 50);
      return;
    }

    if (formRef.current && !formRef.current.reportValidity()) return;

    setIsSubmitting(true);
    
    // Prepare payload: Format addiction field to an array as expected by the Schema
    const payload = {
      ...formData,
      personalHistory: {
        ...formData.personalHistory,
        addiction: formData.personalHistory.addiction 
          ? formData.personalHistory.addiction.split(',').map(s => s.trim()).filter(Boolean) 
          : []
      }
    };

    try {
      // FIX: Ensure exact casing '/api/Records' matching your directory structure
      const response = await fetch('/api/Records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      const result = await response.json();
      if (response.ok) {
        toast.success('Record Saved Successfully!');
        setFormData(initialFormState);
        setActiveTab('basicInfo');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        if (result.errors) {
          // Display the first specific validation error returned by Mongoose
          const firstError = Object.values(result.errors)[0];
          toast.error(`Validation Error: ${firstError}`);
        } else {
          toast.error(result.message || 'An error occurred while saving.');
        }
      }
    } catch (error) {
      toast.error('Failed to save record. Please check your network connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to safely extract values
  const getValue = (section, field, subField) => {
    if (subField) return formData[section][field][subField];
    if (section) return formData[section][field];
    return formData[field];
  };

  // UI Generators for consistency and clean code
  const renderInput = (label, section, field, type = 'text', placeholder = '', required = false, subField = null) => (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-bold text-slate-700 tracking-wide">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input 
        type={type} 
        required={required}
        value={getValue(section, field, subField)} 
        onChange={(e) => handleNestedChange(section, field, e.target.value, subField)} 
        placeholder={placeholder}
        className="w-full p-3 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors shadow-sm"
      />
    </div>
  );

  const renderSelect = (label, section, field, options, required = false, subField = null) => (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-bold text-slate-700 tracking-wide">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <select 
          required={required}
          value={getValue(section, field, subField)} 
          onChange={(e) => handleNestedChange(section, field, e.target.value, subField)} 
          className="w-full p-3 pr-10 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors shadow-sm appearance-none cursor-pointer"
        >
          <option value="" disabled className="text-slate-400">Select {label}</option>
          {options.map(opt => <option key={opt} value={opt} className="text-slate-900">{opt}</option>)}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );

  const renderTextarea = (label, section, field, placeholder = '') => (
    <div className="flex flex-col gap-1.5 md:col-span-2">
      <label className="text-sm font-bold text-slate-700 tracking-wide">{label}</label>
      <textarea 
        rows="3"
        value={getValue(section, field)} 
        onChange={(e) => handleNestedChange(section, field, e.target.value)} 
        placeholder={placeholder}
        className="w-full p-3 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors shadow-sm resize-y"
      />
    </div>
  );

  const renderImageUpload = (label, section, field, subField = null) => (
    <div className="flex flex-col gap-1.5 md:col-span-2">
      <label className="text-sm font-bold text-slate-700 tracking-wide">{label}</label>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => handleImageUpload(e, section, field, subField)}
        className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors shadow-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
      />
      {getValue(section, field, subField) && (
        <div className="mt-3 relative inline-block w-max">
          <img src={getValue(section, field, subField)} alt="Uploaded preview" className="h-40 w-auto rounded-lg object-cover shadow-sm border border-slate-200" />
          <button type="button" onClick={() => handleNestedChange(section, field, '', subField)} className="absolute -top-3 -right-3 bg-red-100 text-red-600 rounded-full p-1.5 shadow-sm border border-red-200 hover:bg-red-200 transition-colors" title="Remove image">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 w-full">
      <div className="bg-white shadow-xl sm:rounded-2xl border border-slate-200 overflow-hidden">
        
        {/* Header Area */}
        <div className="bg-slate-900 px-6 sm:px-10 py-8 text-white">
          <div className="flex items-center gap-4">
            <div className="h-10 w-3 bg-blue-500 rounded-full"></div>
            <h1 className="text-3xl font-extrabold tracking-tight">Clinical Case Record</h1>
          </div>
          <p className="mt-3 text-slate-300 ml-14">Please fill out the patient's comprehensive details carefully.</p>
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col h-full">
          
          {/* Segmented Tab Navigation */}
          <div className="px-6 sm:px-10 pt-6 pb-2 bg-slate-50 border-b border-slate-200 overflow-x-auto">
            <div className="flex space-x-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabClick(tab.id)}
                  className={`px-5 py-3 rounded-t-lg text-sm font-bold whitespace-nowrap transition-all border-b-2 ${
                    activeTab === tab.id
                      ? 'bg-white text-blue-600 border-blue-600 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]'
                      : 'text-slate-600 border-transparent hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content Panels */}
          <div className="p-6 sm:p-10 bg-white min-h-[450px]">
            
            {/* Basic Info */}
            {activeTab === 'basicInfo' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-8 animate-in fade-in duration-300">
                {renderInput('Research Case No', 'basicInfo', 'researchCaseNo')}
                {renderInput('OPD No', 'basicInfo', 'opdNo')}
                {renderInput('IPD No', 'basicInfo', 'ipdNo')}
                {renderInput('Bed No', 'basicInfo', 'bedNo')}
                {renderInput('Patient Name', 'basicInfo', 'name', 'text', 'Enter full name', true)}
                {renderInput('Father/Husband’s Name', 'basicInfo', 'fatherHusbandName')}
                {renderInput('Age', 'basicInfo', 'age', 'number', 'e.g. 35', true)}
                {renderSelect('Sex', 'basicInfo', 'sex', ['Male', 'Female', 'Other'], true)}
                {renderSelect('Religion', 'basicInfo', 'religion', ['Hindu', 'Jain', 'Muslim', 'Christian', 'Other'])}
                {renderSelect('Marital Status', 'basicInfo', 'maritalStatus', ['Married', 'Unmarried', 'Divorced', 'Widow', 'Widower'])}
                {renderSelect('Occupation', 'basicInfo', 'occupation', ['Service', 'Business', 'Student', 'Farmer', 'Other'])}
                {renderSelect('Socio-Economic Status', 'basicInfo', 'socioEconomicStatus', ['Poor', 'Middle', 'Upper Middle', 'High'])}
                {renderSelect('Education', 'basicInfo', 'education', ['Illiterate', 'Primary', 'Secondary', 'Graduate', 'Post-Graduate'])}
                {renderInput('Phone No', 'basicInfo', 'phoneNo', 'tel', 'Contact number')}
                <div className="md:col-span-2 lg:col-span-3">
                  {renderInput('Address', 'basicInfo', 'address', 'text', 'Full residential address')}
                </div>
                {renderInput('Investigator Sign (Name)', 'basicInfo', 'investigatorName', 'text', 'Enter name')}
                <div className="flex items-center gap-3 mt-4 md:col-span-2 lg:col-span-4 bg-slate-100/50 p-4 rounded-xl border border-slate-200">
                  <input type="checkbox" id="patientConsent" checked={formData.basicInfo.patientConsent} onChange={(e) => handleNestedChange('basicInfo', 'patientConsent', e.target.checked)} className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                  <label htmlFor="patientConsent" className="text-sm font-bold text-slate-700 cursor-pointer select-none">Patient Signature Equivalent (Consent Obtained & Verified)</label>
                </div>
              </div>
            )}

            {/* Clinical History */}
            {activeTab === 'history' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-300">
                <div className="lg:col-span-2">
                  {renderTextarea('Chief Complaints', 'history', 'chiefComplaints', 'Describe primary symptoms and chief complaints...')}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:col-span-2 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                  <div className="md:col-span-2 lg:col-span-4 mb-2"><h3 className="text-lg font-bold text-slate-900">History of Present Illness</h3></div>
                  {renderSelect('Onset', 'history', 'presentIllness', ['Sudden', 'Gradual'], false, 'onset')}
                  {renderInput('Duration', 'history', 'presentIllness', 'text', 'e.g. 5 Days/Months/Years', false, 'duration')}
                  {renderSelect('Aggravation At', 'history', 'presentIllness', ['Summer', 'Winter', 'Rainy', 'None'], false, 'aggravationAt')}
                  {renderSelect('Degradation At', 'history', 'presentIllness', ['Summer', 'Winter', 'Rainy', 'None'], false, 'degradationAt')}
                </div>
                {renderTextarea('Treatment History', 'history', 'treatmentHistory', 'Previous treatments...')}
                {renderTextarea('Surgical History', 'history', 'surgicalHistory', 'Any past surgical procedures...')}
                {renderTextarea('Past Medications', 'history', 'pastMedications', 'Details of past medications...')}
                {renderTextarea('Recent Medications', 'history', 'recentMedications', 'Details of recent medications...')}
              </div>
            )}

            {/* Personal History */}
            {activeTab === 'personalHistory' && (
              <div className="space-y-10 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-8">
                  {renderSelect('Diet', 'personalHistory', 'diet', ['Veg Diet', 'Mixed Diet'])}
                  {renderSelect('Dominant Rasa in Diet', 'personalHistory', 'dominantRasa', ['Madhura (M)', 'Amla (A)', 'Lavana (L)', 'Katu (C/K)', 'Tikta (T)', 'Kashaya (K)'])}
                  {renderSelect('Diet Habit', 'personalHistory', 'dietHabit', ['Samashana', 'Adhyashana', 'Vishamashana'])}
                  {renderSelect('Food Quantity', 'personalHistory', 'foodQuantity', ['Heena', 'Madhya', 'Pravara'])}
                  {renderSelect('Birth Place', 'personalHistory', 'birthPlace', ['Aanoop', 'Jangala', 'Sadharana'])}
                  {renderSelect('Present Habitat', 'personalHistory', 'presentHabitat', ['Rural', 'Urban'])}
                  {renderSelect('Occupation Nature', 'personalHistory', 'occupationNature', ['Active', 'Sedentary'])}
                  {renderSelect('Agni', 'personalHistory', 'agni', ['Sama', 'Vishama', 'Tikshna', 'Manda'])}
                  {renderSelect('Kostha', 'personalHistory', 'kostha', ['Mridu', 'Madhyam', 'Kroora'])}
                  {renderSelect('Appetite', 'personalHistory', 'appetite', ['Good', 'Poor'])}
                  {renderSelect('Bowel Habit', 'personalHistory', 'bowelHabit', ['Regular', 'Irregular'])}
                  {renderSelect('Bladder Habit', 'personalHistory', 'bladderHabit', ['Normal', 'Increased Frequency', 'Decreased Frequency', 'Uncontrolled urination', 'Burning micturition'])}
                  {renderSelect('Sleep', 'personalHistory', 'sleep', ['Samyak', 'Atinidra', 'Alpanidra'])}
                  {renderSelect('Sleep Quality', 'personalHistory', 'sleepQuality', ['Undisturbed', 'Disturbed'])}
                  {renderInput('Daytime Sleep (mins)', 'personalHistory', 'daytimeSleepDuration', 'number')}
                  {renderSelect('Previous Night Sleep', 'personalHistory', 'previousNightSleep', ['Adequate', 'Disturbed'])}
                  {renderSelect('Exercise', 'personalHistory', 'exercise', ['Regular', 'Irregular', 'Occasional'])}
                  {renderSelect('Sharira', 'personalHistory', 'sharira', ['Krisha', 'Madhyama', 'Sthoola'])}
                  
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-bold text-slate-700 tracking-wide">Addictions</label>
                    <input 
                      type="text" 
                      value={formData.personalHistory.addiction} 
                      onChange={(e) => handleNestedChange('personalHistory', 'addiction', e.target.value)}
                      className="w-full p-3 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors shadow-sm"
                      placeholder="e.g. Tea, Coffee, Tobacco, Alcohol, Smoking, None"
                    />
                  </div>
                </div>

                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                  <div className="mb-6 flex items-center gap-3">
                    <h3 className="text-lg font-bold text-slate-900">Menstrual History</h3>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-200 px-2 py-1 rounded-md">If Applicable</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
                    {renderInput('Menarche Age', 'personalHistory', 'menstrualHistory', 'number', 'e.g. 13', false, 'menarcheAge')}
                    {renderInput('Menopause Age', 'personalHistory', 'menstrualHistory', 'number', 'e.g. 50', false, 'menopauseAge')}
                    {renderSelect('Flow Duration', 'personalHistory', 'menstrualHistory', ['heavy', 'moderate', 'scanty', 'normal'], false, 'flowDuration')}
                    {renderInput('Cycle Duration', 'personalHistory', 'menstrualHistory', 'number', 'e.g. 28', false, 'cycleDuration')}
                    {renderSelect('Nature', 'personalHistory', 'menstrualHistory', ['Regular/Painless', 'Regular/Painful', 'Irregular/Painless', 'Irregular/Painful'], false, 'flowNature')}
                    {renderInput('Assoc. Symptoms', 'personalHistory', 'menstrualHistory', 'text', 'e.g. Cramps', false, 'associatedSymptoms')}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {renderTextarea('Ongoing Medications/Supplements', 'personalHistory', 'ongoingMedications')}
                  {renderTextarea('Family History', 'personalHistory', 'familyHistory')}
                </div>
              </div>
            )}

            {/* Physical Examination */}
            {activeTab === 'physicalExam' && (
              <div className="space-y-12 animate-in fade-in duration-300">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-6 border-b border-slate-200 pb-2">General Physical Examination</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
                    {renderSelect('General Appearance', 'physicalExamination', 'generalAppearance', ['ill looking', 'Normal', 'Anxious'])}
                    {renderSelect('Built', 'physicalExamination', 'built', ['Thin', 'Normal', 'Moderate', 'obese'])}
                    {renderInput('Weight (kg)', 'physicalExamination', 'weight', 'number')}
                    {renderInput('Height (cm)', 'physicalExamination', 'height', 'number')}
                    {renderSelect('Pallor', 'physicalExamination', 'pallor', ['Absent', 'Present'])}
                    {renderSelect('Icterus', 'physicalExamination', 'icterus', ['Absent', 'Present'])}
                    {renderSelect('Cyanosis', 'physicalExamination', 'cyanosis', ['Absent', 'Present'])}
                    {renderSelect('Clubbing', 'physicalExamination', 'clubbing', ['Absent', 'Present'])}
                    {renderSelect('Lymphadenopathy', 'physicalExamination', 'lymphadenopathy', ['Absent', 'Present'])}
                    {renderSelect('Oedema', 'physicalExamination', 'oedema', ['Absent', 'Present'])}
                    {renderSelect('Oedema Type', 'physicalExamination', 'oedemaType', ['Pitting', 'Non Pitting'])}
                    {renderSelect('Oedema Location', 'physicalExamination', 'oedemaLocation', ['Generalized', 'Localized'])}
                    {renderSelect('Thyroid Gland', 'physicalExamination', 'thyroidGland', ['Normal', 'Enlarged'])}
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 mb-6 border-b border-slate-200 pb-2">Vitals</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {renderInput('Blood Pressure', 'physicalExamination', 'vitals', 'text', '120/80 mmHg', false, 'bp')}
                    {renderInput('Pulse Rate (bpm)', 'physicalExamination', 'vitals', 'text', '72, Regular', false, 'pulseRate')}
                    {renderInput('Respiratory Rate', 'physicalExamination', 'vitals', 'text', '16 breaths/min', false, 'respiratoryRate')}
                    {renderInput('Temperature', 'physicalExamination', 'vitals', 'text', '98.6 F', false, 'temp')}
                  </div>
                </div>
              </div>
            )}

            {/* Dashavidha Parikshana */}
            {activeTab === 'dashavidha' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8 animate-in fade-in duration-300">
                {renderSelect('Prakriti (Sharirik)', 'dashavidhaParikshana', 'prakritiSharirik', ['Vata (V)', 'Pitta (P)', 'Kapha (K)', 'Vata-Pitta (VP)', 'Vata-Kapha (VK)', 'Pitta-Kapha (PK)', 'Sama (S)'])}
                {renderSelect('Prakriti (Mansika)', 'dashavidhaParikshana', 'prakritiMansika', ['Satva (S)', 'Rajas (R)', 'Tamas (T)'])}
                {renderSelect('Vikriti (Dosha)', 'dashavidhaParikshana', 'vikritiDosha', ['Vata (V)', 'Pitta (P)', 'Kapha (K)'])}
                {renderSelect('Saara', 'dashavidhaParikshana', 'saara', ['Pravara', 'Madhyama', 'Avara'])}
                {renderSelect('Samahanana', 'dashavidhaParikshana', 'samahanana', ['Susamhata', 'Madhyama', 'Heena'])}
                {renderSelect('Pramana', 'dashavidhaParikshana', 'pramana', ['Sama', 'Madhyama', 'Heena'])}
                {renderSelect('Satva', 'dashavidhaParikshana', 'satva', ['Pravara', 'Madhyama', 'Avara'])}
                {renderSelect('Satmya', 'dashavidhaParikshana', 'satmya', ['Pravara', 'Madhyama', 'Avara'])}
                {renderSelect('Abhyavaharana Shakti', 'dashavidhaParikshana', 'abhyavaharanaShakti', ['Pravara', 'Madhyama', 'Avara'])}
                {renderSelect('Jarana Shakti', 'dashavidhaParikshana', 'jaranaShakti', ['Pravara', 'Madhyama', 'Avara'])}
                {renderSelect('Vyayama Shakti', 'dashavidhaParikshana', 'vyayamaShakti', ['Pravara', 'Madhyama', 'Avara'])}
              </div>
            )}

            {/* Ashtavidha Pariksha */}
            {activeTab === 'ashtavidha' && (
              <div className="space-y-12 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {renderSelect('Nadi', 'ashtavidhaPariksha', 'nadi', ['Vata (V)', 'Pitta (P)', 'Kapha (K)', 'Vata-Pitta (VP)', 'Vata-Kapha (VK)', 'Pitta-Kapha (PK)', 'Sama (S)'])}
                  {renderSelect('Jihwa', 'ashtavidhaPariksha', 'jihwa', ['Sama', 'Nirama'])}
                  {renderSelect('Shabda', 'ashtavidhaPariksha', 'shabda', ['Spashta', 'Aspashta', 'Gadgad', 'Sanunasika'])}
                  {renderSelect('Sparsha', 'ashtavidhaPariksha', 'sparsha', ['Sheeta', 'Ushna', 'Anushnasheeta', 'Mrudu', 'Kathina', 'Ruksha', 'Snigdha', 'Khara', 'Slakshana'])}
                  {renderSelect('Drika', 'ashtavidhaPariksha', 'drika', ['Shyavta', 'Panduta', 'Ashrupoorna', 'Dahayukta', 'Sakandu', 'Saamipya', 'Drishti Dosha', 'Doora Drishti Dosha'])}
                  {renderSelect('Akriti', 'ashtavidhaPariksha', 'akriti', ['Krisha', 'Sthool', 'Deergha', 'Hriswa', 'Samopachita', 'Vishamopachita'])}
                </div>

                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Mala Pariksha</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                    {renderSelect('Matra', 'ashtavidhaPariksha', 'mala', ['Alpa', 'Bahula', 'Samanya'], false, 'matra')}
                    {renderSelect('Varna', 'ashtavidhaPariksha', 'mala', ['Samanya', 'Dhoorara', 'Shveta', 'Harita', 'Peeta'], false, 'varna')}
                    {renderSelect('Gandha', 'ashtavidhaPariksha', 'mala', ['Samanya', 'Teevra', 'Alpa'], false, 'gandha')}
                    {renderSelect('Pravritti', 'ashtavidhaPariksha', 'mala', ['Regular', 'Irregular'], false, 'pravritti')}
                    {renderSelect('Prakriti', 'ashtavidhaPariksha', 'mala', ['Saama', 'Nirama'], false, 'prakriti')}
                  </div>
                </div>

                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Mutra Pariksha</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {renderSelect('Matra', 'ashtavidhaPariksha', 'mutra', ['Alpa', 'Bahula', 'Samanya'], false, 'matra')}
                    {renderSelect('Gandha', 'ashtavidhaPariksha', 'mutra', ['Teevra', 'Alpa', 'Samanya'], false, 'gandha')}
                    {renderSelect('Varna', 'ashtavidhaPariksha', 'mutra', ['Peeta', 'Rakta', 'Samanya'], false, 'varna')}
                    {renderSelect('Pravritt', 'ashtavidhaPariksha', 'mutra', ['Samanya', 'Daahyukta', 'Shulayukta'], false, 'pravritt')}
                  </div>
                </div>
              </div>
            )}

            {/* Jivha Pariksha & Diagnosis */}
            {activeTab === 'jivha' && (
              <div className="space-y-12 animate-in fade-in duration-300">

                {/* Jivha Pariksha */}
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-6 border-b border-slate-200 pb-2">Parameters of Jivha Pariksha</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    {renderSelect('Tongue Color', 'jivhaPariksha', 'color', ['Normal (red/light red)', 'Pale', 'Deep red', 'Yellowish', 'Bluish/purple'])}
                    {renderSelect('Tongue Coating', 'jivhaPariksha', 'coating', ['No coating', 'Thin', 'Thick'])}
                    {renderSelect('Coating Type/Color', 'jivhaPariksha', 'coatingTypeColor', ['White', 'Yellow', 'Grey/black'])}
                    {renderSelect('Tongue Odor', 'jivhaPariksha', 'odor', ['No odor', 'Mild', 'Foul smell'])}
                    {renderSelect('Tongue Shape', 'jivhaPariksha', 'shape', ['Normal', 'Swollen', 'Thin', 'Scalloped (teeth mark)', 'Cracked/fissured'])}
                    {renderSelect('Tongue Moisture', 'jivhaPariksha', 'moisture', ['Normal', 'Dry', 'Very dry', 'Excessively moist'])}
                    {renderSelect('Tongue Texture', 'jivhaPariksha', 'texture', ['Smooth', 'Rough', 'Cracked', 'Ulcerated'])}
                    {renderSelect('Tongue Movement', 'jivhaPariksha', 'movement', ['Present', 'Absent'])}
                    {renderSelect('Prasna: Assoc. Symptoms', 'jivhaPariksha', 'associatedSymptoms', ['Burning sensation', 'Pain', 'Dryness', 'Loss of taste', 'Bad taste', 'Others'])}
                  </div>
                  {renderImageUpload('Photographic Presentation (Upload Image)', 'jivhaPariksha', 'imageUrl')}
                </div>
                
                {/* Final Diagnosis */}
                <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100">
                   <h3 className="text-lg font-bold text-slate-900 mb-4">Final Diagnosis</h3>
                   {renderTextarea('Clinical Diagnosis', null, 'diagnosis', 'Enter detailed diagnosis and clinical remarks...')}
                   <div className="mt-6">{renderImageUpload('Attach Diagnosis Image / Report', null, 'diagnosisImageUrl')}</div>
                </div>
              </div>
            )}
          </div>

          {/* Form Footer / Submit Actions */}
          <div className="bg-slate-50 px-6 sm:px-10 py-6 border-t border-slate-200 flex justify-between items-center rounded-b-2xl gap-4">
            {currentTabIndex > 0 && (
              <button
                key="back-btn"
                type="button"
                onClick={handleBack}
                className="flex items-center justify-center px-8 py-3.5 text-base font-bold text-slate-700 transition-all duration-200 bg-slate-200 border border-slate-300 rounded-xl shadow-md hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400"
              >
                &larr; Back
              </button>
            )}
            <div className="ml-auto">
              {!isLastTab ? (
                <button
                  key="next-btn"
                  type="button"
                  onClick={handleNext}
                  className="flex items-center justify-center px-8 py-3.5 text-base font-bold text-white transition-all duration-200 bg-slate-800 border border-transparent rounded-xl shadow-md hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-800"
                >
                  Next Step &rarr;
                </button>
              ) : (
                <button 
                  key="submit-btn"
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center justify-center px-8 py-3.5 text-base font-bold text-white transition-all duration-200 bg-blue-600 border border-transparent rounded-xl shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving Record...
                    </>
                  ) : 'Save Clinical Record'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}