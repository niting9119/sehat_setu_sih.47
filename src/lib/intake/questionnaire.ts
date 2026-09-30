/**
 * SEHAT SETU — Adaptive Multi-Modal Questionnaire Engine
 * Supports Voice + Touch, Multilingual Dictionary (EN, HI, BN, TA, TE, MR),
 * Dynamic Clinical Branching, AYUSH Holistic Intake, and Provenance Generation.
 */

import { ClinicalProvenance, ChiefComplaint, AyushClinicalHistory, ModernClinicalHistory } from "@/types/clinical";

export type SupportedLanguage = "en" | "hi" | "bn" | "ta" | "te" | "mr";

export interface IntakeQuestion {
  id: string;
  category: "demographics" | "chief_complaint" | "history_present_illness" | "modern_history" | "ayush_history" | "lifestyle_nidra";
  questionKey: string;
  type: "single_choice" | "multi_choice" | "text_or_voice" | "scale" | "date";
  translations: Record<SupportedLanguage, {
    text: string;
    voicePromptText: string;
    options?: { label: string; value: string }[];
    helperText?: string;
  }>;
  adaptiveTrigger?: {
    dependsOnQuestionId: string;
    matchesValue: string | string[] | ((val: any) => boolean);
  };
  validation?: {
    required?: boolean;
    min?: number;
    max?: number;
  };
}

export const MULTILINGUAL_DICTIONARY: Record<SupportedLanguage, { languageName: string; nativeName: string }> = {
  en: { languageName: "English", nativeName: "English" },
  hi: { languageName: "Hindi", nativeName: "हिन्दी" },
  bn: { languageName: "Bengali", nativeName: "বাংলা" },
  ta: { languageName: "Tamil", nativeName: "தமிழ்" },
  te: { languageName: "Telugu", nativeName: "తెలుగు" },
  mr: { languageName: "Marathi", nativeName: "मराठी" },
};

export const CORE_INTAKE_QUESTIONS: IntakeQuestion[] = [
  // 1. Primary Chief Complaint (Voice/Text)
  {
    id: "q_chief_complaint",
    category: "chief_complaint",
    questionKey: "primary_symptom",
    type: "text_or_voice",
    translations: {
      en: {
        text: "What main health issue or discomfort brings you to the clinic today?",
        voicePromptText: "Please describe what discomfort or illness you are experiencing today in your own words.",
        helperText: "Speak clearly or type your symptoms",
      },
      hi: {
        text: "आज आपको क्या मुख्य स्वास्थ्य समस्या या परेशानी हो रही है?",
        voicePromptText: "कृपया अपनी भाषा में बताएं कि आज आपको क्या तकलीफ या बीमारी महसूस हो रही है।",
        helperText: "बोलकर या लिखकर बताएं",
      },
      bn: {
        text: "আজ আপনার প্রধান স্বাস্থ্য সমস্যা বা অসুবিধা কী?",
        voicePromptText: "আজ আপনার কী শারীরিক কষ্ট বা সমস্যা হচ্ছে তা সংক্ষেপে বলুন।",
        helperText: "মুখে বলুন বা লিখে জানান",
      },
      ta: {
        text: "இன்று உங்களுக்கு என்ன முக்கிய உடல்நலப் பிரச்சினை உள்ளது?",
        voicePromptText: "உங்களுக்கு உள்ள உடல்நலக் கோளாறைப் பற்றி உங்கள் சொந்த வார்த்தைகளில் சொல்லுங்கள்.",
        helperText: "பேசவும் அல்லது தட்டச்சு செய்யவும்",
      },
      te: {
        text: "ఈ రోజు మీకు ఎదురవుతున్న ప్రధాన ఆరోగ్య సమస్య ఏమిటి?",
        voicePromptText: "మీకు ఉన్న సమస్యను మీ మాటల్లో వివరంగా చెప్పండి.",
        helperText: "మాట్లాడండి లేదా టైప్ చేయండి",
      },
      mr: {
        text: "आज तुम्हाला कोणती मुख्य आरोग्य समस्या किंवा त्रास जाणवत आहे?",
        voicePromptText: "कृपया तुमच्या शब्दांत सांगा की आज तुम्हाला कोणता त्रास होत आहे.",
        helperText: "बोलून किंवा लिहून सांगा",
      },
    },
    validation: { required: true },
  },

  // 2. Duration of Symptom
  {
    id: "q_symptom_duration",
    category: "history_present_illness",
    questionKey: "duration",
    type: "single_choice",
    translations: {
      en: {
        text: "How long have you been experiencing this symptom?",
        voicePromptText: "Since how many hours, days, or months has this been happening?",
        options: [
          { label: "Less than 24 hours (Sudden/Acute)", value: "<24h" },
          { label: "1 to 7 days (Recent)", value: "1-7d" },
          { label: "1 to 4 weeks (Subacute)", value: "1-4w" },
          { label: "More than 1 month (Chronic/Long-term)", value: ">1m" },
        ],
      },
      hi: {
        text: "यह लक्षण आपको कितने समय से हो रहा है?",
        voicePromptText: "यह तकलीफ आपको कितने दिनों या हफ़्तों से महसूस हो रही है?",
        options: [
          { label: "24 घंटे से कम (अचानक)", value: "<24h" },
          { label: "1 से 7 दिन (हाल ही में)", value: "1-7d" },
          { label: "1 से 4 सप्ताह", value: "1-4w" },
          { label: "1 महीने से अधिक (पुरानी तकलीफ)", value: ">1m" },
        ],
      },
      bn: {
        text: "কতদিন ধরে আপনার এই উপসর্গটি হচ্ছে?",
        voicePromptText: "এই সমস্যাটি কতদিন ধরে অনুভব করছেন?",
        options: [
          { label: "২৪ ঘণ্টার কম (হঠাৎ)", value: "<24h" },
          { label: "১ থেকে ৭ দিন", value: "1-7d" },
          { label: "১ থেকে ৪ সপ্তাহ", value: "1-4w" },
          { label: "১ মাসের বেশি", value: ">1m" },
        ],
      },
      ta: {
        text: "இந்த அறிகுறி உங்களுக்கு எவ்வளவு காலமாக உள்ளது?",
        voicePromptText: "இந்த பிரச்சனை எத்தனை நாட்களாக அல்லது வாரங்களாக உள்ளது?",
        options: [
          { label: "24 மணி நேரத்திற்கும் குறைவாக", value: "<24h" },
          { label: "1 முதல் 7 நாட்கள்", value: "1-7d" },
          { label: "1 முதல் 4 வாரங்கள்", value: "1-4w" },
          { label: "1 மாதத்திற்கும் மேலாக", value: ">1m" },
        ],
      },
      te: {
        text: "ఈ లక్షణం మీకు ఎంత కాలంగా ఉంది?",
        voicePromptText: "ఈ సమస్య మీకు ఎన్ని రోజులుగా ఉంది?",
        options: [
          { label: "24 గంటల కంటే తక్కువ", value: "<24h" },
          { label: "1 నుండి 7 రోజులు", value: "1-7d" },
          { label: "1 నుండి 4 వారాలు", value: "1-4w" },
          { label: "1 నెల కంటే ఎక్కువ", value: ">1m" },
        ],
      },
      mr: {
        text: "हे लक्षण तुम्हाला किती काळापासून जाणवत आहे?",
        voicePromptText: "हा त्रास तुम्हाला किती दिवसांपासून होत आहे?",
        options: [
          { label: "२४ तासांपेक्षा कमी", value: "<24h" },
          { label: "१ ते ७ दिवस", value: "1-7d" },
          { label: "१ ते ४ आठवडे", value: "1-4w" },
          { label: "१ महिन्यापेक्षा जास्त", value: ">1m" },
        ],
      },
    },
    validation: { required: true },
  },

  // 3. Severity Scale (1 to 10)
  {
    id: "q_symptom_severity",
    category: "history_present_illness",
    questionKey: "severity_score",
    type: "scale",
    translations: {
      en: {
        text: "On a scale of 1 to 10 (where 10 is unbearable), how severe is your discomfort?",
        voicePromptText: "Please rate the severity of your pain or discomfort from 1 to 10.",
      },
      hi: {
        text: "1 से 10 के पैमाने पर (जहाँ 10 असहनीय है), आपकी तकलीफ कितनी गंभीर है?",
        voicePromptText: "कृपया अपनी तकलीफ को 1 से 10 के पैमाने पर बताएं।",
      },
      bn: {
        text: "১ থেকে ১০ এর স্কেলে (যেখানে ১০ অসহ্য), আপনার কষ্ট কতটা তীব্র?",
        voicePromptText: "আপনার কষ্ট ১ থেকে ১০ এর মধ্যে রেট করুন।",
      },
      ta: {
        text: "1 முதல் 10 வரையிலான அளவில் உங்கள் அசௌகரியம் எவ்வளவு தீவிரமானது?",
        voicePromptText: "உங்கள் வலியின் தீவிரத்தை 1 முதல் 10 வரை மதிப்பிடவும்.",
      },
      te: {
        text: "1 నుండి 10 స్కేలులో మీ అసౌకర్యం ఎంత తీవ్రంగా ఉంది?",
        voicePromptText: "మీ నొప్పి తీవ్రతను 1 నుండి 10 వరకు రేట్ చేయండి.",
      },
      mr: {
        text: "१ ते १० च्या प्रमाणात तुमच्या त्रासाची तीव्रता किती आहे?",
        voicePromptText: "कृपया तुमच्या त्रासाची तीव्रता १ ते १० मध्ये सांगा.",
      },
    },
    validation: { min: 1, max: 10, required: true },
  },

  // 4. Adaptive Question: Chest Pain Follow-up
  {
    id: "q_adaptive_chest_pain_radiation",
    category: "history_present_illness",
    questionKey: "chest_pain_radiation",
    type: "multi_choice",
    adaptiveTrigger: {
      dependsOnQuestionId: "q_chief_complaint",
      matchesValue: (val: string) =>
        /chest|heart|angina|cardiac|सीने|छाती|छातीत|বুকে|হৃদ|நெஞ்சு|மாரடைப்பு|ఛాతీ|గుండె/i.test(val || ""),
    },
    translations: {
      en: {
        text: "Adaptive Question: Does this chest discomfort radiate to any other areas or occur with sweating/breathlessness?",
        voicePromptText: "Does the chest pain spread to your left arm, neck, jaw, or back, and is there sweating?",
        options: [
          { label: "Radiates to left shoulder or arm", value: "left_arm_radiation" },
          { label: "Radiates to neck or jaw", value: "jaw_radiation" },
          { label: "Accompanied by excessive cold sweating", value: "cold_sweats" },
          { label: "Accompanied by shortness of breath", value: "dyspnea" },
          { label: "None of these (Localized chest discomfort only)", value: "none" },
        ],
      },
      hi: {
        text: "अनुकूली प्रश्न: क्या यह दर्द आपके कंधे, बाएं हाथ या जबड़े में फैलता है, या पसीना आता है?",
        voicePromptText: "क्या सीने का दर्द बाएं हाथ या जबड़े तक जाता है, और क्या पसीना आ रहा है?",
        options: [
          { label: "बाएं कंधे या हाथ में फैलता है", value: "left_arm_radiation" },
          { label: "गर्दन या जबड़े में फैलता है", value: "jaw_radiation" },
          { label: "अत्यधिक पसीना आ रहा है", value: "cold_sweats" },
          { label: "सांस लेने में कठिनाई हो रही है", value: "dyspnea" },
          { label: "इनमें से कोई नहीं", value: "none" },
        ],
      },
      bn: {
        text: "বুকে ব্যথার সাথে কি বাঁ হাত বা চোয়ালে ব্যথা ছড়াচ্ছে এবং ঘাম হচ্ছে?",
        voicePromptText: "ব্যথাটি কি অন্য কোথাও ছড়াচ্ছে এবং খুব ঘাম হচ্ছে?",
        options: [
          { label: "বাঁ কাঁধ বা হাতে ছড়ায়", value: "left_arm_radiation" },
          { label: "চোয়াল বা গলায় ছড়ায়", value: "jaw_radiation" },
          { label: "প্রচুর ঘাম হচ্ছে", value: "cold_sweats" },
          { label: "শ্বাসকষ্ট হচ্ছে", value: "dyspnea" },
          { label: "কোনোটিই নয়", value: "none" },
        ],
      },
      ta: {
        text: "நெஞ்சு வலி இடது கை அல்லது தாடை வரை பரவுகிறதா?",
        voicePromptText: "நெஞ்சு வலியுடன் வியர்வை அல்லது மூச்சுத்திணறல் உள்ளதா?",
        options: [
          { label: "இடது கைக்கு பரவுகிறது", value: "left_arm_radiation" },
          { label: "தாடைக்கு பரவுகிறது", value: "jaw_radiation" },
          { label: "அதிக வியர்வை", value: "cold_sweats" },
          { label: "மூச்சுத்திணறல்", value: "dyspnea" },
          { label: "எதுவும் இல்லை", value: "none" },
        ],
      },
      te: {
        text: "ఛాతీ నొప్పి ఎడమ చేతికి లేదా దవడకు వ్యాపిస్తుందా?",
        voicePromptText: "ఛాతీ నొప్పితో పాటు చెమటలు లేదా శ్వాస ఆడకపోవడం ఉందా?",
        options: [
          { label: "ఎడమ చేయికి వ్యాపిస్తుంది", value: "left_arm_radiation" },
          { label: "దవడకు వ్యాపిస్తుంది", value: "jaw_radiation" },
          { label: "విపరీతమైన చెమటలు", value: "cold_sweats" },
          { label: "శ్వాస ఆడకపోవడం", value: "dyspnea" },
          { label: "ఏదీ లేదు", value: "none" },
        ],
      },
      mr: {
        text: "हा छातीतील त्रास डाव्या हाताकडे किंवा जबड्याकडे पसरतो का?",
        voicePromptText: "छातीतील त्रास डाव्या हाताला पसरतो का आणि घाम येतो का?",
        options: [
          { label: "डाव्या खांद्याला/हाताला पसरतो", value: "left_arm_radiation" },
          { label: "जबड्याकडे पसरतो", value: "jaw_radiation" },
          { label: "खूप घाम येतो", value: "cold_sweats" },
          { label: "श्वास घेण्यास त्रास होतो", value: "dyspnea" },
          { label: "यातले काहीही नाही", value: "none" },
        ],
      },
    },
  },

  // 5. AYUSH Prakriti & Digestive Agni Assessment
  {
    id: "q_ayush_agni_appetite",
    category: "ayush_history",
    questionKey: "agni_status",
    type: "single_choice",
    translations: {
      en: {
        text: "AYUSH Assessment: How is your natural digestion and appetite (Agni)?",
        voicePromptText: "How is your digestion? Is it regular and balanced, burning/acidic, or slow and heavy?",
        options: [
          { label: "Sama Agni — Balanced appetite & comfortable digestion", value: "sama" },
          { label: "Tikshna Agni — Intense appetite, acidity, burning sensation (Pitta)", value: "tikshna" },
          { label: "Manda Agni — Heavy, slow digestion, sluggishness after food (Kapha)", value: "manda" },
          { label: "Vishama Agni — Irregular hunger, bloating, fluctuating appetite (Vata)", value: "vishama" },
        ],
      },
      hi: {
        text: "आयुष मूल्यांकन: आपकी पाचन अग्नि और भूख (अग्नि) की स्थिति कैसी है?",
        voicePromptText: "आपकी पाचन शक्ति कैसी है? क्या भूख सामान्य है, बहुत तेज़ जलन वाली, या धीमी और भारी?",
        options: [
          { label: "सम अग्नि — संतुलित भूख और सहज पाचन", value: "sama" },
          { label: "तीक्ष्ण अग्नि — तेज़ भूख, एसिडिटी, जलन (पित्त)", value: "tikshna" },
          { label: "मन्द अग्नि — भारीपन, धीमा पाचन, आलस्य (कफ)", value: "manda" },
          { label: "विषम अग्नि — अनिश्चित भूख, पेट फूलना, गैस (वात)", value: "vishama" },
        ],
      },
      bn: {
        text: "আয়ুষ মূল্যায়ন: আপনার হজম ক্ষমতা ও ক্ষুধা কেমন?",
        voicePromptText: "আপনার হজম কেমন হচ্ছে? স্বাভাবিক, নাকি গ্যাস ও বদহজম?",
        options: [
          { label: "সাম অগ্নি — সুষম ক্ষুধা ও সহজ পরিপাক", value: "sama" },
          { label: "তীক্ষ্ণ অগ্নি — তীব্র ক্ষুধা, অম্বল ও জ্বালাপোড়া (পিত্ত)", value: "tikshna" },
          { label: "মন্দ অগ্নি — ভারি ভাব, ধীর পরিপাক (কফ)", value: "manda" },
          { label: "বিষম অগ্নি — অনিয়মিত ক্ষুধা ও পেট ফাঁপা (বাত)", value: "vishama" },
        ],
      },
      ta: {
        text: "ஆயுஷ் மதிப்பீடு: உங்கள் செரிமான சக்தி மற்றும் பசி எவ்வாறு உள்ளது?",
        voicePromptText: "உங்கள் செரிமானம் எவ்வாறு உள்ளது?",
        options: [
          { label: "சம அக்னி — சீரான பசி மற்றும் செரிமானம்", value: "sama" },
          { label: "தீக்ஷ்ண அக்னி — அதிக பசி, நெஞ்செரிச்சல் (பித்தம்)", value: "tikshna" },
          { label: "மந்த அக்னி — மந்தமான செரிமானம், சோர்வு (கபம்)", value: "manda" },
          { label: "விஷம அக்னி — ஒழுங்கற்ற பசி, வாயு (வாதம்)", value: "vishama" },
        ],
      },
      te: {
        text: "ఆయుష్ అసెస్మెంట్: మీ జీర్ణశక్తి మరియు ఆకలి ఎలా ఉంది?",
        voicePromptText: "మీ జీర్ణక్రియ ఎలా ఉంది?",
        options: [
          { label: "సమ అగ్ని — సమతుల్య ఆకలి మరియు జీర్ణం", value: "sama" },
          { label: "తీక్షణ అగ్ని — అధిక ఆకలి, ఎసిడిటీ (పిత్త)", value: "tikshna" },
          { label: "మంద అగ్ని — నెమ్మదిగా జీర్ణం, మందకొడితనం (కఫ)", value: "manda" },
          { label: "విషమ అగ్ని — క్రమం లేని ఆకలి, గ్యాస్ (వాత)", value: "vishama" },
        ],
      },
      mr: {
        text: "आयुष मूल्यांकन: तुमची पचनशक्ती आणि भूक (अग्नी) कशी आहे?",
        voicePromptText: "तुमची पचनशक्ती कशी आहे? नियमित, खूप जळजळणारी की मंद?",
        options: [
          { label: "सम अग्नी — संतुलित भूक व सहज पचन", value: "sama" },
          { label: "तीक्ष्ण अग्नी — तीव्र भूक, ॲसिडिटी (पित्त)", value: "tikshna" },
          { label: "मन्द अग्नी — जड वाटणे, सावकाश पचन (कफ)", value: "manda" },
          { label: "विषम अग्नी — अनियमित भूक, गॅसेस (वात)", value: "vishama" },
        ],
      },
    },
    validation: { required: true },
  },

  // 6. AYUSH Traditional Formulations / Remedies History
  {
    id: "q_ayush_traditional_meds",
    category: "ayush_history",
    questionKey: "traditional_meds_used",
    type: "text_or_voice",
    translations: {
      en: {
        text: "Are you currently taking any Ayurvedic, Homeopathic, Unani, Siddha, or herbal remedies?",
        voicePromptText: "Please tell us if you take any traditional or herbal formulations, Kadhas, or Homeopathic pills.",
        helperText: "e.g. Ashwagandha churna, Chyawanprash, Arnica 30, Nilavembu kudineer, etc.",
      },
      hi: {
        text: "क्या आप वर्तमान में कोई आयुर्वेदिक, होम्योपैथिक, यूनानी, सिद्ध या घरेलू काढ़ा/दवा ले रहे हैं?",
        voicePromptText: "कृपया बताएं कि क्या आप कोई पारंपरिक या आयुर्वेदिक दवा, काढ़ा या गोलियां ले रहे हैं।",
        helperText: "जैसे: अश्वगंधा, च्यवनप्राश, त्रिफला, गिलोय आदि",
      },
      bn: {
        text: "আপনি কি কোনো আয়ুর্বেদিক, হোমিওপ্যাথি বা ভেষজ ওষুধ খাচ্ছেন?",
        voicePromptText: "আপনি কোনো ভেষজ বা হোমিওপ্যাথি ওষুধ খাচ্ছেন কি না জানান।",
        helperText: "যেমন: ত্রিফলা, অশ্বগন্ধা, তুলসী ইত্যাদি",
      },
      ta: {
        text: "நீங்கள் ஏதேனும் ஆயுர்வேத, ஹோமியோபதி அல்லது மூலிகை மருந்துகளை எடுத்துக்கொள்கிறீர்களா?",
        voicePromptText: "நீங்கள் எடுத்துக்கொள்ளும் பாரம்பரிய மருந்துகளைப் பற்றி கூறுங்கள்.",
        helperText: "எ.கா. நிலவேம்பு குடிநீர், அஸ்வகந்தா போன்றவை",
      },
      te: {
        text: "మీరు ప్రస్తుతం ఏవైనా ఆయుర్వేద, హోమియోపతి లేదా మూలికా ఔషధాలను తీసుకుంటున్నారా?",
        voicePromptText: "మీరు తీసుకుంటున్న సాంప్రదాయ మందుల గురించి చెప్పండి.",
        helperText: "ఉదా: అశ్వగంధ, త్రిఫల మొదలైనవి",
      },
      mr: {
        text: "तुम्ही सध्या कोणतीही आयुर्वेदिक, होमिओपॅथिक किंवा पारंपरिक औषधे घेत आहात का?",
        voicePromptText: "कृपया सांगा की तुम्ही कोणताही काढा किंवा पारंपरिक औषध घेत आहात का.",
        helperText: "उदा. अश्वगंधा, त्रिफळा, गुळवेल इत्यादी",
      },
    },
  },

  // 7. Nidra & Lifestyle Pattern
  {
    id: "q_ayush_sleep_nidra",
    category: "lifestyle_nidra",
    questionKey: "sleep_quality",
    type: "single_choice",
    translations: {
      en: {
        text: "How is your regular sleep pattern and rest quality (Nidra)?",
        voicePromptText: "How do you sleep at night? Is it sound and restful, or disturbed with waking up?",
        options: [
          { label: "Sound & restorative (6-8 hours undisturbed)", value: "sound" },
          { label: "Disturbed / Frequent waking (Vata/Pitta disturbance)", value: "disturbed" },
          { label: "Difficulty falling asleep (Initial insomnia)", value: "insomnia" },
          { label: "Excessive daytime sleepiness / Lethargy (Kapha heaviness)", value: "excessive" },
        ],
      },
      hi: {
        text: "आपकी नींद और विश्राम (निद्रा) की गुणवत्ता कैसी है?",
        voicePromptText: "आपकी रात की नींद कैसी रहती है? गहरी नींद, या बार-बार टूटने वाली?",
        options: [
          { label: "गहरी और ताज़गी भरी नींद (6-8 घंटे)", value: "sound" },
          { label: "अशांत नींद / बार-बार जागना", value: "disturbed" },
          { label: "नींद आने में कठिनाई", value: "insomnia" },
          { label: "अत्यधिक नींद और दिन में भारीपन", value: "excessive" },
        ],
      },
      bn: {
        text: "আপনার ঘুমের মান কেমন?",
        voicePromptText: "রাতে আপনার কেমন ঘুম হয়?",
        options: [
          { label: "গভীর ও ভালো ঘুম", value: "sound" },
          { label: "মাঝে মাঝে ঘুম ভেঙে যায়", value: "disturbed" },
          { label: "ঘুম আসতে দেরি হয়", value: "insomnia" },
          { label: "অতিরিক্ত ঘুম ও ক্লান্তি", value: "excessive" },
        ],
      },
      ta: {
        text: "உங்கள் தூக்கத்தின் தரம் எவ்வாறு உள்ளது?",
        voicePromptText: "இரவில் உங்கள் தூக்கம் எப்படி இருக்கிறது?",
        options: [
          { label: "ஆழ்ந்த தூக்கம் (6-8 மணி நேரம்)", value: "sound" },
          { label: "அடிக்கடி விழிப்பு வரும் தூக்கம்", value: "disturbed" },
          { label: "தூங்குவதில் சிரமம்", value: "insomnia" },
          { label: "அதிக தூக்கம் மற்றும் சோர்வு", value: "excessive" },
        ],
      },
      te: {
        text: "మీ నిద్ర నాణ్యత ఎలా ఉంది?",
        voicePromptText: "రాత్రిపూట మీ నిద్ర ఎలా ఉంటుంది?",
        options: [
          { label: "గాఢ నిద్ర (6-8 గంటలు)", value: "sound" },
          { label: "తరచుగా మెలకువ రావడం", value: "disturbed" },
          { label: "నిద్ర పట్టడంలో ఇబ్బంది", value: "insomnia" },
          { label: "అధిక నిద్ర మరియు నీరసం", value: "excessive" },
        ],
      },
      mr: {
        text: "तुमची झोप (निद्रा) आणि विश्रांती कशी आहे?",
        voicePromptText: "रात्री तुमची झोप कशी होते?",
        options: [
          { label: "शांत आणि गाढ झोप (६-८ तास)", value: "sound" },
          { label: "अशांत झोप / वारंवार जागे होणे", value: "disturbed" },
          { label: "झोप न लागणे", value: "insomnia" },
          { label: "अति झोप आणि सुस्ती", value: "excessive" },
        ],
      },
    },
    validation: { required: true },
  },
];

/**
 * Filter questions dynamically based on previous answers and adaptive triggers
 */
export function getActiveQuestions(answers: Record<string, any>): IntakeQuestion[] {
  return CORE_INTAKE_QUESTIONS.filter((question) => {
    if (!question.adaptiveTrigger) {
      return true;
    }
    const trigger = question.adaptiveTrigger;
    const parentAnswer = answers[trigger.dependsOnQuestionId];

    if (parentAnswer === undefined || parentAnswer === null || parentAnswer === "") {
      return false;
    }

    if (typeof trigger.matchesValue === "function") {
      return trigger.matchesValue(parentAnswer);
    }

    if (Array.isArray(trigger.matchesValue)) {
      return trigger.matchesValue.includes(parentAnswer);
    }

    return parentAnswer === trigger.matchesValue;
  });
}

/**
 * Creates an immutable provenance tag for any question answer
 */
export function createIntakeProvenance(
  questionId: string,
  rawAnswer: string,
  mode: "voice_intake" | "touch_form" = "touch_form",
  confidence: number = 1.0
): ClinicalProvenance {
  return {
    sourceId: `intake_${questionId}_${Date.now()}`,
    sourceType: mode,
    sourceName: mode === "voice_intake" ? "Voice Patient Intake" : "Touch Screen Case-Taking",
    locationOrOffset: `Question [${questionId}]`,
    timestamp: new Date().toISOString(),
    confidence,
    rawEvidenceSnippet: String(rawAnswer),
  };
}

/**
 * Synthesizes structured ChiefComplaint and AYUSH intake from answered questions
 */
export function synthesizeIntakeSession(
  answers: Record<string, any>,
  inputMode: "voice_intake" | "touch_form" = "touch_form"
): {
  chiefComplaints: ChiefComplaint[];
  ayushHistory: AyushClinicalHistory;
} {
  const primarySymptom = answers["q_chief_complaint"] || "General discomfort";
  const duration = answers["q_symptom_duration"] || "Recent";
  const severityScore = Number(answers["q_symptom_severity"]) || 5;

  const severityLevel: "mild" | "moderate" | "severe" =
    severityScore >= 8 ? "severe" : severityScore >= 4 ? "moderate" : "mild";

  const associated: string[] = [];
  if (answers["q_adaptive_chest_pain_radiation"]) {
    const radiationVal = answers["q_adaptive_chest_pain_radiation"];
    if (Array.isArray(radiationVal)) {
      associated.push(...radiationVal);
    } else {
      associated.push(String(radiationVal));
    }
  }

  const chiefComplaints: ChiefComplaint[] = [
    {
      complaint: primarySymptom,
      duration,
      severity: severityLevel,
      onset: duration === "<24h" ? "acute" : "gradual",
      progression: severityScore >= 7 ? "worsening" : "fluctuating",
      associatedSymptoms: associated,
      aggravatingFactors: [],
      relievingFactors: [],
      provenance: createIntakeProvenance("q_chief_complaint", primarySymptom, inputMode, 0.98),
    },
  ];

  // AYUSH synthesis
  const agniRaw = answers["q_ayush_agni_appetite"] || "sama";
  let agniStatus: AyushClinicalHistory["agniStatus"] = "Sama (Balanced)";
  if (agniRaw === "tikshna") agniStatus = "Tikshna (Intense - Pitta)";
  else if (agniRaw === "manda") agniStatus = "Manda (Slow - Kapha)";
  else if (agniRaw === "vishama") agniStatus = "Vishama (Irregular - Vata)";

  const traditionalMedsRaw = answers["q_ayush_traditional_meds"];
  const traditionalRemedies: AyushClinicalHistory["traditionalRemediesUsed"] = [];
  if (traditionalMedsRaw && traditionalMedsRaw.trim().length > 0) {
    traditionalRemedies.push({
      id: `ayush_med_${Date.now()}`,
      value: {
        formulationName: traditionalMedsRaw.trim(),
        ayushSystem: /arnica|homeo/i.test(traditionalMedsRaw)
          ? "Homeopathy"
          : /unani/i.test(traditionalMedsRaw)
          ? "Unani"
          : /kudineer|siddha/i.test(traditionalMedsRaw)
          ? "Siddha"
          : "Ayurveda",
        duration: "Ongoing",
        perceivedEffect: "Reported in case-taking",
      },
      provenance: createIntakeProvenance("q_ayush_traditional_meds", traditionalMedsRaw, inputMode, 0.95),
      status: "unverified_ai",
    });
  }

  const sleepRaw = answers["q_ayush_sleep_nidra"] || "sound";
  let sleepQuality: AyushClinicalHistory["sleepPatternNidra"]["quality"] = "Sound";
  if (sleepRaw === "disturbed") sleepQuality = "Disturbed";
  else if (sleepRaw === "insomnia") sleepQuality = "Insomnia";
  else if (sleepRaw === "excessive") sleepQuality = "Excessive";

  // Derive initial Prakriti tendencies
  const dominantDosha =
    agniRaw === "tikshna"
      ? "Pitta"
      : agniRaw === "vishama"
      ? "Vata"
      : agniRaw === "manda"
      ? "Kapha"
      : "Undetermined";

  const ayushHistory: AyushClinicalHistory = {
    prakritiAssessment: {
      dominantDosha,
      characteristicsObserved: [`Agni response: ${agniRaw}`, `Sleep quality: ${sleepRaw}`],
      confidence: 0.82,
    },
    agniStatus,
    koshthaType: "Madhyama (Medium/Regular)",
    traditionalRemediesUsed: traditionalRemedies,
    dietaryHabitsPathyaApathya: {
      dietType: "Vegetarian",
      tastePreferences: [],
      mealTimingRegularity: "Regular",
    },
    sleepPatternNidra: {
      hoursPerNight: 7,
      quality: sleepQuality,
      daySleep: sleepRaw === "excessive",
    },
  };

  return { chiefComplaints, ayushHistory };
}
