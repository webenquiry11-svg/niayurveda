'use client';

import { useState, useEffect, Fragment } from 'react';
import { toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';

interface PatientRecord {
  _id: string;
  basicInfo?: {
    researchCaseNo?: string;
    opdNo?: string;
    name?: string;
    ipdNo?: string;
    fatherHusbandName?: string;
    bedNo?: string;
    age?: number;
    sex?: string;
    religion?: string;
    maritalStatus?: string;
    occupation?: string;
    socioEconomicStatus?: string;
    education?: string;
    address?: string;
    phoneNo?: string;
    investigatorName?: string;
    patientConsent?: boolean;
  };
  history?: {
    chiefComplaints?: string;
    presentIllness?: {
      onset?: string;
      duration?: string;
      aggravationAt?: string;
      degradationAt?: string;
    };
    treatmentHistory?: string;
    pastMedications?: string;
    recentMedications?: string;
    surgicalHistory?: string;
  };
  personalHistory?: {
    diet?: string;
    dominantRasa?: string;
    dietHabit?: string;
    foodQuantity?: string;
    birthPlace?: string;
    presentHabitat?: string;
    occupationNature?: string;
    agni?: string;
    kostha?: string;
    appetite?: string;
    bowelHabit?: string;
    bladderHabit?: string[];
    sleep?: string;
    sleepQuality?: string;
    daytimeSleepDuration?: string;
    previousNightSleep?: string;
    exercise?: string;
    addiction?: string[];
    sharira?: string;
    menstrualHistory?: {
      menarcheAge?: number;
      menopauseAge?: number;
      flowDuration?: string;
      flowNature?: string;
      cycleDuration?: number;
      associatedSymptoms?: string;
    };
    familyHistory?: string;
  };
  physicalExamination?: {
    generalAppearance?: string;
    built?: string;
    weight?: number;
    height?: number;
    pallor?: string;
    icterus?: string;
    cyanosis?: string;
    clubbing?: string;
    lymphadenopathy?: string;
    oedema?: string;
    oedemaType?: string;
    oedemaLocation?: string;
    thyroidGland?: string;
    vitals?: {
      bp?: string;
      pulseRate?: string;
      respiratoryRate?: string;
      temp?: string;
    };
  };
  dashavidhaParikshana?: {
    prakritiSharirik?: string;
    prakritiMansika?: string;
    vikritiDosha?: string;
    saara?: string;
    samahanana?: string;
    pramana?: string;
    satva?: string;
    satmya?: string;
    abhyavaharanaShakti?: string;
    jaranaShakti?: string;
    vyayamaShakti?: string;
  };
  ashtavidhaPariksha?: {
    nadi?: string;
    mala?: { matra?: string; varna?: string; gandha?: string; pravritti?: string; prakriti?: string };
    jihwa?: string;
    shabda?: string;
    sparsha?: string;
    drika?: string;
    akriti?: string;
    mutra?: { matra?: string; gandha?: string; varna?: string; pravritt?: string };
  };
  jivhaPariksha?: {
    color?: string;
    coating?: string;
    coatingTypeColor?: string;
    odor?: string;
    shape?: string;
    moisture?: string;
    texture?: string;
    movement?: string;
    associatedSymptoms?: string[];
    imageUrl?: string;
  };
  diagnosis?: string;
  createdAt: string;
  updatedAt: string;
}

function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [records, setRecords] = useState<PatientRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const res = await fetch('/api/Records');
        const data = await res.json();
        if (data.success) setRecords(data.data);
      } catch (error) {
        toast.error('Failed to fetch records');
      } finally {
        setLoading(false);
      }
    };
    fetchRecords();
  }, []);

  const filteredRecords = records.filter(record =>
    record.basicInfo?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.basicInfo?.phoneNo?.includes(searchTerm) ||
    record.basicInfo?.opdNo?.includes(searchTerm)
  );

  const stats = {
    total: records.length,
    thisMonth: records.filter(r => {
      const date = new Date(r.createdAt);
      const now = new Date();
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length,
  };

  // Helper function to safely get nested values and format them
  const getNestedValue = (obj: any, path: string, type = 'string') => {
    const value = path.split('.').reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined), obj);
    if (value === undefined || value === null || value === '') {
      return 'N/A';
    }
    if (Array.isArray(value)) {
      return value.length > 0 ? value.join(', ') : 'N/A';
    }
    if (type === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    // For dates, return a Date object so XLSX can format it
    if (type === 'date') {
      try {
        const date = new Date(value);
        // Check if it's a valid date before returning
        return isNaN(date.getTime()) ? 'N/A' : date;
      } catch (e) {
        return 'N/A';
      }
    }
    return value;
  };

  const handleDownloadExcel = () => {
    if (records.length === 0) {
      toast.error('No records to download');
      return;
    }

    const loadingToast = toast.loading('Generating Professional Report...');

    try {
      // --- 1. DEFINE ALL REPORT FIELDS AND THEIR PROPERTIES ---
      // This comprehensive list ensures every field from the schema is included,
      // defines their display header, the path to their data, and their column width.
      const allReportFields = [
        // Basic Info
        { header: 'Record ID', key: '_id', width: 24, type: 'string' },
        { header: 'Research Case No', key: 'basicInfo.researchCaseNo', width: 20, type: 'string' },
        { header: 'OPD No', key: 'basicInfo.opdNo', width: 15, type: 'string' },
        { header: 'IPD No', key: 'basicInfo.ipdNo', width: 15, type: 'string' },
        { header: 'Bed No', key: 'basicInfo.bedNo', width: 10, type: 'string' },
        { header: 'Patient Name', key: 'basicInfo.name', width: 30, type: 'string' },
        { header: 'Father/Husband Name', key: 'basicInfo.fatherHusbandName', width: 30, type: 'string' },
        { header: 'Age', key: 'basicInfo.age', width: 8, type: 'number' },
        { header: 'Sex', key: 'basicInfo.sex', width: 10, type: 'string' },
        { header: 'Religion', key: 'basicInfo.religion', width: 15, type: 'string' },
        { header: 'Marital Status', key: 'basicInfo.maritalStatus', width: 15, type: 'string' },
        { header: 'Occupation', key: 'basicInfo.occupation', width: 20, type: 'string' },
        { header: 'Socio-Economic Status', key: 'basicInfo.socioEconomicStatus', width: 25, type: 'string' },
        { header: 'Education', key: 'basicInfo.education', width: 20, type: 'string' },
        { header: 'Phone No', key: 'basicInfo.phoneNo', width: 20, type: 'string' },
        { header: 'Address', key: 'basicInfo.address', width: 45, type: 'string' },
        { header: 'Investigator Name', key: 'basicInfo.investigatorName', width: 30, type: 'string' },
        { header: 'Patient Consent', key: 'basicInfo.patientConsent', width: 15, type: 'boolean' },

        // History
        { header: 'Chief Complaints', key: 'history.chiefComplaints', width: 50, type: 'string' },
        { header: 'Illness Onset', key: 'history.presentIllness.onset', width: 15, type: 'string' },
        { header: 'Illness Duration', key: 'history.presentIllness.duration', width: 20, type: 'string' },
        { header: 'Illness Aggravation At', key: 'history.presentIllness.aggravationAt', width: 25, type: 'string' },
        { header: 'Illness Degradation At', key: 'history.presentIllness.degradationAt', width: 25, type: 'string' },
        { header: 'Treatment History', key: 'history.treatmentHistory', width: 40, type: 'string' },
        { header: 'Past Medications', key: 'history.pastMedications', width: 40, type: 'string' },
        { header: 'Recent Medications', key: 'history.recentMedications', width: 40, type: 'string' },
        { header: 'Surgical History', key: 'history.surgicalHistory', width: 40, type: 'string' },

        // Personal History
        { header: 'Diet', key: 'personalHistory.diet', width: 15, type: 'string' },
        { header: 'Dominant Rasa', key: 'personalHistory.dominantRasa', width: 20, type: 'string' },
        { header: 'Diet Habit', key: 'personalHistory.dietHabit', width: 15, type: 'string' },
        { header: 'Food Quantity', key: 'personalHistory.foodQuantity', width: 15, type: 'string' },
        { header: 'Birth Place', key: 'personalHistory.birthPlace', width: 15, type: 'string' },
        { header: 'Present Habitat', key: 'personalHistory.presentHabitat', width: 15, type: 'string' },
        { header: 'Occupation Nature', key: 'personalHistory.occupationNature', width: 20, type: 'string' },
        { header: 'Agni', key: 'personalHistory.agni', width: 10, type: 'string' },
        { header: 'Kostha', key: 'personalHistory.kostha', width: 10, type: 'string' },
        { header: 'Appetite', key: 'personalHistory.appetite', width: 15, type: 'string' },
        { header: 'Bowel Habit', key: 'personalHistory.bowelHabit', width: 20, type: 'string' },
        { header: 'Bladder Habit', key: 'personalHistory.bladderHabit', width: 30, type: 'array' },
        { header: 'Sleep', key: 'personalHistory.sleep', width: 15, type: 'string' },
        { header: 'Sleep Quality', key: 'personalHistory.sleepQuality', width: 20, type: 'string' },
        { header: 'Daytime Sleep Duration (mins)', key: 'personalHistory.daytimeSleepDuration', width: 25, type: 'number' },
        { header: 'Previous Night Sleep', key: 'personalHistory.previousNightSleep', width: 25, type: 'string' },
        { header: 'Exercise', key: 'personalHistory.exercise', width: 15, type: 'string' },
        { header: 'Addiction', key: 'personalHistory.addiction', width: 30, type: 'array' },
        { header: 'Sharira', key: 'personalHistory.sharira', width: 15, type: 'string' },
        { header: 'Menarche Age', key: 'personalHistory.menstrualHistory.menarcheAge', width: 15, type: 'number' },
        { header: 'Menopause Age', key: 'personalHistory.menstrualHistory.menopauseAge', width: 18, type: 'number' },
        { header: 'Flow Duration', key: 'personalHistory.menstrualHistory.flowDuration', width: 20, type: 'string' },
        { header: 'Flow Nature', key: 'personalHistory.menstrualHistory.flowNature', width: 25, type: 'string' },
        { header: 'Cycle Duration', key: 'personalHistory.menstrualHistory.cycleDuration', width: 20, type: 'number' },
        { header: 'Menstrual Assoc. Symptoms', key: 'personalHistory.menstrualHistory.associatedSymptoms', width: 30, type: 'string' },
        { header: 'Family History', key: 'personalHistory.familyHistory', width: 40, type: 'string' },

        // Physical Examination
        { header: 'General Appearance', key: 'physicalExamination.generalAppearance', width: 25, type: 'string' },
        { header: 'Built', key: 'physicalExamination.built', width: 15, type: 'string' },
        { header: 'Weight (kg)', key: 'physicalExamination.weight', width: 15, type: 'number' },
        { header: 'Height (cm)', key: 'physicalExamination.height', width: 15, type: 'number' },
        { header: 'Pallor', key: 'physicalExamination.pallor', width: 10, type: 'string' },
        { header: 'Icterus', key: 'physicalExamination.icterus', width: 10, type: 'string' },
        { header: 'Cyanosis', key: 'physicalExamination.cyanosis', width: 10, type: 'string' },
        { header: 'Clubbing', key: 'physicalExamination.clubbing', width: 10, type: 'string' },
        { header: 'Lymphadenopathy', key: 'physicalExamination.lymphadenopathy', width: 20, type: 'string' },
        { header: 'Oedema', key: 'physicalExamination.oedema', width: 10, type: 'string' },
        { header: 'Oedema Type', key: 'physicalExamination.oedemaType', width: 15, type: 'string' },
        { header: 'Oedema Location', key: 'physicalExamination.oedemaLocation', width: 20, type: 'string' },
        { header: 'Thyroid Gland', key: 'physicalExamination.thyroidGland', width: 20, type: 'string' },
        { header: 'BP', key: 'physicalExamination.vitals.bp', width: 15, type: 'string' },
        { header: 'Pulse Rate', key: 'physicalExamination.vitals.pulseRate', width: 20, type: 'string' },
        { header: 'Respiratory Rate', key: 'physicalExamination.vitals.respiratoryRate', width: 25, type: 'string' },
        { header: 'Temperature', key: 'physicalExamination.vitals.temp', width: 15, type: 'string' },

        // Dashavidha Parikshana
        { header: 'Prakriti (Sharirik)', key: 'dashavidhaParikshana.prakritiSharirik', width: 25, type: 'string' },
        { header: 'Prakriti (Mansika)', key: 'dashavidhaParikshana.prakritiMansika', width: 25, type: 'string' },
        { header: 'Vikriti (Dosha)', key: 'dashavidhaParikshana.vikritiDosha', width: 20, type: 'string' },
        { header: 'Saara', key: 'dashavidhaParikshana.saara', width: 15, type: 'string' },
        { header: 'Samahanana', key: 'dashavidhaParikshana.samahanana', width: 20, type: 'string' },
        { header: 'Pramana', key: 'dashavidhaParikshana.pramana', width: 15, type: 'string' },
        { header: 'Satva', key: 'dashavidhaParikshana.satva', width: 15, type: 'string' },
        { header: 'Satmya', key: 'dashavidhaParikshana.satmya', width: 15, type: 'string' },
        { header: 'Abhyavaharana Shakti', key: 'dashavidhaParikshana.abhyavaharanaShakti', width: 25, type: 'string' },
        { header: 'Jarana Shakti', key: 'dashavidhaParikshana.jaranaShakti', width: 20, type: 'string' },
        { header: 'Vyayama Shakti', key: 'dashavidhaParikshana.vyayamaShakti', width: 20, type: 'string' },

        // Ashtavidha Pariksha
        { header: 'Nadi', key: 'ashtavidhaPariksha.nadi', width: 20, type: 'string' },
        { header: 'Mala Matra', key: 'ashtavidhaPariksha.mala.matra', width: 15, type: 'string' },
        { header: 'Mala Varna', key: 'ashtavidhaPariksha.mala.varna', width: 15, type: 'string' },
        { header: 'Mala Gandha', key: 'ashtavidhaPariksha.mala.gandha', width: 15, type: 'string' },
        { header: 'Mala Pravritti', key: 'ashtavidhaPariksha.mala.pravritti', width: 15, type: 'string' },
        { header: 'Mala Prakriti', key: 'ashtavidhaPariksha.mala.prakriti', width: 15, type: 'string' },
        { header: 'Jihwa (Ashtavidha)', key: 'ashtavidhaPariksha.jihwa', width: 20, type: 'string' },
        { header: 'Shabda', key: 'ashtavidhaPariksha.shabda', width: 20, type: 'string' },
        { header: 'Sparsha', key: 'ashtavidhaPariksha.sparsha', width: 25, type: 'string' },
        { header: 'Drika', key: 'ashtavidhaPariksha.drika', width: 30, type: 'string' },
        { header: 'Akriti', key: 'ashtavidhaPariksha.akriti', width: 25, type: 'string' },
        { header: 'Mutra Matra', key: 'ashtavidhaPariksha.mutra.matra', width: 15, type: 'string' },
        { header: 'Mutra Gandha', key: 'ashtavidhaPariksha.mutra.gandha', width: 15, type: 'string' },
        { header: 'Mutra Varna', key: 'ashtavidhaPariksha.mutra.varna', width: 15, type: 'string' },
        { header: 'Mutra Pravritt', key: 'ashtavidhaPariksha.mutra.pravritt', width: 20, type: 'string' },

        // Jivha Pariksha & Diagnosis
        { header: 'Tongue Color', key: 'jivhaPariksha.color', width: 25, type: 'string' },
        { header: 'Tongue Coating', key: 'jivhaPariksha.coating', width: 20, type: 'string' },
        { header: 'Tongue Coating Type/Color', key: 'jivhaPariksha.coatingTypeColor', width: 25, type: 'string' },
        { header: 'Tongue Odor', key: 'jivhaPariksha.odor', width: 15, type: 'string' },
        { header: 'Tongue Shape', key: 'jivhaPariksha.shape', width: 25, type: 'string' },
        { header: 'Tongue Moisture', key: 'jivhaPariksha.moisture', width: 20, type: 'string' },
        { header: 'Tongue Texture', key: 'jivhaPariksha.texture', width: 20, type: 'string' },
        { header: 'Tongue Movement', key: 'jivhaPariksha.movement', width: 20, type: 'string' },
        { header: 'Jivha Assoc. Symptoms', key: 'jivhaPariksha.associatedSymptoms', width: 40, type: 'array' },
        { header: 'Jivha Image URL', key: 'jivhaPariksha.imageUrl', width: 50, type: 'string' },
        { header: 'Diagnosis', key: 'diagnosis', width: 50, type: 'string' },

        // Timestamps
        { header: 'Created At', key: 'createdAt', width: 20, type: 'date' },
        { header: 'Updated At', key: 'updatedAt', width: 20, type: 'date' },
      ];

      // --- 2. FLATTEN RECORDS & APPLY DATA FORMATTING ---
      // This maps each record to a flat object where keys are the desired Excel headers,
      // and values are formatted according to the rules (N/A, Yes/No, Date objects).
      const exportData = records.map(record => {
        const row: { [key: string]: any } = {};
        allReportFields.forEach(field => {
          row[field.header] = getNestedValue(record, field.key, field.type);
        });
        return row;
      });

      // --- 3. CONSTRUCT REPORT HEADER ---
      const now = new Date();
      const reportGeneratedTime = now.toLocaleString();
      const generatedBy = "Admin"; // Assuming 'Admin' as per request, or can be dynamic if user info is available

      const reportHeader = [
        // Main Title
        ["CLINICAL CASE REPORT"],
        [], // Spacer row
        // Subtitle
        ["Ni Ayurveda"],
        ["Clinical Case Management System"],
        [], // Spacer row
        // Metadata
        [`Report Generated: ${reportGeneratedTime}`],
        [`Total Records: ${records.length}`],
        [`Generated By: ${generatedBy}`],
        [], // Spacer row before table
      ];

      // --- 4. CREATE WORKSHEET ---
      // Create a new worksheet and add the report header first.
      const ws = XLSX.utils.aoa_to_sheet(reportHeader);

      // --- 5. ADD TABLE HEADERS AND DATA ---
      // Get the table headers from our defined fields
      const tableHeaders = allReportFields.map(field => field.header);
      // Determine where the table starts (after report header + spacers)
      const tableStartRow = reportHeader.length; // 0-indexed, so this is the row number

      // Add the table headers and data to the worksheet
      XLSX.utils.sheet_add_json(ws, exportData, {
        header: tableHeaders,
        origin: `A${tableStartRow + 1}`, // +1 because SheetJS is 1-indexed for origin
        skipHeader: false,
      });

      // --- 6. APPLY STYLING AND FORMATTING (SheetJS Community Edition Limitations) ---
      // NOTE: The community version of SheetJS (xlsx) does NOT support rich cell styling
      // like cell colors, fonts, borders, or alignment directly via the `s` property.
      // For these features, you would need SheetJS Pro or a different library like 'exceljs'.
      // We will implement what is possible: column widths, row heights, merges, and data formats.

      // --- Column Widths ---
      // Apply custom column widths based on the allReportFields definition
      ws['!cols'] = allReportFields.map(field => ({ wch: field.width }));

      // --- Row Heights ---
      // Set specific row heights for the header and table header
      ws['!rows'] = [
        { hpt: 30 }, // Row 1: Main Title
        undefined,   // Row 2: Spacer
        { hpt: 18 }, // Row 3: Subtitle 1
        { hpt: 18 }, // Row 4: Subtitle 2
        undefined,   // Row 5: Spacer
        { hpt: 15 }, // Row 6: Generated Date
        { hpt: 15 }, // Row 7: Total Records
        { hpt: 15 }, // Row 8: Generated By
        undefined,   // Row 9: Spacer before table
        { hpt: 24 }, // Row 10: Table Header (adjust this if tableStartRow changes)
      ];

      // --- Cell Merges ---
      // Merge cells for the report header and footer to center text
      const merges = [
        // Report Title (A1 to last column of table)
        { s: { r: 0, c: 0 }, e: { r: 0, c: allReportFields.length - 1 } },
        // Subtitle 1 (A3 to last column of table)
        { s: { r: 2, c: 0 }, e: { r: 2, c: allReportFields.length - 1 } },
        // Subtitle 2 (A4 to last column of table)
        { s: { r: 3, c: 0 }, e: { r: 3, c: allReportFields.length - 1 } },
        // Footer (calculate row numbers dynamically)
        { s: { r: tableStartRow + exportData.length + 2, c: 0 }, e: { r: tableStartRow + exportData.length + 2, c: allReportFields.length - 1 } }, // "--- End of Report ---"
        { s: { r: tableStartRow + exportData.length + 3, c: 0 }, e: { r: tableStartRow + exportData.length + 3, c: allReportFields.length - 1 } }, // "Generated by..."
      ];
      ws['!merges'] = merges;

      // --- Data Formatting (Dates) ---
      // Loop through all cells in the date columns and apply the 'dd-mmm-yyyy' format
      allReportFields.forEach((field, colIndex) => {
        if (field.type === 'date') {
          const range = XLSX.utils.decode_range(ws['!ref']);
          // Iterate through rows starting from the first data row (tableStartRow + 1)
          for (let R = tableStartRow + 1; R <= range.e.r; ++R) {
            const cell_address = { c: colIndex, r: R };
            const cell_ref = XLSX.utils.encode_cell(cell_address);
            if (ws[cell_ref] && ws[cell_ref].v instanceof Date) {
              ws[cell_ref].t = 'd'; // Set cell type to Date
              ws[cell_ref].z = 'dd-mmm-yyyy'; // Set the number format
            }
          }
        }
      });

      // --- 7. FEATURES (Freeze Panes & AutoFilter) ---
      // Freeze the table header row (which is `tableStartRow` + 1 in 1-indexed Excel)
      ws['!freeze'] = { ySplit: tableStartRow + 1 };

      // Enable AutoFilter on the table header range
      const tableHeaderRange = `A${tableStartRow + 1}:${XLSX.utils.encode_col(allReportFields.length - 1)}${tableStartRow + 1}`;
      ws['!autofilter'] = { ref: tableHeaderRange };

      // --- 8. REPORT FOOTER ---
      // Add footer content below the table data
      const footerStartRow = tableStartRow + exportData.length + 2; // +2 for spacer rows
      XLSX.utils.sheet_add_aoa(ws, [
        ["--- End of Report ---"],
        ["Generated by Ni Ayurveda Clinical Case Management System"]
      ], { origin: `A${footerStartRow + 1}` });

      // --- 9. PRINT SETTINGS ---
      // Set page layout for printing
      ws['!pageSetup'] = {
        orientation: 'landscape', // Landscape Page Layout
        paper: 9, // A4 paper size (9 is A4)
        horizontalCentered: true, // Center Page Horizontally
        fitToPage: true, // Fit all columns on one page width
        fitToHeight: 0, // No height limit
        printArea: `A1:${XLSX.utils.encode_col(allReportFields.length - 1)}${footerStartRow + 2}` // Set Print Area
      };

      // Set print titles to repeat the table header (Row `tableStartRow + 1`) on every printed page
      // This requires modifying the workbook's Names property
      const wsName = 'Clinical Records';
      
      // --- 10. FINALIZE WORKBOOK AND DOWNLOAD ---
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, ws, wsName);

      // Add print titles to repeat the table header on every printed page
      if (!workbook.Workbook) workbook.Workbook = {};
      if (!workbook.Workbook.Names) workbook.Workbook.Names = [];
      workbook.Workbook.Names.push({
        Name: 'Print_Titles',
        Sheet: 0, // 0-indexed sheet number for the first sheet
        Ref: `${wsName}!$${tableStartRow + 1}:$${tableStartRow + 1}` // Repeat the table header row
      });

      // Generate professional filename with timestamp
      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `Clinical_Report_${timestamp}.xlsx`;

      // Trigger the download
      XLSX.writeFile(workbook, filename);
      toast.success('Professional report generated successfully!', { id: loadingToast });
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to generate report. Please try again.', { id: loadingToast });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-2 sm:p-4 md:p-8 font-sans">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
          <div className="w-full sm:w-auto">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white mb-1">Clinical Records Dashboard</h1>
            <p className="text-blue-200 text-xs sm:text-sm">Manage and view all patient clinical records</p>
          </div>
          <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
            <button onClick={handleDownloadExcel} className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 text-white px-3 sm:px-6 py-2 sm:py-3 rounded-lg font-bold text-xs sm:text-sm transition-colors shadow-lg flex items-center justify-center gap-1 sm:gap-2">📥 <span className="hidden sm:inline">Download Excel</span><span className="sm:hidden">Excel</span></button>
            <button onClick={onLogout} className="flex-1 sm:flex-none bg-red-600 hover:bg-red-700 text-white px-3 sm:px-6 py-2 sm:py-3 rounded-lg font-bold text-xs sm:text-sm transition-colors shadow-lg">Logout</button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 mb-6 sm:mb-8">
          <div className="bg-linear-to-br from-blue-600 to-blue-700 rounded-xl shadow-md border border-blue-500 p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-xs sm:text-sm font-medium">Total Records</p>
                <p className="text-2xl sm:text-3xl font-bold text-white mt-1 sm:mt-2">{stats.total}</p>
              </div>
              <div className="bg-blue-500 p-2 sm:p-4 rounded-lg"><span className="text-xl sm:text-2xl">📋</span></div>
            </div>
          </div>

          <div className="bg-linear-to-br from-green-600 to-green-700 rounded-xl shadow-md border border-green-500 p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-xs sm:text-sm font-medium">This Month</p>
                <p className="text-2xl sm:text-3xl font-bold text-white mt-1 sm:mt-2">{stats.thisMonth}</p>
              </div>
              <div className="bg-green-500 p-2 sm:p-4 rounded-lg"><span className="text-xl sm:text-2xl">📅</span></div>
            </div>
          </div>

          <div className="bg-linear-to-br from-orange-600 to-orange-700 rounded-xl shadow-md border border-orange-500 p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-xs sm:text-sm font-medium">Pending Review</p>
                <p className="text-2xl sm:text-3xl font-bold text-white mt-1 sm:mt-2">{records.filter(r => !r.diagnosis).length}</p>
              </div>
              <div className="bg-orange-500 p-2 sm:p-4 rounded-lg"><span className="text-xl sm:text-2xl">⏳</span></div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-slate-800 rounded-xl shadow-md border border-slate-700 p-3 sm:p-4 mb-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-slate-400 text-lg sm:text-xl">🔍</span>
            <input
              type="text"
              placeholder="Search patient..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 sm:p-3 border border-slate-600 bg-slate-700 text-white placeholder:text-slate-400 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-colors text-sm sm:text-base"
            />
          </div>
        </div>
      </div>

      {/* Records Table/Cards */}
      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="bg-slate-800 rounded-xl shadow-lg p-16 text-center">
            <p className="text-slate-300 font-bold text-lg">Loading records...</p>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="bg-slate-800 rounded-xl shadow-lg p-16 text-center">
            <p className="text-slate-300 font-bold text-lg">No clinical records found.</p>
          </div>
        ) : (
          <div className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 overflow-hidden">
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                    <th className="p-3 sm:p-4 lg:p-5 text-left font-bold text-xs sm:text-sm">Patient Name</th>
                    <th className="p-3 sm:p-4 lg:p-5 text-left font-bold text-xs sm:text-sm">Age / Sex</th>
                    <th className="p-3 sm:p-4 lg:p-5 text-left font-bold text-xs sm:text-sm">Contact</th>
                    <th className="p-3 sm:p-4 lg:p-5 text-left font-bold text-xs sm:text-sm">OPD / IPD</th>
                    <th className="p-3 sm:p-4 lg:p-5 text-left font-bold text-xs sm:text-sm">Chief Complaint</th>
                    <th className="p-3 sm:p-4 lg:p-5 text-left font-bold text-xs sm:text-sm">Submitted</th>
                    <th className="p-3 sm:p-4 lg:p-5 text-left font-bold text-xs sm:text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {filteredRecords.map((record) => (
                    <Fragment key={record._id}>
                      <tr className="hover:bg-slate-700 transition-colors cursor-pointer border-b">
                        <td className="p-3 sm:p-4 lg:p-5">
                          <div className="font-bold text-white text-xs sm:text-sm">{record.basicInfo?.name}</div>
                          <div className="text-xs text-slate-400 mt-1">{record.basicInfo?.fatherHusbandName ? `S/O: ${record.basicInfo.fatherHusbandName}` : ''}</div>
                        </td>
                        <td className="p-3 sm:p-4 lg:p-5">
                          <span className="bg-blue-600 text-blue-100 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium">{record.basicInfo?.age} y, {record.basicInfo?.sex}</span>
                        </td>
                        <td className="p-3 sm:p-4 lg:p-5 text-slate-300 text-xs sm:text-sm">{record.basicInfo?.phoneNo || 'N/A'}</td>
                        <td className="p-3 sm:p-4 lg:p-5">
                          <div className="text-xs sm:text-sm">
                            {record.basicInfo?.opdNo && <div className="text-white font-medium">OPD: {record.basicInfo.opdNo}</div>}
                            {record.basicInfo?.ipdNo && <div className="text-white font-medium">IPD: {record.basicInfo.ipdNo}</div>}
                          </div>
                        </td>
                        <td className="p-3 sm:p-4 lg:p-5 text-slate-300 max-w-xs truncate text-xs sm:text-sm">{record.history?.chiefComplaints || 'N/A'}</td>
                        <td className="p-3 sm:p-4 lg:p-5 text-slate-300 text-xs sm:text-sm">{new Date(record.createdAt).toLocaleDateString()}</td>
                        <td className="p-3 sm:p-4 lg:p-5">
                          <button
                            onClick={() => setExpandedId(expandedId === record._id ? null : record._id)}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-2 sm:px-4 py-1 sm:py-2 rounded-lg text-xs sm:text-sm font-bold transition-colors"
                          >
                            {expandedId === record._id ? 'Hide' : 'View'}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Row */}
                      {expandedId === record._id && (
                        <tr className="bg-slate-750 border-b hidden md:table-row">
                          <td colSpan={7} className="p-4 lg:p-6">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                              {/* Basic Info Section */}
                              <div className="bg-slate-700 rounded-lg p-3 lg:p-4 border border-slate-600">
                                <h3 className="font-bold text-white mb-3 text-base lg:text-lg">👤 Basic Information</h3>
                                <div className="space-y-2 text-xs lg:text-sm">
                                  <div><span className="font-medium text-blue-300">Name:</span> <span className="text-slate-200">{record.basicInfo?.name}</span></div>
                                  <div><span className="font-medium text-blue-300">Age:</span> <span className="text-slate-200">{record.basicInfo?.age}</span></div>
                                  <div><span className="font-medium text-blue-300">Sex:</span> <span className="text-slate-200">{record.basicInfo?.sex}</span></div>
                                  <div><span className="font-medium text-blue-300">Address:</span> <span className="text-slate-200">{record.basicInfo?.address || 'N/A'}</span></div>
                                  <div><span className="font-medium text-blue-300">Religion:</span> <span className="text-slate-200">{record.basicInfo?.religion || 'N/A'}</span></div>
                                  <div><span className="font-medium text-blue-300">Occupation:</span> <span className="text-slate-200">{record.basicInfo?.occupation || 'N/A'}</span></div>
                                </div>
                              </div>

                              {/* Vital Signs */}
                              {record.physicalExamination?.vitals && (
                                <div className="bg-slate-700 rounded-lg p-4 border border-slate-600">
                                  <h3 className="font-bold text-white mb-3 text-lg">💓 Vital Signs</h3>
                                  <div className="space-y-2 text-sm">
                                    <div><span className="font-medium text-blue-300">BP:</span> <span className="text-slate-200">{record.physicalExamination.vitals.bp || 'N/A'}</span></div>
                                    <div><span className="font-medium text-blue-300">Pulse Rate:</span> <span className="text-slate-200">{record.physicalExamination.vitals.pulseRate || 'N/A'}</span></div>
                                    <div><span className="font-medium text-blue-300">Respiratory Rate:</span> <span className="text-slate-200">{record.physicalExamination.vitals.respiratoryRate || 'N/A'}</span></div>
                                    <div><span className="font-medium text-blue-300">Temperature:</span> <span className="text-slate-200">{record.physicalExamination.vitals.temp || 'N/A'}</span></div>
                                  </div>
                                </div>
                              )}

                              {/* Chief Complaints */}
                              <div className="bg-slate-700 rounded-lg p-4 border border-slate-600">
                                <h3 className="font-bold text-white mb-3 text-lg">⚕️ Chief Complaints</h3>
                                <p className="text-sm text-slate-200">{record.history?.chiefComplaints || 'N/A'}</p>
                              </div>

                              {/* Diagnosis */}
                              <div className="bg-slate-700 rounded-lg p-4 border border-slate-600">
                                <h3 className="font-bold text-white mb-3 text-lg">🔬 Diagnosis</h3>
                                <p className="text-sm text-slate-200">{record.diagnosis || 'Pending'}</p>
                                {record.diagnosisImageUrl && (
                                  <img src={record.diagnosisImageUrl} alt="Diagnosis" className="mt-3 max-w-xs rounded-lg border border-slate-300" />
                                )}
                              </div>

                              {/* Physical Examination */}
                              {record.physicalExamination && (
                                <div className="bg-slate-700 rounded-lg p-4 border border-slate-600">
                                  <h3 className="font-bold text-white mb-3 text-lg">🏥 Physical Examination</h3>
                                  <div className="space-y-1 text-sm">
                                    <div><span className="font-medium text-blue-300">Weight:</span> <span className="text-slate-200">{record.physicalExamination.weight || 'N/A'} kg</span></div>
                                    <div><span className="font-medium text-blue-300">Height:</span> <span className="text-slate-200">{record.physicalExamination.height || 'N/A'} cm</span></div>
                                    <div><span className="font-medium text-blue-300">General Appearance:</span> <span className="text-slate-200">{record.physicalExamination.generalAppearance || 'N/A'}</span></div>
                                    <div><span className="font-medium text-blue-300">Built:</span> <span className="text-slate-200">{record.physicalExamination.built || 'N/A'}</span></div>
                                  </div>
                                </div>
                              )}

                              {/* Ayurvedic Parameters */}
                              {record.dashavidhaParikshana && (
                                <div className="bg-slate-700 rounded-lg p-4 border border-slate-600">
                                  <h3 className="font-bold text-white mb-3 text-lg">🧘 Dashavidha Parikshana</h3>
                                  <div className="space-y-1 text-sm">
                                    <div><span className="font-medium text-blue-300">Prakriti (Body):</span> <span className="text-slate-200">{record.dashavidhaParikshana.prakritiSharirik || 'N/A'}</span></div>
                                    <div><span className="font-medium text-blue-300">Prakriti (Mind):</span> <span className="text-slate-200">{record.dashavidhaParikshana.prakritiMansika || 'N/A'}</span></div>
                                    <div><span className="font-medium text-blue-300">Vikriti Dosha:</span> <span className="text-slate-200">{record.dashavidhaParikshana.vikritiDosha || 'N/A'}</span></div>
                                    <div><span className="font-medium text-blue-300">Saara:</span> <span className="text-slate-200">{record.dashavidhaParikshana.saara || 'N/A'}</span></div>
                                  </div>
                                </div>
                              )}

                              {/* Tongue Examination */}
                              {record.jivhaPariksha && (
                                <div className="bg-slate-700 rounded-lg p-4 border border-slate-600">
                                  <h3 className="font-bold text-white mb-3 text-lg">👅 Jivha Pariksha (Tongue)</h3>
                                  <div className="space-y-1 text-sm">
                                    <div><span className="font-medium text-blue-300">Color:</span> <span className="text-slate-200">{record.jivhaPariksha.color || 'N/A'}</span></div>
                                    <div><span className="font-medium text-blue-300">Coating:</span> <span className="text-slate-200">{record.jivhaPariksha.coating || 'N/A'}</span></div>
                                    <div><span className="font-medium text-blue-300">Texture:</span> <span className="text-slate-200">{record.jivhaPariksha.texture || 'N/A'}</span></div>
                                    <div><span className="font-medium text-blue-300">Moisture:</span> <span className="text-slate-200">{record.jivhaPariksha.moisture || 'N/A'}</span></div>
                                  </div>
                                  {record.jivhaPariksha.imageUrl && (
                                    <img src={record.jivhaPariksha.imageUrl} alt="Tongue" className="mt-3 max-w-xs rounded-lg border border-slate-300" />
                                  )}
                                </div>
                              )}

                              {/* Personal History */}
                              {record.personalHistory && (
                                <div className="bg-slate-700 rounded-lg p-4 border border-slate-600">
                                  <h3 className="font-bold text-white mb-3 text-lg">📝 Personal History</h3>
                                  <div className="space-y-1 text-sm">
                                    <div><span className="font-medium text-blue-300">Diet:</span> <span className="text-slate-200">{record.personalHistory.diet || 'N/A'}</span></div>
                                    <div><span className="font-medium text-blue-300">Sleep:</span> <span className="text-slate-200">{record.personalHistory.sleep || 'N/A'}</span></div>
                                    <div><span className="font-medium text-blue-300">Exercise:</span> <span className="text-slate-200">{record.personalHistory.exercise || 'N/A'}</span></div>
                                    <div><span className="font-medium text-blue-300">Addiction:</span> <span className="text-slate-200">{Array.isArray(record.personalHistory.addiction) ? record.personalHistory.addiction.join(', ') || 'None' : 'N/A'}</span></div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [hasAdmin, setHasAdmin] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [setupStep, setSetupStep] = useState(1); // 1 for email, 2 for OTP/credentials
  
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch('/api/admin/check');
        const data = await res.json();
        setHasAdmin(data.hasAdmin);
        if (data.isAuthenticated) setIsAuthenticated(true);
      } catch (error) {
        console.error("Failed to check admin status.");
      } finally {
        setLoading(false);
      }
    };
    checkStatus();
  }, []);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const loadingToast = toast.loading('Sending OTP...');
    try {
      const res = await fetch('/api/admin/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send_otp', email }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('OTP sent! Please check your inbox.', { id: loadingToast });
        setSetupStep(2);
      } else {
        toast.error(data.message || 'Failed to send OTP.', { id: loadingToast });
      }
    } catch (error) {
      toast.error('An error occurred.', { id: loadingToast });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyAndSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const loadingToast = toast.loading('Verifying and setting up account...');
    try {
      const res = await fetch('/api/admin/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify_and_setup', email, otp, username, password }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Setup complete! Logged in.', { id: loadingToast });
        setIsAuthenticated(true); // This will trigger re-render to show dashboard
      } else {
        toast.error(data.message || 'Setup failed.', { id: loadingToast });
      }
    } catch (error) {
      toast.error('An error occurred.', { id: loadingToast });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const loadingToast = toast.loading('Logging in...');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Logged in successfully!', { id: loadingToast });
        setIsAuthenticated(true);
      } else {
        toast.error(data.message || 'Invalid credentials.', { id: loadingToast });
      }
    } catch (error) {
      toast.error('An error occurred.', { id: loadingToast });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/check', { method: 'DELETE' });
    setIsAuthenticated(false);
    toast.success('Logged out successfully');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 font-bold text-slate-500">Loading...</div>;

  if (isAuthenticated) return <AdminDashboard onLogout={handleLogout} />;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans selection:bg-blue-200">
      <div className="bg-white p-8 sm:p-10 rounded-3xl shadow-xl border border-slate-100 max-w-md w-full space-y-8">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 text-center">
            {hasAdmin ? 'Admin Login' : 'Initialize Admin'}
          </h1>
          <p className="text-sm text-slate-500 text-center mt-2">
            {hasAdmin ? 'Enter your credentials to access the dashboard' : 'Enter your email to receive a secure one-time code'}
          </p>
        </div>

        {!hasAdmin ? (
          setupStep === 1 ? (
            <form onSubmit={handleSendOtp} className="space-y-6">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-slate-700">Master Email</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@hospital.com" className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none transition-colors text-slate-900 placeholder:text-slate-400 bg-white" />
              </div>
              <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl shadow-md hover:bg-blue-700 transition-all disabled:opacity-70 disabled:cursor-not-allowed">
                {isSubmitting ? 'Sending...' : 'Send Code'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyAndSetup} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-slate-700">6-Digit Code</label>
                <input type="text" inputMode="numeric" maxLength={6} required value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="123456" className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none transition-colors text-slate-900 placeholder:text-slate-400 bg-white" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-slate-700">Create Username</label>
                <input type="text" required value={username} onChange={(e) => setUsername(e.target.value)} placeholder="admin_user" className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none transition-colors text-slate-900 placeholder:text-slate-400 bg-white" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-slate-700">Create Password</label>
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none transition-colors text-slate-900 placeholder:text-slate-400 bg-white" />
              </div>
              <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl shadow-md hover:bg-blue-700 transition-all disabled:opacity-70 disabled:cursor-not-allowed">
                {isSubmitting ? 'Verifying...' : 'Complete Setup'}
              </button>
            </form>
          )
        ) : (
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-slate-700">Username</label>
              <input type="text" required value={username} onChange={(e) => setUsername(e.target.value)} placeholder="admin_user" className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none transition-colors text-slate-900 placeholder:text-slate-400 bg-white" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-slate-700">Password</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none transition-colors text-slate-900 placeholder:text-slate-400 bg-white" />
            </div>
            <button type="submit" disabled={isSubmitting} className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl shadow-md hover:bg-slate-800 transition-all disabled:opacity-70 disabled:cursor-not-allowed">
              {isSubmitting ? 'Logging In...' : 'Login to Dashboard'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
