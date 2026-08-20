import path from 'path';
import dotenv from '../backend/node_modules/dotenv';
import bcrypt from '../backend/node_modules/bcryptjs';

dotenv.config({ path: path.resolve(__dirname, '../backend/.env') });

import { db } from '../backend/src/db/connection';
import { runMigrations } from '../backend/src/db/migrations/runMigrations';

async function seed() {
  console.log('[SuGam Seed] Initializing database migration and seed data...');
  runMigrations();

  // Clear existing demonstration data for clean demo environment
  db.exec(`
    DELETE FROM appeals;
    DELETE FROM grievance_notes;
    DELETE FROM status_history;
    DELETE FROM notifications;
    DELETE FROM grievances;
    DELETE FROM officers;
    DELETE FROM departments;
    DELETE FROM users;
    DELETE FROM otps;
  `);

  console.log('[SuGam Seed] Seeding Departments...');
  const departments = [
    {
      id: 'dept-water',
      code: 'DEPT_WATER',
      name_en: 'Municipal Water Supply & Sewerage',
      name_hi: 'नगर जल आपूर्ति एवं सीवरेज बोर्ड',
      description_en: 'Management of drinking water distribution, pipeline maintenance, contaminated supply remediation, and drainage cleaning.',
      description_hi: 'पेयजल वितरण प्रबंधन, पाइपलाइन मरम्मत, दूषित जल निवारण एवं जल निकासी नालों की सफाई।',
      sla_days: 7,
    },
    {
      id: 'dept-power',
      code: 'DEPT_POWER',
      name_en: 'Electricity Distribution Corporation',
      name_hi: 'विद्युत वितरण निगम',
      description_en: 'Power supply reliability, transformer repairs, faulty metering, billing discrepancies, and overhead line safety.',
      description_hi: 'विद्युत आपूर्ति निरंतरता, ट्रांसफार्मर मरम्मत, खराब मीटर, बिलिंग विसंगतियां एवं ओवरहेड तारों की सुरक्षा।',
      sla_days: 5,
    },
    {
      id: 'dept-roads',
      code: 'DEPT_ROADS',
      name_en: 'Public Works & Urban Roads',
      name_hi: 'लोक निर्माण एवं शहरी मार्ग विभाग',
      description_en: 'Road repair, pothole filling, storm drain covers, pedestrian footpaths, and public street lighting infrastructure.',
      description_hi: 'सड़क मरम्मत, गड्ढा भराव, वर्षा नाली ढक्कन, पैदल मार्ग एवं सार्वजनिक स्ट्रीट लाइट का संधारण।',
      sla_days: 15,
    },
    {
      id: 'dept-welfare',
      code: 'DEPT_WELFARE',
      name_en: 'Social Welfare & Pension Schemes',
      name_hi: 'समाज कल्याण एवं पेंशन विभाग',
      description_en: 'Disbursement of old-age pension, widow assistance, disability benefits, and Direct Benefit Transfer (DBT) verification.',
      description_hi: 'वृद्धावस्था पेंशन, विधवा सहायता, दिव्यांगजन भत्ता एवं प्रत्यक्ष लाभ अंतरण (डीबीटी) सत्यापन।',
      sla_days: 21,
    },
    {
      id: 'dept-health',
      code: 'DEPT_HEALTH',
      name_en: 'Public Health & Sanitation',
      name_hi: 'जन स्वास्थ्य एवं स्वच्छता निदेशालय',
      description_en: 'Primary health center services, medicine availability, vector-borne disease fogging, and urban waste clearance.',
      description_hi: 'प्राथमिक स्वास्थ्य केंद्र सेवाएं, दवा उपलब्धता, मच्छर रोधी फॉगिंग एवं ठोस अपशिष्ट निस्तारण।',
      sla_days: 3,
    },
    {
      id: 'dept-food',
      code: 'DEPT_FOOD',
      name_en: 'Food, Civil Supplies & Consumer Affairs',
      name_hi: 'खाद्य, नागरिक आपूर्ति एवं उपभोक्ता मामले',
      description_en: 'Fair price shop operation, ration card biometric updates, grain quota allocations, and dealer compliance.',
      description_hi: 'उचित दर राशन दुकान संचालन, राशन कार्ड बायोमेट्रिक अपडेट, खाद्यान्न कोटा आवंटन एवं विक्रेता नियम अनुपालन।',
      sla_days: 10,
    },
    {
      id: 'dept-transport',
      code: 'DEPT_TRANSPORT',
      name_en: 'Urban Transport & Public Mobility',
      name_hi: 'नगर परिवहन एवं सार्वजनिक गतिशीलता',
      description_en: 'City bus routing, frequency improvements, bus shelter maintenance, and transit passenger safety.',
      description_hi: 'नगर बस रूटिंग, फेरों में वृद्धि, बस शेल्टर रखरखाव एवं यात्री सुरक्षा सुविधाएं।',
      sla_days: 7,
    },
    {
      id: 'dept-revenue',
      code: 'DEPT_REVENUE',
      name_en: 'Revenue, Land Records & Survey',
      name_hi: 'राजस्व, भू-अभिलेख एवं सर्वेक्षण विभाग',
      description_en: 'Land record mutation, demarcation certificates, property tax valuation, and revenue boundary disputes.',
      description_hi: 'भू-अभिलेख नामांतरण, सीमांकन प्रमाण पत्र, संपत्ति कर निर्धारण एवं राजस्व सीमा विवाद।',
      sla_days: 30,
    },
  ];

  const insertDept = db.prepare(`
    INSERT INTO departments (id, code, name_en, name_hi, description_en, description_hi, sla_days, active)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1)
  `);

  for (const d of departments) {
    insertDept.run(d.id, d.code, d.name_en, d.name_hi, d.description_en, d.description_hi, d.sla_days);
  }

  console.log('[SuGam Seed] Seeding Officers & Nodal Authorities...');
  const salt = await bcrypt.genSalt(10);
  const officerHash = await bcrypt.hash('Officer@123', salt);
  const nodalHash = await bcrypt.hash('Nodal@123', salt);

  const officers = [
    {
      id: 'off-nodal-1',
      email: 'nodal.admin@sugam.local',
      password_hash: nodalHash,
      name: 'Dr. Alok Verma, IAS',
      role: 'nodal_officer',
      department_id: null,
    },
    {
      id: 'off-water-1',
      email: 'officer.water@sugam.local',
      password_hash: officerHash,
      name: 'Er. Rajesh Singhania',
      role: 'redressal_officer',
      department_id: 'dept-water',
    },
    {
      id: 'off-power-1',
      email: 'officer.power@sugam.local',
      password_hash: officerHash,
      name: 'Smt. Vandana Sharma',
      role: 'redressal_officer',
      department_id: 'dept-power',
    },
    {
      id: 'off-roads-1',
      email: 'officer.roads@sugam.local',
      password_hash: officerHash,
      name: 'Er. Pradeep Deshmukh',
      role: 'redressal_officer',
      department_id: 'dept-roads',
    },
    {
      id: 'off-welfare-1',
      email: 'officer.welfare@sugam.local',
      password_hash: officerHash,
      name: 'Shri Manoj Tiwary',
      role: 'redressal_officer',
      department_id: 'dept-welfare',
    },
    {
      id: 'off-health-1',
      email: 'officer.health@sugam.local',
      password_hash: officerHash,
      name: 'Dr. Sunita Kulkarni',
      role: 'redressal_officer',
      department_id: 'dept-health',
    },
    {
      id: 'off-food-1',
      email: 'officer.food@sugam.local',
      password_hash: officerHash,
      name: 'Shri Harish Chandra',
      role: 'redressal_officer',
      department_id: 'dept-food',
    },
  ];

  const insertOfficer = db.prepare(`
    INSERT INTO officers (id, email, password_hash, name, role, department_id, active)
    VALUES (?, ?, ?, ?, ?, ?, 1)
  `);

  for (const o of officers) {
    insertOfficer.run(o.id, o.email, o.password_hash, o.name, o.role, o.department_id);
  }

  console.log('[SuGam Seed] Seeding Realistic Mock Citizens...');
  const users = [
    { id: 'usr-1', phone: '9876543210', name: 'Ramesh Kumar', language_preference: 'hi' },
    { id: 'usr-2', phone: '9811223344', name: 'Sunita Devi', language_preference: 'hi' },
    { id: 'usr-3', phone: '9712345678', name: 'Rajesh Sharma', language_preference: 'en' },
    { id: 'usr-4', phone: '9988776655', name: 'Ananya Gupta', language_preference: 'en' },
  ];

  const insertUser = db.prepare(`
    INSERT INTO users (id, phone, name, language_preference)
    VALUES (?, ?, ?, ?)
  `);

  for (const u of users) {
    insertUser.run(u.id, u.phone, u.name, u.language_preference);
  }

  console.log('[SuGam Seed] Seeding Demo Grievances Across Lifecycle States...');
  const now = new Date();

  // Helper date calculation relative to now
  const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000).toISOString();
  const daysAhead = (d: number) => new Date(now.getTime() + d * 86400000).toISOString();

  const demoGrievances = [
    {
      id: 'grv-1',
      tracking_number: 'SGM-2026-1049',
      user_id: 'usr-1',
      department_id: 'dept-water',
      category: 'Contaminated Water Supply',
      raw_text: 'वार्ड नंबर 14 में पिछले 5 दिनों से नलों में बदबूदार और पीला गंदा पानी आ रहा है। बच्चे बीमार पड़ रहे हैं। तुरंत पाइपलाइन चेक करवाएं।',
      clarified_text: 'वार्ड संख्या 14 के आवासीय क्षेत्र में विगत 5 दिनों से दूषित तथा दुर्गंधयुक्त जलापूर्ति हो रही है, जिससे स्वास्थ्य जोखिम उत्पन्न हो रहा है। संबंधित मुख्य पाइपलाइन का तत्काल निरीक्षण तथा शुद्ध जलापूर्ति बहाल करने की प्रार्थना है।',
      language: 'hi',
      status: 'in_progress',
      priority: 'high',
      photo_url: null,
      created_at: daysAgo(2),
      sla_deadline: daysAhead(5),
      is_escalated: 0,
      ai_confidence: 0.94,
      ai_reasoning: 'जलापूर्ति एवं जल गुणवत्ता से संबंधित समस्या, नगर जल आपूर्ति विभाग को अग्रेषित।',
      resolution_summary: null,
      resolved_at: null,
    },
    {
      id: 'grv-2',
      tracking_number: 'SGM-2026-2184',
      user_id: 'usr-2',
      department_id: 'dept-welfare',
      category: 'Delayed Pension Disbursement',
      raw_text: 'मेरी वृद्धावस्था पेंशन पिछले 4 महीने से बैंक खाते में नहीं आई है। पंचायत सचिव बोलता है आधार री-वेरिफिकेशन चाहिए पर ब्लॉक ऑफिस में कोई सुनता नहीं है।',
      clarified_text: 'आवेदिका की वृद्धावस्था पेंशन विगत 4 माह से बैंक खाते में जमा नहीं हुई है। आधार सत्यापन एवं डीबीटी लिंक की प्रक्रिया ब्लॉक स्तर पर लंबित है। पेंशन राशि अवमुक्त कराने का कष्ट करें।',
      language: 'hi',
      status: 'resolved',
      priority: 'medium',
      photo_url: null,
      created_at: daysAgo(25),
      sla_deadline: daysAgo(4),
      is_escalated: 0,
      ai_confidence: 0.96,
      ai_reasoning: 'वृद्धावस्था पेंशन वितरण संबंधित प्रकरण, समाज कल्याण विभाग को अग्रेषित।',
      resolution_summary: 'ब्लॉक समाज कल्याण अधिकारी द्वारा बैंक एनपीसीआई मैपिंग को दुरुस्त कर दिया गया है तथा 4 माह की बकाया पेंशन राशि खाते में हस्तांतरित कर दी गई है।',
      resolved_at: daysAgo(3),
    },
    {
      id: 'grv-3',
      tracking_number: 'SGM-2026-3902',
      user_id: 'usr-3',
      department_id: 'dept-power',
      category: 'Transformer Failure & Low Voltage',
      raw_text: 'Frequent tripping and dangerous voltage fluctuation on Sector 4 Main Road near transformer #T-12. Several home appliances got damaged due to surge.',
      clarified_text: 'Severe voltage fluctuations and recurring electrical tripping observed on Sector 4 Main Road near distribution transformer #T-12. Requesting urgent transformer load balancing and surge protector replacement.',
      language: 'en',
      status: 'submitted',
      priority: 'urgent',
      photo_url: null,
      created_at: daysAgo(1),
      sla_deadline: daysAhead(4),
      is_escalated: 1,
      ai_confidence: 0.91,
      ai_reasoning: 'Identified electrical transformer risk; categorized under Power Distribution with high priority.',
      resolution_summary: null,
      resolved_at: null,
    },
    {
      id: 'grv-4',
      tracking_number: 'SGM-2026-4411',
      user_id: 'usr-4',
      department_id: 'dept-roads',
      category: 'Hazardous Road Potholes',
      raw_text: 'Outer Ring Road intersection near Gandhi Chowk has deep craters after monsoon. Two two-wheelers skidded yesterday. Immediate asphalt patching needed.',
      clarified_text: 'Deep cratering and severe asphalt deterioration at Outer Ring Road intersection near Gandhi Chowk creating accident hazards. Immediate road resurfacing and cold-mix pothole patching requested.',
      language: 'en',
      status: 'in_progress',
      priority: 'high',
      photo_url: null,
      created_at: daysAgo(14),
      sla_deadline: daysAgo(1),
      is_escalated: 1,
      ai_confidence: 0.95,
      ai_reasoning: 'Urban road damage causing public road safety risk, mapped to Public Works Department.',
      resolution_summary: null,
      resolved_at: null,
    },
    {
      id: 'grv-5',
      tracking_number: 'SGM-2026-5520',
      user_id: 'usr-1',
      department_id: 'dept-health',
      category: 'Garbage Dump Overflow',
      raw_text: 'कचरा गाड़ी पिछले 8 दिन से हमारे मोहल्ले शास्त्री नगर गली 3 में नहीं आई है। चौराहे पर कूड़े का बड़ा ढेर लग गया है और बदबू फैल रही है।',
      clarified_text: 'शास्त्री नगर गली संख्या 3 में विगत 8 दिनों से ठोस अपशिष्ट संग्रह वाहन अनुपस्थित है। सार्वजनिक चौराहे पर कूड़े का संचय होने से संक्रामक रोगों का खतरा है। तत्काल सफाई दल तैनात करने की प्रार्थना है।',
      language: 'hi',
      status: 'appealed',
      priority: 'medium',
      photo_url: null,
      created_at: daysAgo(10),
      sla_deadline: daysAgo(7),
      is_escalated: 1,
      ai_confidence: 0.93,
      ai_reasoning: 'कचरा संग्रहण एवं स्वच्छता संबंधित प्रकरण, जन स्वास्थ्य एवं स्वच्छता विभाग को अग्रेषित।',
      resolution_summary: 'विभाग द्वारा बताया गया कि कचरा वाहन नियमित चल रहा है। (नागरिक द्वारा असंतोष व्यक्त करते हुए अपील दर्ज की गई)',
      resolved_at: daysAgo(4),
    },
    {
      id: 'grv-6',
      tracking_number: 'SGM-2026-6190',
      user_id: 'usr-3',
      department_id: 'dept-food',
      category: 'Ration Dealer Irregularity',
      raw_text: 'Fair price ration shop dealer #44 in Patel Nagar is denying fortified rice quota and demanding extra cash above government mandated subsidised price.',
      clarified_text: 'Ration Dealer at Fair Price Shop #44, Patel Nagar is refusing statutory grain allocation and charging illicit surcharge above MSP. Requesting inspection of biometric logs and stock registers.',
      language: 'en',
      status: 'info_requested',
      priority: 'medium',
      photo_url: null,
      created_at: daysAgo(4),
      sla_deadline: daysAhead(6),
      is_escalated: 0,
      ai_confidence: 0.89,
      ai_reasoning: 'PDS dealer malpractice complaint routed to Food & Civil Supplies Department.',
      resolution_summary: null,
      resolved_at: null,
    },
  ];

  const insertGrievance = db.prepare(`
    INSERT INTO grievances (
      id, tracking_number, user_id, department_id, category, raw_text,
      clarified_text, language, status, priority, photo_url, sla_deadline,
      is_escalated, ai_classification_confidence, ai_reasoning, resolution_summary,
      created_at, updated_at, resolved_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const g of demoGrievances) {
    insertGrievance.run(
      g.id, g.tracking_number, g.user_id, g.department_id, g.category, g.raw_text,
      g.clarified_text, g.language, g.status, g.priority, g.photo_url, g.sla_deadline,
      g.is_escalated, g.ai_confidence, g.ai_reasoning, g.resolution_summary,
      g.created_at, g.created_at, g.resolved_at
    );
  }

  console.log('[SuGam Seed] Seeding Status Timelines and Departmental Notes...');
  const insertHistory = db.prepare(`
    INSERT INTO status_history (id, grievance_id, from_status, to_status, remarks, changed_by_type, changed_by_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertNote = db.prepare(`
    INSERT INTO grievance_notes (id, grievance_id, officer_id, note_type, content, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  // History for grv-1
  insertHistory.run('sh-1', 'grv-1', null, 'submitted', 'Grievance submitted by citizen.', 'citizen', 'usr-1', daysAgo(2));
  insertHistory.run('sh-2', 'grv-1', 'submitted', 'in_progress', 'Field inspection team dispatched to Ward 14 pipeline junction.', 'officer', 'off-water-1', daysAgo(1));
  insertNote.run('gn-1', 'grv-1', 'off-water-1', 'internal', 'Junior Engineer reports localized pipe crack near valve box. Chlorination team alerted.', daysAgo(1));

  // History for grv-2
  insertHistory.run('sh-3', 'grv-2', null, 'submitted', 'Pension grievance submitted.', 'citizen', 'usr-2', daysAgo(25));
  insertHistory.run('sh-4', 'grv-2', 'submitted', 'in_progress', 'Case taken up by Block Development Officer.', 'officer', 'off-welfare-1', daysAgo(10));
  insertHistory.run('sh-5', 'grv-2', 'in_progress', 'resolved', 'Bank NPCI seeding verified. 4 months pension credited to beneficiary account.', 'officer', 'off-welfare-1', daysAgo(3));

  // History for grv-4 (Breached SLA)
  insertHistory.run('sh-6', 'grv-4', null, 'submitted', 'Road pothole grievance submitted.', 'citizen', 'usr-4', daysAgo(14));
  insertHistory.run('sh-7', 'grv-4', 'submitted', 'in_progress', 'Assigned to Ward Road Maintenance Sub-division.', 'officer', 'off-roads-1', daysAgo(8));

  // History for grv-5 (Appealed)
  insertHistory.run('sh-8', 'grv-5', null, 'submitted', 'Sanitation grievance registered.', 'citizen', 'usr-1', daysAgo(10));
  insertHistory.run('sh-9', 'grv-5', 'submitted', 'resolved', 'Department reported routine vehicle operations.', 'officer', 'off-health-1', daysAgo(4));
  insertHistory.run('sh-10', 'grv-5', 'resolved', 'appealed', 'First appeal filed by citizen. Escalated to Nodal Authority.', 'citizen', 'usr-1', daysAgo(2));

  // Appeal record for grv-5
  db.prepare(`
    INSERT INTO appeals (id, grievance_id, user_id, reason, ai_draft_used, status, remarks, appellate_officer_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'app-1',
    'grv-5',
    'usr-1',
    'अधिकारी ने गलत रिपोर्ट लगाई है कि गाड़ी आ रही है। जमीनी स्तर पर कूड़ा अभी भी पड़ा हुआ है और कोई सफाई नहीं हुई है। कृपया स्वतंत्र जांच कराएं।',
    1,
    'submitted',
    null,
    null,
    daysAgo(2)
  );

  console.log('[SuGam Seed] Seeding Citizen In-App Notifications...');
  const insertNotif = db.prepare(`
    INSERT INTO notifications (id, user_id, grievance_id, title_en, title_hi, message_en, message_hi, is_read, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertNotif.run(
    'nt-1',
    'usr-1',
    'grv-1',
    'Grievance Registered',
    'शिकायत दर्ज की गई',
    'Your grievance SGM-2026-1049 is assigned to Municipal Water Supply & Sewerage.',
    'आपकी शिकायत SGM-2026-1049 नगर जल आपूर्ति एवं सीवरेज बोर्ड को अग्रेषित की गई है।',
    0,
    daysAgo(2)
  );

  insertNotif.run(
    'nt-2',
    'usr-2',
    'grv-2',
    'Pension Grievance Resolved',
    'पेंशन शिकायत का समाधान हुआ',
    'Your grievance SGM-2026-2184 has been resolved. Pending pension arrears credited.',
    'आपकी शिकायत SGM-2026-2184 का समाधान कर दिया गया है। बकाया पेंशन खाते में भेजी गई।',
    1,
    daysAgo(3)
  );

  insertNotif.run(
    'nt-3',
    'usr-1',
    'grv-5',
    'Appeal Under Supervisory Review',
    'अपील पर्यवेक्षी समीक्षाधीन',
    'Your appeal for grievance SGM-2026-5520 is under review by Nodal Appellate Authority.',
    'शिकायत SGM-2026-5520 के लिए आपकी अपील नोडल अपीलीय प्राधिकारी द्वारा समीक्षाधीन है।',
    0,
    daysAgo(2)
  );

  console.log('[SuGam Seed] Seed execution finished successfully.');
}

seed().catch((err) => {
  console.error('[SuGam Seed Error]', err);
  process.exit(1);
});
