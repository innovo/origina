import type { SourceType } from "./types";

export type CorpusDoc = {
  id: string;
  title: string;
  sourceType: SourceType;
  sourceRef: string;
  body: string;
};

export const CORPUS: CorpusDoc[] = [
  {
    id: "trauma-primary-survey",
    title: "Primary survey in major trauma (ABCDE)",
    sourceType: "textbook",
    sourceRef: "CEC Clinical Skills Compendium, 2024",
    body: `The primary survey in major trauma follows a strict ABCDE sequence so that immediately life-threatening problems are found and treated before moving on. Airway with cervical spine control comes first: talk to the patient, look for obstruction, blood or vomitus, and keep the neck in a neutral position with manual in-line stabilisation. Breathing assessment includes inspection of chest wall movement, percussion, auscultation and pulse oximetry; tension pneumothorax, open chest wound and massive haemothorax must be excluded at this stage. Circulation addresses catastrophic haemorrhage, pulse quality, skin colour and capillary refill, with two large-bore cannulae and blood samples including a group and cross-match. Disability is a rapid neurological screen using AVPU or Glasgow Coma Scale, pupil size and blood glucose. Exposure requires full inspection while preventing hypothermia. Reassessment is continuous. Any deterioration returns the clinician to airway. Documentation of times, interventions and response is part of the survey, not an afterthought.`,
  },
  {
    id: "meds-five-rights",
    title: "Safe medication administration: the five rights",
    sourceType: "institutional",
    sourceRef: "WCCN Medicines Management Policy",
    body: `Safe medication administration in nursing practice is organised around the five rights: the right patient, the right drug, the right dose, the right route and the right time. Identity is confirmed with two identifiers, never a bed number alone. The medication is checked against the original prescription, not a transcribed list, and allergies are reviewed every time. Dose calculation is independently double-checked for high-risk medicines including insulin, anticoagulants, opioids and paediatric formulations. Route errors remain a leading source of harm; intramuscular, subcutaneous, intravenous and enteral routes are not interchangeable. Timing considers food, other drugs and the pharmacokinetic profile. A sixth discipline, right documentation, closes the loop: the record is completed immediately after administration, never in advance. If a dose is withheld, the reason is recorded and the prescriber is informed. Students administer medicines only under direct supervision of a registered nurse until signed off.`,
  },
  {
    id: "pph-protocol",
    title: "Primary postpartum haemorrhage protocol",
    sourceType: "journal",
    sourceRef: "Western Cape Maternity Guidelines",
    body: `Primary postpartum haemorrhage is blood loss of 500 millilitres or more within 24 hours of birth, or any loss that causes haemodynamic compromise. The four T mnemonic structures the search for cause: tone, trauma, tissue and thrombin. Uterine atony is the most common. Call for help, lie the woman flat, keep her warm and give high-flow oxygen. Rub up a contraction, empty the bladder, and start an oxytocin infusion according to local protocol. Bimanual compression and aorto-caval compression buy time. Intravenous access with two large-bore cannulae, bloods for full blood count, clotting and cross-match, and a rapid crystalloid bolus precede blood products. Tranexamic acid is given as soon as haemorrhage is recognised if there is no contraindication. Genital tract trauma is inspected under good light. Retained placenta or membranes are excluded. Coagulopathy is treated, not assumed. Every unit records estimated blood loss, vital signs and the time of each intervention.`,
  },
  {
    id: "infection-bundle",
    title: "Standard precautions and the infection prevention bundle",
    sourceType: "institutional",
    sourceRef: "National Infection Prevention and Control Strategic Framework",
    body: `Standard precautions apply to every patient, every time, because colonisation is not always visible. Hand hygiene uses alcohol-based rub when hands are not visibly soiled and soap and water when they are, following the five moments: before touching a patient, before a clean or aseptic procedure, after body fluid exposure risk, after touching a patient and after touching patient surroundings. Personal protective equipment is selected by the task, not by diagnosis. Sharps are never recapped; they go straight into a puncture-proof container. Environmental cleaning of high-touch surfaces is scheduled and audited. Aseptic non-touch technique protects invasive devices. Transmission-based precautions (contact, droplet, airborne) are added when a specific pathogen requires them. Students who are unwell stay away from clinical areas. Needlestick injury is reported immediately through occupational health, not informally at the end of a shift.`,
  },
  {
    id: "nursing-ethics",
    title: "Four principles of biomedical ethics in nursing",
    sourceType: "textbook",
    sourceRef: "Professional Practice for South African Nurses",
    body: `Beauchamp and Childress describe four clusters of moral principle that structure everyday nursing decisions: respect for autonomy, non-maleficence, beneficence and justice. Autonomy requires that a competent adult is given enough information to accept or refuse treatment, in a language they understand, without coercion. In South Africa this sits alongside the National Health Act and the SANC code. Non-maleficence is the duty not to inflict harm, including harm from poor handover, medication error or silence when a colleague is unsafe. Beneficence is the positive duty to act in the patient's interest, which sometimes conflicts with autonomy, as in a patient who refuses a blood transfusion. Justice concerns fair distribution of nursing time, theatre slots and scarce equipment, and refuses discrimination on the basis of diagnosis, language or social standing. Confidentiality is a supporting rule, limited when disclosure is required to prevent serious harm. Ethical distress should be taken to a supervisor, not absorbed in silence.`,
  },
  {
    id: "hypovolaemic-shock",
    title: "Hypovolaemic shock and fluid resuscitation",
    sourceType: "journal",
    sourceRef: "Emergency Care Review Notes, CEC",
    body: `Hypovolaemic shock is inadequate tissue perfusion caused by loss of circulating volume, from haemorrhage, burns or gastrointestinal fluid loss. Compensated shock may present with anxiety, tachycardia and cool peripheries while blood pressure is still maintained, especially in young adults. Decompensation brings hypotension, falling conscious level and oliguria. The first priority is to stop visible bleeding and secure the airway. Large-bore intravenous or intraosseous access is obtained, and blood is drawn before fluids dilute the sample. In haemorrhage, blood products are preferred to large crystalloid volumes; a 1:1:1 ratio of red cells, plasma and platelets is used in massive transfusion protocols. Permissive hypotension is considered in uncontrolled truncal bleeding until surgical control. Warm the patient, because hypothermia worsens coagulopathy. Serial lactate and urine output guide the response. Vasopressors are not a substitute for volume in pure hypovolaemia.`,
  },
  {
    id: "paeds-triangle",
    title: "Paediatric assessment triangle",
    sourceType: "textbook",
    sourceRef: "Emergency Nursing of Children",
    body: `The paediatric assessment triangle is a hands-off first impression that takes less than thirty seconds: appearance, work of breathing, and circulation to the skin. Appearance covers tone, interactiveness, consolability, look or gaze, and speech or cry (the TICLS features). Abnormal appearance with normal breathing and colour suggests a central neurological or metabolic problem. Increased work of breathing with normal appearance and colour points to a respiratory cause that is still compensating. Pallor, mottling or cyanosis with a still-interactive child is a circulation problem. When two or more sides of the triangle are abnormal the child is unstable and the team prepares for rapid intervention. Vital signs follow the triangle; they never replace it. Normal values change with age, so a heart rate that is fine in a neonate is shock in an adolescent. Keep the caregiver present unless they obstruct care. Children decompensate late and fast.`,
  },
  {
    id: "ebp-nursing",
    title: "Evidence-based practice in clinical nursing",
    sourceType: "web",
    sourceRef: "https://library.wccn.ac.za/ebp",
    body: `Evidence-based practice integrates the best available research with clinical expertise and the patient's values. The process starts with a focused question, often using the PICO format: population, intervention, comparison and outcome. Sources are ranked, with systematic reviews and randomised trials sitting above expert opinion, but a well-conducted local audit can outweigh a weak overseas trial. Nurses appraise validity, effect size and applicability to the Western Cape context, including language, staffing and supply constraints. Implementation needs a change plan, not a photocopied guideline left in a tea room. Evaluation asks whether the outcome moved and whether harm was introduced. Students who copy a literature review without reading the papers, or who invent citations, break the chain of evidence and the academic rules of the college. Referencing is part of honesty, not decoration.`,
  },
  {
    id: "therapeutic-comm",
    title: "Therapeutic communication in mental health nursing",
    sourceType: "textbook",
    sourceRef: "Psychiatric Nursing Skills, WCCN",
    body: `Therapeutic communication is a clinical skill, not small talk. It uses open questions, reflection, silence and clarification to help a person describe their experience without being pushed into the nurse's narrative. Closed questions have a place when risk must be established quickly: Are you thinking of ending your life? Do you have a plan? Barriers include premature advice, false reassurance, changing the subject and talking about one's own problems. Cultural and language matching matters in the Western Cape; a session conducted only in English with an Afrikaans or isiXhosa speaker is incomplete. Boundaries keep the relationship professional: no dual relationships, no social media contact, no gifts that create obligation. Documentation records the content, the mental state and the risk, not gossip. If a person discloses intent to harm an identifiable other, confidentiality yields to the duty to protect.`,
  },
  {
    id: "airway-rsi",
    title: "Rapid sequence intubation in emergency care",
    sourceType: "journal",
    sourceRef: "CEC Airway Manual",
    body: `Rapid sequence intubation is used when a full stomach is assumed and the airway must be secured without bag-mask ventilation if possible. Preparation follows a checklist: team roles, monitoring, suction, two laryngoscope blades, a bougie, correctly sized tubes, waveform capnography and a failed-airway plan. Pre-oxygenation with a tight mask or high-flow nasal oxygen extends the safe apnoea time. The induction agent and neuromuscular blocker are given in rapid succession. Cricoid pressure is no longer universal; it is applied only if the team leads it and released if the view is poor. First-pass success is the goal because repeated attempts cause hypoxia and trauma. Confirmation is by continuous waveform capnography, not by mist in the tube. Post-intubation care includes sedation, lung-protective ventilation, a chest radiograph and gastric decompression. Every intubation is logged for audit.`,
  },
  {
    id: "popia-records",
    title: "Student records, POPIA and academic integrity files",
    sourceType: "institutional",
    sourceRef: "Western Cape Government records notice",
    body: `The Western Cape Government and the Department of Health and Wellness remain the owners of all student information processed by the college. Academic integrity files, similarity reports and submitted scripts are records with a defined retention schedule. They are processed for a lawful purpose: assessing originality, investigating alleged misconduct and defending a disciplinary finding. Access is limited to the student, the assessing academic, designated administrators and, where a case proceeds, the disciplinary panel. Vendors hosting a similarity service are operators, not owners, and must not train unrelated models on student scripts or transfer them outside the agreed jurisdictions without a contract. Students are entitled to see what content matched and the sources of those matches. Reports highlight possible problems; they do not themselves constitute a finding of plagiarism or of AI-assisted misconduct.`,
  },
  {
    id: "ecg-basics",
    title: "Systematic ECG interpretation for emergency clinicians",
    sourceType: "textbook",
    sourceRef: "CEC ECG Workbook",
    body: `A systematic ECG reading prevents the common error of staring at the ST segments and missing a lethal rhythm. Confirm patient identity and the date. Calculate rate. Decide if the rhythm is regular. Identify P waves and the PR interval. Measure QRS width. Look at the axis. Inspect ST segments and T waves in territorial groups: inferior, anterior, lateral and right ventricular. A STEMI equivalent such as Wellens, de Winter or posterior infarction must be recognised even when classic ST elevation is absent. Compare with an old tracing if one exists. Document the interpretation, not only that an ECG was done. Hyperkalaemia, sodium-channel blockade and raised intracranial pressure leave characteristic patterns that are easy to miss when the mind is set on acute coronary syndrome. If the machine interpretation disagrees with the clinical picture, trust the patient and the tracing, not the algorithm.`,
  },
];

export const SAMPLE_TEXTS: {
  id: string;
  label: string;
  hint: string;
  title: string;
  text: string;
}[] = [
  {
    id: "original",
    label: "Original reflection",
    hint: "Low similarity",
    title: "Reflective account of a first trauma observation",
    text: `During my first observer shift in the resuscitation bay I expected noise and speed, but what stayed with me was how quietly the team checked each other. Before the ambulance doors opened the team leader named roles out loud, including who would talk to the family. I stood at the foot of the trolley as instructed and watched a primary survey happen in an order I had only seen on a slide. The airway clinician kept a hand on the head even while someone else cut clothes. Afterwards my mentor asked me to write what I had seen without using the textbook sequence as a crutch, so this account is from memory and from the notes I made in the tea room. I still cannot name every piece of equipment, and I had to ask what the capnography waveform was for. That question felt small at the time and now seems like the point of being a student.`,
  },
  {
    id: "copied",
    label: "Copied trauma notes",
    hint: "High similarity",
    title: "Essay: the primary survey",
    text: `This essay explains the primary survey in major trauma. The primary survey in major trauma follows a strict ABCDE sequence so that immediately life-threatening problems are found and treated before moving on. Airway with cervical spine control comes first: talk to the patient, look for obstruction, blood or vomitus, and keep the neck in a neutral position with manual in-line stabilisation. Breathing assessment includes inspection of chest wall movement, percussion, auscultation and pulse oximetry; tension pneumothorax, open chest wound and massive haemothorax must be excluded at this stage. Circulation addresses catastrophic haemorrhage, pulse quality, skin colour and capillary refill. In conclusion, nurses must document times and interventions carefully.`,
  },
  {
    id: "paraphrase",
    label: "Paraphrased protocol",
    hint: "Meaning-based match",
    title: "Managing bleeding after birth",
    text: `When a woman bleeds heavily after delivering her baby, staff should treat it as an emergency even if the measured loss is hard to judge. Blood loss of about 500 ml in the first day, or any loss that makes her unwell, counts as primary postpartum haemorrhage. A useful way to hunt for the reason is the four T ideas: tone of the uterus, trauma to the genital tract, tissue left behind, and thrombin if her clotting is failing. The uterus not contracting is the usual problem. Call other people, keep her lying down and warm, and give oxygen. Rub the fundus, pass a catheter, and start oxytocin as the labour ward protocol describes. Compression manoeuvres can hold the situation while two large drips go in and blood is sent for count, clotting and cross-match. Tranexamic acid should be given early if it is not contraindicated.`,
  },
  {
    id: "zwc",
    label: "Zero-width hidden text",
    hint: "Obfuscation + match",
    title: "Hidden-character submission",
    text: `Safe medication\u200B administration in nursing practice is organised around the five rights: the right patient, the right drug, the right dose, the right route and the right time. Identity is confirmed with two identifiers, never a bed number alone.\u200C The medication is checked against the original prescription, not a transcribed list, and allergies are reviewed every time. Dose calculation is independently double-checked for high-risk medicines including insulin, anticoagulants, opioids and paediatric formulations.`,
  },
  {
    id: "homoglyph",
    label: "Homoglyph substitution",
    hint: "Lookalike letters",
    title: "Lookalike-character essay",
    text: `Вeаuchamр and Childress describe four clusters of moral рrinciple that structure everyday nursing decisions: respect for autonomy, non-maleficence, beneficence and justice. Autonomy requires that a competent adult is given enough information to accept or refuse treatment, in a language they understand, without coercion. In South Africa this sits alongside the National Health Act and the SANC code.`,
  },
  {
    id: "ai-generic",
    label: "Generic AI-style essay",
    hint: "Authorship screen",
    title: "The importance of evidence-based practice in nursing",
    text: `In today's rapidly evolving healthcare landscape, evidence-based practice plays a pivotal role in ensuring optimal patient outcomes. It is important to note that nurses must leverage a holistic approach in order to facilitate best-practice interventions across the continuum of care. Furthermore, stakeholders should synergise to unlock value and drive meaningful change. This essay will discuss the importance of evidence-based practice, outline key benefits, and provide a comprehensive overview of implementation strategies. Firstly, evidence-based practice is vital. Secondly, it is essential. Thirdly, it is crucial. In conclusion, in this day and age, nurses must embrace evidence-based practice going forward in order to enhance quality, promote excellence, and foster a culture of continuous improvement at the end of the day.`,
  },
];

export const INSTITUTION_COURSES: {
  id: string;
  code: string;
  title: string;
  campus: "athlone" | "worcester" | "stikland" | "tygerberg";
}[] = [
  {
    id: "nsc101",
    code: "NSC101",
    title: "Foundations of Nursing Science",
    campus: "athlone",
  },
  {
    id: "mid210",
    code: "MID210",
    title: "Midwifery Emergencies",
    campus: "worcester",
  },
  {
    id: "phm180",
    code: "PHM180",
    title: "Clinical Pharmacology",
    campus: "stikland",
  },
  {
    id: "ecc110",
    code: "ECC110",
    title: "Emergency Care Practice",
    campus: "tygerberg",
  },
];

export const INSTITUTION_ASSIGNMENTS: {
  id: string;
  courseId: string;
  title: string;
  description: string;
}[] = [
  {
    id: "nsc101-a1",
    courseId: "nsc101",
    title: "Essay: professional ethics in a ward conflict",
    description: "1,500–2,000 words. Cite the SANC code. Similarity report attached on submission.",
  },
  {
    id: "mid210-a1",
    courseId: "mid210",
    title: "Protocol critique: primary PPH",
    description: "Compare local labour-ward practice with the provincial guideline.",
  },
  {
    id: "phm180-a1",
    courseId: "phm180",
    title: "Case study: high-risk medicines",
    description: "Insulin and anticoagulant safety. Show calculations.",
  },
  {
    id: "ecc110-a1",
    courseId: "ecc110",
    title: "Primary survey skill reflection",
    description: "Reflect on an observed or simulated major-trauma case using ABCDE.",
  },
];
